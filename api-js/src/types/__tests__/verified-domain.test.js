const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { GraphQLNonNull, GraphQLID } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { GraphQLDateTime } = require('graphql-scalars')

const { makeMigrations } = require('../../../migrations')
const { cleanseInput } = require('../../validators')
const { verifiedOrgLoaderConnectionsByDomainId } = require('../../loaders')
const {
  verifiedDomainType,
  verifiedOrganizationConnection,
} = require('../index')
const { domainStatus } = require('../domain-status')
const { Domain } = require('../../scalars')

describe('given the verified domains object', () => {
  describe('testing the field definitions', () => {
    it('has an id field', () => {
      const demoType = verifiedDomainType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a domain field', () => {
      const demoType = verifiedDomainType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(Domain)
    })
    it('has a lastRan field', () => {
      const demoType = verifiedDomainType.getFields()

      expect(demoType).toHaveProperty('lastRan')
      expect(demoType.lastRan.type).toMatchObject(GraphQLDateTime)
    })
    it('has a status field', () => {
      const demoType = verifiedDomainType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(domainStatus)
    })
    it('has a organizations field', () => {
      const demoType = verifiedDomainType.getFields()

      expect(demoType).toHaveProperty('organizations')
      expect(demoType.organizations.type).toMatchObject(
        verifiedOrganizationConnection.connectionType,
      )
    })
  })

  describe('testing the field resolvers', () => {
    let query, drop, truncate, migrate, collections, domain, org

    beforeAll(async () => {
      // Generate DB Items
      ;({ migrate } = await ArangoTools({ rootPass, url }))
      ;({ query, drop, truncate, collections } = await migrate(
        makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
      ))
    })

    beforeEach(async () => {
      org = await collections.organizations.save({
        verified: true,
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
      domain = await collections.domains.save({
        domain: 'test.gc.ca',
        lastRan: null,
        selectors: ['selector1._domainkey', 'selector2._domainkey'],
        status: {
          dkim: 'pass',
          dmarc: 'pass',
          https: 'info',
          spf: 'fail',
          ssl: 'fail',
        },
      })
      await collections.claims.save({
        _to: domain._id,
        _from: org._id,
      })
    })

    afterEach(async () => {
      await truncate()
    })

    afterAll(async () => {
      await drop()
    })

    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = verifiedDomainType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(
          toGlobalId('verifiedDomains', 1),
        )
      })
    })
    describe('testing the domain resolver', () => {
      it('returns the resolved value', () => {
        const demoType = verifiedDomainType.getFields()

        expect(demoType.domain.resolve({ domain: 'test.gc.ca' })).toEqual(
          'test.gc.ca',
        )
      })
    })
    describe('testing the lastRan resolver', () => {
      it('returns the resolved value', () => {
        const demoType = verifiedDomainType.getFields()

        expect(
          demoType.lastRan.resolve({ lastRan: '2020-10-02T12:43:39Z' }),
        ).toEqual('2020-10-02T12:43:39Z')
      })
    })
    describe('testing the status resolver', () => {
      it('returns the resolved value', () => {
        const demoType = verifiedDomainType.getFields()

        const status = {
          dkim: 'pass',
          dmarc: 'pass',
          https: 'info',
          spf: 'fail',
          ssl: 'fail',
        }

        expect(demoType.status.resolve({ status })).toEqual({
          dkim: 'pass',
          dmarc: 'pass',
          https: 'info',
          spf: 'fail',
          ssl: 'fail',
        })
      })
    })
    describe('testing the organizations resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = verifiedDomainType.getFields()

        const loader = verifiedOrgLoaderConnectionsByDomainId(
          query,
          'en',
          '1',
          cleanseInput,
          {},
        )

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('verifiedOrganizations', org._key),
              node: {
                _id: org._id,
                _key: org._key,
                _rev: org._rev,
                id: org._key,
                verified: true,
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
                domainCount: 1,
                slug: 'treasury-board-secretariat',
                acronym: 'TBS',
                name: 'Treasury Board of Canada Secretariat',
                zone: 'FED',
                sector: 'TBS',
                country: 'Canada',
                province: 'Ontario',
                city: 'Ottawa',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('verifiedOrganizations', org._key),
            endCursor: toGlobalId('verifiedOrganizations', org._key),
          },
        }

        expect(
          demoType.organizations.resolve(
            { _id: domain._id },
            { first: 1 },
            { loaders: { verifiedOrgLoaderConnectionsByDomainId: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
  })
})
