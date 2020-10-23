const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema } = require('graphql')
const { makeMigrations } = require('../../migrations')
const { checkPermission } = require('../auth')
const { cleanseInput } = require('../validators')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')
const { userLoaderByKey, orgLoaderConnectionsByUserId } = require('../loaders')

describe('given the isUserAdmin query', () => {
  let query, drop, truncate, migrate, schema, collections, org

  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
  })

  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
    })
    org = await collections.organizations.save({
      orgDetails: {
        en: {
          slug: 'treasury-board-secretariat',
          acronym: 'TBS',
          name: 'Treasury Board of Canada Secretariat',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'secretariat-conseil-tresor',
          acronym: 'SCT',
          name: 'Secrétariat du Conseil Trésor du Canada',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
    })
    consoleOutput = []
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful query', () => {
    let user
    beforeEach(async () => {
      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      user = await userCursor.next()
    })
    describe('if the user is a super admin for an organization', () => {
      beforeEach(async () => {
        await query`
          INSERT {
            _from: ${org._id},
            _to: ${user._id},
            permission: "super_admin"
          } INTO affiliations
        `
      })
      afterEach(async () => {
        await query`
          LET userEdges = (FOR v, e IN 1..1 ANY ${org._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
          LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
          RETURN true
        `
        await query`
          FOR affiliation IN affiliations
            REMOVE affiliation IN affiliations
        `
      })
      it('will return true', async () => {
        const response = await graphql(
          schema,
          `
            query {
              isUserAdmin
            }
          `,
          null,
          {
            userId: user._key,
            query: query,
            auth: {
              checkPermission,
            },
            loaders: {
              userLoaderByKey: userLoaderByKey(query),
              orgLoaderConnectionsByUserId: orgLoaderConnectionsByUserId(
                query,
                user._key,
                cleanseInput,
                'en',
              ),
            },
          },
        )

        const expectedResponse = {
          data: {
            isUserAdmin: true,
          },
        }
        expect(response).toEqual(expectedResponse)
      })
    })
    describe('if the user is an admin for an organization', () => {
      beforeEach(async () => {
        await query`
          INSERT {
            _from: ${org._id},
            _to: ${user._id},
            permission: "admin"
          } INTO affiliations
        `
      })
      afterEach(async () => {
        await query`
          LET userEdges = (FOR v, e IN 1..1 ANY ${org._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
          LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
          RETURN true
        `
        await query`
          FOR affiliation IN affiliations
            REMOVE affiliation IN affiliations
        `
      })
      it('will return true', async () => {
        const response = await graphql(
          schema,
          `
            query {
              isUserAdmin
            }
          `,
          null,
          {
            userId: user._key,
            query: query,
            auth: {
              checkPermission,
            },
            loaders: {
              userLoaderByKey: userLoaderByKey(query),
              orgLoaderConnectionsByUserId: orgLoaderConnectionsByUserId(
                query,
                user._key,
                cleanseInput,
                'en',
              ),
            },
          },
        )

        const expectedResponse = {
          data: {
            isUserAdmin: true,
          },
        }
        expect(response).toEqual(expectedResponse)
      })
    })
    describe('if the user is only a user for their organization(s)', () => {
      beforeEach(async () => {
        await query`
          INSERT {
            _from: ${org._id},
            _to: ${user._id},
            permission: "user"
          } INTO affiliations
        `
      })
      afterEach(async () => {
        await query`
          LET userEdges = (FOR v, e IN 1..1 ANY ${org._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
          LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
          RETURN true
        `
        await query`
          FOR affiliation IN affiliations
            REMOVE affiliation IN affiliations
        `
      })
      it('will return false', async () => {
        const response = await graphql(
          schema,
          `
            query {
              isUserAdmin
            }
          `,
          null,
          {
            userId: user._key,
            query: query,
            auth: {
              checkPermission,
            },
            loaders: {
              userLoaderByKey: userLoaderByKey(query),
              orgLoaderConnectionsByUserId: orgLoaderConnectionsByUserId(
                query,
                user._key,
                cleanseInput,
                'en',
              ),
            },
          },
        )

        const expectedResponse = {
          data: {
            isUserAdmin: false,
          },
        }
        expect(response).toEqual(expectedResponse)
      })
    })
  })
})
