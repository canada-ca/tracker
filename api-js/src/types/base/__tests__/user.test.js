const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { makeMigrations } = require('../../../../migrations')
const { userRequired } = require('../../../auth')
const { createQuerySchema } = require('../../../queries')
const { createMutationSchema } = require('../../../mutations')
const {
  userLoaderByKey,
  affiliationLoaderByUserId,
  orgLoaderByKey,
} = require('../../../loaders')
const { cleanseInput } = require('../../../validators')

describe('given the user object', () => {
  let query,
    drop,
    truncate,
    migrate,
    schema,
    collections,
    user,
    org,
    affiliation

  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
  })

  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    await truncate()
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
    })
    org = await collections.organizations.save({
      verified: false,
      summaries: {
        web: {
          pass: 50,
          fail: 1000,
          total: 1050,
        },
        mail: {
          pass: 50,
          fail: 1000,
          total: 1050,
        },
      },
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
    affiliation = await collections.affiliations.save({
      _to: user._id,
      _from: org._id,
      permission: 'user',
    })
    consoleOutput = []
  })

  afterEach(async () => {
    await drop()
  })

  describe('all fields are being queried', () => {
    it('returns all fields', async () => {
      const response = await graphql(
        schema,
        `
          query {
            findMe {
              id
              userName
              displayName
              preferredLang
              tfaValidated
              emailValidated
              affiliations(first: 5) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        `,
        null,
        {
          auth: {
            userRequired: userRequired({
              userId: user._key,
              userLoaderByKey: userLoaderByKey(query),
            }),
          },
          loaders: {
            userLoaderByKey: userLoaderByKey(query, user._key),
            orgLoaderByKey: orgLoaderByKey(query, 'en', user._key),
            affiliationLoaderByUserId: affiliationLoaderByUserId(
              query,
              user._key,
              cleanseInput,
            ),
          },
        },
      )

      const expectedResponse = {
        data: {
          findMe: {
            id: toGlobalId('users', user._key),
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'FRENCH',
            tfaValidated: false,
            emailValidated: false,
            affiliations: {
              edges: [
                {
                  node: {
                    id: toGlobalId('affiliations', affiliation._key),
                  },
                },
              ],
            },
          },
        },
      }
      expect(response).toEqual(expectedResponse)
    })
  })
})
