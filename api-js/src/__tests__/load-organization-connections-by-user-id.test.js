const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
const { cleanseInput } = require('../validators')
const {
  orgLoaderConnectionsByUserId,
  orgLoaderByKey,
} = require('../loaders')
const { toGlobalId } = require('graphql-relay')

describe('given the load organization connections by user id function', () => {
  let query, drop, truncate, migrate, collections

  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.error = mockedError
    console.warn = mockedWarn
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
  })

  beforeEach(async () => {
    await truncate()
    await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
    })
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })
  describe('given a successful load', () => {
    describe('given there are organization connections to be returned', () => {
      let user, orgOne, orgTwo
      beforeEach(async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        user = await userCursor.next()
        orgOne = await collections.organizations.save({
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
        orgTwo = await collections.organizations.save({
          orgDetails: {
            en: {
              slug: 'not-treasury-board-secretariat',
              acronym: 'NTBS',
              name: 'Not Treasury Board of Canada Secretariat',
              zone: 'NFED',
              sector: 'NTBS',
              country: 'Canada',
              province: 'Ontario',
              city: 'Ottawa',
            },
            fr: {
              slug: 'ne-pas-secretariat-conseil-tresor',
              acronym: 'NPSCT',
              name: 'Ne Pas Secrétariat du Conseil Trésor du Canada',
              zone: 'NPFED',
              sector: 'NPTBS',
              country: 'Canada',
              province: 'Ontario',
              city: 'Ottawa',
            },
          },
        })
        await collections.affiliations.save({
          _from: orgOne._id,
          _to: user._id,
          permission: 'user',
        })
        await collections.affiliations.save({
          _from: orgTwo._id,
          _to: user._id,
          permission: 'user',
        })
      })
      afterEach(async () => {
        await query`
          LET userEdges = (FOR v, e IN 1..1 ANY ${orgOne._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
          LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
          RETURN true
        `
        await query`
          LET userEdges = (FOR v, e IN 1..1 ANY ${orgTwo._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
          LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
          RETURN true
        `
        await query`
          FOR affiliation IN affiliations
            REMOVE affiliation IN affiliations
        `
      })
      describe('using no cursor and no limit', () => {
        it('returns organizations', async () => {
          const connectionLoader = orgLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
          )

          const connectionArgs = {}
          const orgs = await connectionLoader({ ...connectionArgs })

          const orgLoader = orgLoaderByKey(query)
          const expectedOrgs = await orgLoader.loadMany([
            orgOne._key,
            orgTwo._key,
          ])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('organizations', expectedOrgs[0]._key),
                node: {
                  ...expectedOrgs[0],
                },
              },
              {
                cursor: toGlobalId('organizations', expectedOrgs[1]._key),
                node: {
                  ...expectedOrgs[1],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('organizations', expectedOrgs[0]._key),
              endCursor: toGlobalId('organizations', expectedOrgs[1]._key),
            },
          }

          expect(expectedOrgs).toEqual(expectedStructure)
        })
      })
      describe('using after cursor', () => {
        it('returns an organization', async () => {
          const connectionLoader = orgLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
          )

          const orgLoader = orgLoaderByKey(query)
          const expectedOrgs = await orgLoader.loadMany([
            orgOne._key,
            orgTwo._key,
          ])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            after: toGlobalId('organizations', expectedOrgs[0].id),
          }
          const orgs = await connectionLoader({ ...connectionArgs })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('organizations', expectedOrgs[1]._key),
                node: {
                  ...expectedOrgs[1],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('organizations', expectedOrgs[1]._key),
              endCursor: toGlobalId('organizations', expectedOrgs[1]._key),
            },
          }

          expect(expectedOrgs).toEqual(expectedStructure)
        })
      })
      describe('using before cursor', () => {
        it('returns an organization', async () => {
          const connectionLoader = orgLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
          )

          const orgLoader = orgLoaderByKey(query)
          const expectedOrgs = await orgLoader.loadMany([
            orgOne._key,
            orgTwo._key,
          ])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            before: toGlobalId('organizations', expectedOrgs[1].id),
          }
          const orgs = await connectionLoader({ ...connectionArgs })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('organizations', expectedOrgs[0]._key),
                node: {
                  ...expectedOrgs[0],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('organizations', expectedOrgs[0]._key),
              endCursor: toGlobalId('organizations', expectedOrgs[0]._key),
            },
          }

          expect(expectedOrgs).toEqual(expectedStructure)
        })
      })
      describe('using first limit', () => {
        it('returns an organization', async () => {
          const connectionLoader = orgLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
          )

          const orgLoader = orgLoaderByKey(query)
          const expectedOrgs = await orgLoader.loadMany([
            orgOne._key,
            orgTwo._key,
          ])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            first: 1,
          }
          const orgs = await connectionLoader({ ...connectionArgs })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('organizations', expectedOrgs[0]._key),
                node: {
                  ...expectedOrgs[0],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('organizations', expectedOrgs[0]._key),
              endCursor: toGlobalId('organizations', expectedOrgs[0]._key),
            },
          }

          expect(expectedOrgs).toEqual(expectedStructure)
        })
      })
      describe('using last limit', () => {
        it('returns an organization', async () => {
          const connectionLoader = orgLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
          )

          const orgLoader = orgLoaderByKey(query)
          const expectedOrgs = await orgLoader.loadMany([
            orgOne._key,
            orgTwo._key,
          ])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            last: 1,
          }
          const orgs = await connectionLoader({ ...connectionArgs })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('organizations', expectedOrgs[1]._key),
                node: {
                  ...expectedOrgs[1],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('organizations', expectedOrgs[1]._key),
              endCursor: toGlobalId('organizations', expectedOrgs[1]._key),
            },
          }

          expect(expectedOrgs).toEqual(expectedStructure)
        })
      })
    })
    describe('given there are no domain connections to be returned', () => {
      let user
      beforeEach(async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        user = await userCursor.next()
      })
      it('returns no organization connections', async () => {
        const connectionLoader = orgLoaderConnectionsByUserId(
          query,
          user._key,
          cleanseInput,
        )

        const connectionArgs = {}
        const orgs = await connectionLoader({ ...connectionArgs })

        const expectedStructure = {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: '',
            endCursor: '',
          },
        }

        expect(orgs).toEqual(expectedStructure)
      })
    })
  })
  describe('given an unsuccessful load', () => {
    let user, orgOne, orgTwo
    beforeEach(async () => {
      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      user = await userCursor.next()
      orgOne = await collections.organizations.save({
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
      orgTwo = await collections.organizations.save({
        orgDetails: {
          en: {
            slug: 'not-treasury-board-secretariat',
            acronym: 'NTBS',
            name: 'Not Treasury Board of Canada Secretariat',
            zone: 'NFED',
            sector: 'NTBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
          fr: {
            slug: 'ne-pas-secretariat-conseil-tresor',
            acronym: 'NPSCT',
            name: 'Ne Pas Secrétariat du Conseil Trésor du Canada',
            zone: 'NPFED',
            sector: 'NPTBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
        },
      })
      await collections.affiliations.save({
        _from: orgOne._id,
        _to: user._id,
        permission: 'user',
      })
      await collections.affiliations.save({
        _from: orgTwo._id,
        _to: user._id,
        permission: 'user',
      })
    })
    afterEach(async () => {
      await query`
        LET userEdges = (FOR v, e IN 1..1 ANY ${orgOne._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
        LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
        RETURN true
      `
      await query`
        LET userEdges = (FOR v, e IN 1..1 ANY ${orgTwo._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
        LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
        RETURN true
      `
      await query`
        FOR affiliation IN affiliations
          REMOVE affiliation IN affiliations
      `
    })
    describe('first and last arguments are set', () => {
      it('returns an error message', async () => {
        const connectionLoader = orgLoaderConnectionsByUserId(
          query,
          user._key,
          cleanseInput,
        )

        const connectionArgs = {
          first: 1,
          last: 1,
        }
        try {
          await connectionLoader({
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Error, unable to have first, and last set at the same time.',
            ),
          )
        }

        expect(consoleOutput).toEqual([
          `User: ${user._key} tried to have first and last set in organization connection query`,
        ])
      })
    })
  })
  describe('given a database error', () => {
    let user, orgOne, orgTwo
    beforeEach(async () => {
      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      user = await userCursor.next()
      orgOne = await collections.organizations.save({
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
      orgTwo = await collections.organizations.save({
        orgDetails: {
          en: {
            slug: 'not-treasury-board-secretariat',
            acronym: 'NTBS',
            name: 'Not Treasury Board of Canada Secretariat',
            zone: 'NFED',
            sector: 'NTBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
          fr: {
            slug: 'ne-pas-secretariat-conseil-tresor',
            acronym: 'NPSCT',
            name: 'Ne Pas Secrétariat du Conseil Trésor du Canada',
            zone: 'NPFED',
            sector: 'NPTBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
        },
      })
      await collections.affiliations.save({
        _from: orgOne._id,
        _to: user._id,
        permission: 'user',
      })
      await collections.affiliations.save({
        _from: orgTwo._id,
        _to: user._id,
        permission: 'user',
      })
    })
    afterEach(async () => {
      await query`
        LET userEdges = (FOR v, e IN 1..1 ANY ${orgOne._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
        LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
        RETURN true
      `
      await query`
        LET userEdges = (FOR v, e IN 1..1 ANY ${orgTwo._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
        LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
        RETURN true
      `
      await query`
        FOR affiliation IN affiliations
          REMOVE affiliation IN affiliations
      `
    })
    describe('while querying domains', () => {
      it('returns an error message', async () => {
        const query = jest
          .fn().mockRejectedValue(
            new Error('Unable to query organizations. Please try again.'),
          )

        const connectionLoader = orgLoaderConnectionsByUserId(
          query,
          user._key,
          cleanseInput,
        )

        const connectionArgs = {}
        try {
          await connectionLoader({
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to query organizations. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to query organizations in loadOrganizationsByUser.`,
        ])
      })
    })
  })
  describe('given a cursor error', () => {
    let user, orgOne, orgTwo
    beforeEach(async () => {
      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      user = await userCursor.next()
      orgOne = await collections.organizations.save({
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
      orgTwo = await collections.organizations.save({
        orgDetails: {
          en: {
            slug: 'not-treasury-board-secretariat',
            acronym: 'NTBS',
            name: 'Not Treasury Board of Canada Secretariat',
            zone: 'NFED',
            sector: 'NTBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
          fr: {
            slug: 'ne-pas-secretariat-conseil-tresor',
            acronym: 'NPSCT',
            name: 'Ne Pas Secrétariat du Conseil Trésor du Canada',
            zone: 'NPFED',
            sector: 'NPTBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
        },
      })
      await collections.affiliations.save({
        _from: orgOne._id,
        _to: user._id,
        permission: 'user',
      })
      await collections.affiliations.save({
        _from: orgTwo._id,
        _to: user._id,
        permission: 'user',
      })
    })
    afterEach(async () => {
      await query`
        LET userEdges = (FOR v, e IN 1..1 ANY ${orgOne._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
        LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
        RETURN true
      `
      await query`
        LET userEdges = (FOR v, e IN 1..1 ANY ${orgTwo._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
        LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
        RETURN true
      `
      await query`
        FOR affiliation IN affiliations
          REMOVE affiliation IN affiliations
      `
    })
    describe('while gathering domains', () => {
      it('returns an error message', async () => {
        const cursor = {
          next() {
            throw new Error('Unable to load organizations. Please try again.')
          },
        }
        const query = jest
          .fn()
          .mockReturnValueOnce([orgOne._id, orgTwo._id]).mockReturnValueOnce(cursor)

        const connectionLoader = orgLoaderConnectionsByUserId(
          query,
          user._key,
          cleanseInput,
        )

        const connectionArgs = {}
        try {
          await connectionLoader({
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to load organizations. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to gather organizations in loadOrganizationsByUser.`,
        ])
      })
    })
  })
})
