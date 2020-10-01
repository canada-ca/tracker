const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
const { cleanseInput } = require('../validators')
const {
  domainLoaderConnectionsByUserId,
  domainLoaderByKey,
} = require('../loaders')
const { toGlobalId } = require('graphql-relay')

describe('given the load domain connections by user id function', () => {
  let query, drop, truncate, migrate, collections, user, org

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
    user = await collections.users.save({
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

  afterAll(async () => {
    await drop()
  })
  describe('given a successful load', () => {
    describe('given there are domain connections to be returned', () => {
      let user, domainOne, domainTwo
      beforeEach(async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        user = await userCursor.next()
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'user',
        })
        domainOne = await collections.domains.save({
          domain: 'test1.gc.ca',
          slug: 'test1-gc-ca',
          lastRan: null,
          selectors: ['selector1._domainkey', 'selector2._domainkey'],
        })
        domainTwo = await collections.domains.save({
          domain: 'test2.gc.ca',
          slug: 'test2-gc-ca',
          lastRan: null,
          selectors: ['selector1._domainkey', 'selector2._domainkey'],
        })
        await collections.claims.save({
          _to: domainOne._id,
          _from: org._id,
        })
        await collections.claims.save({
          _to: domainTwo._id,
          _from: org._id,
        })
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
        await query`
          LET domainEdges = (FOR v, e IN 1..1 ANY ${org._id} claims RETURN { edgeKey: e._key, userId: e._to })
          LET removeDomainEdges = (FOR domainEdge IN domainEdges REMOVE domainEdge.edgeKey IN claims)
          RETURN true
        `
        await query`
          FOR claim IN claims
            REMOVE claim IN claims
        `
      })
      describe('using no cursor and no limit', () => {
        it('returns an organization', async () => {
          let domains
          const connectionLoader = domainLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
          )

          const connectionArgs = {}
          domains = await connectionLoader({ ...connectionArgs })

          const domainLoader = domainLoaderByKey(query)
          const expectedDomains = await domainLoader.loadMany([
            domainOne._key,
            domainTwo._key,
          ])

          expectedDomains[0].id = expectedDomains[0]._key
          expectedDomains[1].id = expectedDomains[1]._key

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('domains', expectedDomains[0]._key),
                node: {
                  ...expectedDomains[0],
                },
              },
              {
                cursor: toGlobalId('domains', expectedDomains[1]._key),
                node: {
                  ...expectedDomains[1],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('domains', expectedDomains[0]._key),
              endCursor: toGlobalId('domains', expectedDomains[1]._key),
            },
          }

          expect(domains).toEqual(expectedStructure)
        })
      })
      describe('using after cursor', () => {
        it('returns an organization', async () => {
          let domains
          const connectionLoader = domainLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
          )

          const domainLoader = domainLoaderByKey(query)
          const expectedDomains = await domainLoader.loadMany([
            domainOne._key,
            domainTwo._key,
          ])

          expectedDomains[0].id = expectedDomains[0]._key
          expectedDomains[1].id = expectedDomains[1]._key

          const connectionArgs = {
            after: toGlobalId('domains', expectedDomains[0].id),
          }
          domains = await connectionLoader({ ...connectionArgs })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('domains', expectedDomains[1]._key),
                node: {
                  ...expectedDomains[1],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('domains', expectedDomains[1]._key),
              endCursor: toGlobalId('domains', expectedDomains[1]._key),
            },
          }

          expect(domains).toEqual(expectedStructure)
        })
      })
      describe('using before cursor', () => {
        it('returns an organization', async () => {
          let domains
          const connectionLoader = domainLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
          )

          const domainLoader = domainLoaderByKey(query)
          const expectedDomains = await domainLoader.loadMany([
            domainOne._key,
            domainTwo._key,
          ])

          expectedDomains[0].id = expectedDomains[0]._key
          expectedDomains[1].id = expectedDomains[1]._key

          const connectionArgs = {
            before: toGlobalId('domains', expectedDomains[1].id),
          }
          domains = await connectionLoader({ ...connectionArgs })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('domains', expectedDomains[0]._key),
                node: {
                  ...expectedDomains[0],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('domains', expectedDomains[0]._key),
              endCursor: toGlobalId('domains', expectedDomains[0]._key),
            },
          }

          expect(domains).toEqual(expectedStructure)
        })
      })
      describe('using first limit', () => {
        it('returns an organization', async () => {
          let domains
          const connectionLoader = domainLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
          )

          const domainLoader = domainLoaderByKey(query)
          const expectedDomains = await domainLoader.loadMany([
            domainOne._key,
            domainTwo._key,
          ])

          expectedDomains[0].id = expectedDomains[0]._key
          expectedDomains[1].id = expectedDomains[1]._key

          const connectionArgs = {
            first: 1,
          }
          domains = await connectionLoader({ ...connectionArgs })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('domains', expectedDomains[0]._key),
                node: {
                  ...expectedDomains[0],
                },
              },
            ],
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: toGlobalId('domains', expectedDomains[0]._key),
              endCursor: toGlobalId('domains', expectedDomains[0]._key),
            },
          }

          expect(domains).toEqual(expectedStructure)
        })
      })
      describe('using last limit', () => {
        it('returns an organization', async () => {
          let domains
          const connectionLoader = domainLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
          )

          const domainLoader = domainLoaderByKey(query)
          const expectedDomains = await domainLoader.loadMany([
            domainOne._key,
            domainTwo._key,
          ])

          expectedDomains[0].id = expectedDomains[0]._key
          expectedDomains[1].id = expectedDomains[1]._key

          const connectionArgs = {
            last: 1,
          }
          domains = await connectionLoader({ ...connectionArgs })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('domains', expectedDomains[1]._key),
                node: {
                  ...expectedDomains[1],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId('domains', expectedDomains[1]._key),
              endCursor: toGlobalId('domains', expectedDomains[1]._key),
            },
          }

          expect(domains).toEqual(expectedStructure)
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
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'user',
        })
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
      it('returns no domain connections', async () => {
        let domains
        const connectionLoader = domainLoaderConnectionsByUserId(
          query,
          user._key,
          cleanseInput,
        )

        const connectionArgs = {}
        domains = await connectionLoader({ ...connectionArgs })

        const expectedStructure = {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: '',
            endCursor: '',
          },
        }

        expect(domains).toEqual(expectedStructure)
      })
    })
  })
  describe('given an unsuccessful load', () => {
    let user, domainOne, domainTwo
    beforeEach(async () => {
      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      user = await userCursor.next()
      await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'user',
      })
      domainOne = await collections.domains.save({
        domain: 'test1.gc.ca',
        slug: 'test1-gc-ca',
        lastRan: null,
        selectors: ['selector1._domainkey', 'selector2._domainkey'],
      })
      domainTwo = await collections.domains.save({
        domain: 'test2.gc.ca',
        slug: 'test2-gc-ca',
        lastRan: null,
        selectors: ['selector1._domainkey', 'selector2._domainkey'],
      })
      await collections.claims.save({
        _to: domainOne._id,
        _from: org._id,
      })
      await collections.claims.save({
        _to: domainTwo._id,
        _from: org._id,
      })
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
      await query`
        LET domainEdges = (FOR v, e IN 1..1 ANY ${org._id} claims RETURN { edgeKey: e._key, userId: e._to })
        LET removeDomainEdges = (FOR domainEdge IN domainEdges REMOVE domainEdge.edgeKey IN claims)
        RETURN true
      `
      await query`
        FOR claim IN claims
          REMOVE claim IN claims
      `
    })
    describe('first and last arguments are set', () => {
      it('returns an error message', async () => {
        const connectionLoader = domainLoaderConnectionsByUserId(
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
          `User: ${user._key} tried to have first and last set in domain connection query`,
        ])
      })
    })
  })
  describe('given a database error', () => {
    let user, domainOne, domainTwo
    beforeEach(async () => {
      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      user = await userCursor.next()
      await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'user',
      })
      domainOne = await collections.domains.save({
        domain: 'test1.gc.ca',
        slug: 'test1-gc-ca',
        lastRan: null,
        selectors: ['selector1._domainkey', 'selector2._domainkey'],
      })
      domainTwo = await collections.domains.save({
        domain: 'test2.gc.ca',
        slug: 'test2-gc-ca',
        lastRan: null,
        selectors: ['selector1._domainkey', 'selector2._domainkey'],
      })
      await collections.claims.save({
        _to: domainOne._id,
        _from: org._id,
      })
      await collections.claims.save({
        _to: domainTwo._id,
        _from: org._id,
      })
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
      await query`
        LET domainEdges = (FOR v, e IN 1..1 ANY ${org._id} claims RETURN { edgeKey: e._key, userId: e._to })
        LET removeDomainEdges = (FOR domainEdge IN domainEdges REMOVE domainEdge.edgeKey IN claims)
        RETURN true
      `
      await query`
        FOR claim IN claims
          REMOVE claim IN claims
      `
    })
    describe('while querying affiliated organizations', () => {
      it('returns an error message', async () => {
        const query = jest
          .fn()
          .mockRejectedValue(
            new Error('Unable to query organizations. Please try again.'),
          )

        const connectionLoader = domainLoaderConnectionsByUserId(
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
          `Database error occurred while user: ${user._key} was trying to query affiliated organizations in loadDomainsByUser.`,
        ])
      })
    })
    describe('while querying affiliated organization claims', () => {
      it('returns an error message', async () => {
        const query = jest
          .fn()
          .mockReturnValueOnce({
            next() {
              return [org._id]
            },
          })
          .mockRejectedValue(
            new Error('Unable to query claims. Please try again.'),
          )

        const connectionLoader = domainLoaderConnectionsByUserId(
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
            new Error('Unable to query claims. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to query affiliated organization claims in loadDomainsByUser.`,
        ])
      })
    })
    describe('while querying domains', () => {
      it('returns an error message', async () => {
        const query = jest
          .fn()
          .mockReturnValueOnce({
            next() {
              return [org._id]
            },
          })
          .mockReturnValueOnce({
            all() {
              return [domainOne._id, domainTwo._id]
            },
          })
          .mockRejectedValue(
            new Error('Unable to query domains. Please try again.'),
          )

        const connectionLoader = domainLoaderConnectionsByUserId(
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
            new Error('Unable to query domains. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to query domains in loadDomainsByUser.`,
        ])
      })
    })
  })
  describe('given a cursor error', () => {
    let user, domainOne, domainTwo
    beforeEach(async () => {
      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      user = await userCursor.next()
      await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'user',
      })
      domainOne = await collections.domains.save({
        domain: 'test1.gc.ca',
        slug: 'test1-gc-ca',
        lastRan: null,
        selectors: ['selector1._domainkey', 'selector2._domainkey'],
      })
      domainTwo = await collections.domains.save({
        domain: 'test2.gc.ca',
        slug: 'test2-gc-ca',
        lastRan: null,
        selectors: ['selector1._domainkey', 'selector2._domainkey'],
      })
      await collections.claims.save({
        _to: domainOne._id,
        _from: org._id,
      })
      await collections.claims.save({
        _to: domainTwo._id,
        _from: org._id,
      })
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
      await query`
        LET domainEdges = (FOR v, e IN 1..1 ANY ${org._id} claims RETURN { edgeKey: e._key, userId: e._to })
        LET removeDomainEdges = (FOR domainEdge IN domainEdges REMOVE domainEdge.edgeKey IN claims)
        RETURN true
      `
      await query`
        FOR claim IN claims
          REMOVE claim IN claims
      `
    })
    describe('while gathering affiliated organizations', () => {
      it('returns an error message', async () => {
        const cursor = {
          next() {
            throw new Error('Unable to load organizations. Please try again.')
          },
        }
        const query = jest.fn().mockReturnValueOnce(cursor)

        const connectionLoader = domainLoaderConnectionsByUserId(
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
          `Cursor error occurred while user: ${user._key} was trying to gather affiliated organizations in loadDomainsByUser.`,
        ])
      })
    })
    describe('while gathering affiliated organization claims', () => {
      it('returns an error message', async () => {
        const cursor = {
          next() {
            throw new Error('Unable to load domains. Please try again.')
          },
        }
        const query = jest
          .fn()
          .mockReturnValueOnce({
            next() {
              return [org._id]
            },
          })
          .mockReturnValueOnce(cursor)

        const connectionLoader = domainLoaderConnectionsByUserId(
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
            new Error('Unable to load domains. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to gather claimed domains in loadDomainsByUser.`,
        ])
      })
    })
    describe('while gathering domains', () => {
      it('returns an error message', async () => {
        const cursor = {
          next() {
            throw new Error('Unable to load domains. Please try again.')
          },
        }
        const query = jest
          .fn()
          .mockReturnValueOnce({
            next() {
              return [org._id]
            },
          })
          .mockReturnValueOnce({
            all() {
              return [domainOne._id, domainTwo._id]
            },
          })
          .mockReturnValueOnce(cursor)

        const connectionLoader = domainLoaderConnectionsByUserId(
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
            new Error('Unable to load domains. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to gather domains in loadDomainsByUser.`,
        ])
      })
    })
  })
})
