const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const {
  GraphQLInt,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
  GraphQLID,
} = require('graphql')
const { toGlobalId } = require('graphql-relay')

const { makeMigrations } = require('../../../../migrations')
const { cleanseInput } = require('../../../validators')
const { verifiedDomainLoaderConnectionsByOrgId } = require('../../../loaders')
const {
  verifiedOrganizationType,
  verifiedDomainConnection,
} = require('../verified-objects')
const { organizationSummaryType } = require('../../base/organization-summary')
const { Acronym, Slug } = require('../../../scalars')

describe('given the verified organization object', () => {
  describe('testing the field definitions', () => {
    it('has an id field', () => {
      const demoType = verifiedOrganizationType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has an acronym field', () => {
      const demoType = verifiedOrganizationType.getFields()

      expect(demoType).toHaveProperty('acronym')
      expect(demoType.acronym.type).toMatchObject(Acronym)
    })
    it('has a name field', () => {
      const demoType = verifiedOrganizationType.getFields()

      expect(demoType).toHaveProperty('name')
      expect(demoType.name.type).toMatchObject(GraphQLString)
    })
    it('has a slug field', () => {
      const demoType = verifiedOrganizationType.getFields()

      expect(demoType).toHaveProperty('slug')
      expect(demoType.slug.type).toMatchObject(Slug)
    })
    it('has a zone field', () => {
      const demoType = verifiedOrganizationType.getFields()

      expect(demoType).toHaveProperty('zone')
      expect(demoType.zone.type).toMatchObject(GraphQLString)
    })
    it('has a sector field', () => {
      const demoType = verifiedOrganizationType.getFields()

      expect(demoType).toHaveProperty('sector')
      expect(demoType.sector.type).toMatchObject(GraphQLString)
    })
    it('has a country field', () => {
      const demoType = verifiedOrganizationType.getFields()

      expect(demoType).toHaveProperty('country')
      expect(demoType.country.type).toMatchObject(GraphQLString)
    })
    it('has a province field', () => {
      const demoType = verifiedOrganizationType.getFields()

      expect(demoType).toHaveProperty('province')
      expect(demoType.province.type).toMatchObject(GraphQLString)
    })
    it('has a city field', () => {
      const demoType = verifiedOrganizationType.getFields()

      expect(demoType).toHaveProperty('city')
      expect(demoType.city.type).toEqual(GraphQLString)
    })
    it('has a verified field', () => {
      const demoType = verifiedOrganizationType.getFields()

      expect(demoType).toHaveProperty('verified')
      expect(demoType.verified.type).toMatchObject(GraphQLBoolean)
    })
    it('has a summaries field', () => {
      const demoType = verifiedOrganizationType.getFields()

      expect(demoType).toHaveProperty('summaries')
      expect(demoType.summaries.type).toMatchObject(organizationSummaryType)
    })
    it('has a domainCount field', () => {
      const demoType = verifiedOrganizationType.getFields()

      expect(demoType).toHaveProperty('domainCount')
      expect(demoType.domainCount.type).toMatchObject(GraphQLInt)
    })
    it('has a domains field', () => {
      const demoType = verifiedOrganizationType.getFields()

      expect(demoType).toHaveProperty('domains')
      expect(demoType.domains.type).toMatchObject(
        verifiedDomainConnection.connectionType,
      )
    })
  })

  describe('testing the field resolvers', () => {
    let query, drop, truncate, migrate, collections, org, domain

    beforeAll(async () => {
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
      })
      await collections.claims.save({
        _from: org._id,
        _to: domain._id,
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
        const demoType = verifiedOrganizationType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(
          toGlobalId('verifiedOrganizations', 1),
        )
      })
    })
    describe('testing the acronym resolver', () => {
      it('returns the resolved value', () => {
        const demoType = verifiedOrganizationType.getFields()

        expect(demoType.acronym.resolve({ acronym: 'GOC' })).toEqual('GOC')
      })
    })
    describe('testing the name resolver', () => {
      it('returns the resolved value', () => {
        const demoType = verifiedOrganizationType.getFields()

        expect(demoType.name.resolve({ name: 'Name' })).toEqual('Name')
      })
    })
    describe('testing the slug resolver', () => {
      it('returns the resolved value', () => {
        const demoType = verifiedOrganizationType.getFields()

        expect(demoType.slug.resolve({ slug: 'organization-name' })).toEqual(
          'organization-name',
        )
      })
    })
    describe('testing the zone resolver', () => {
      it('returns the resolved value', () => {
        const demoType = verifiedOrganizationType.getFields()

        expect(demoType.zone.resolve({ zone: 'zone' })).toEqual('zone')
      })
    })
    describe('testing the sector resolver', () => {
      it('returns the resolved value', () => {
        const demoType = verifiedOrganizationType.getFields()

        expect(demoType.sector.resolve({ sector: 'sector' })).toEqual('sector')
      })
    })
    describe('testing the country resolver', () => {
      it('returns the resolved value', () => {
        const demoType = verifiedOrganizationType.getFields()

        expect(demoType.country.resolve({ country: 'Canada' })).toEqual(
          'Canada',
        )
      })
    })
    describe('testing the province resolver', () => {
      it('returns the resolved value', () => {
        const demoType = verifiedOrganizationType.getFields()

        expect(demoType.province.resolve({ province: 'province' })).toEqual(
          'province',
        )
      })
    })
    describe('testing the city resolver', () => {
      it('returns the resolved value', () => {
        const demoType = verifiedOrganizationType.getFields()

        expect(demoType.city.resolve({ city: 'city' })).toEqual('city')
      })
    })
    describe('testing the verified resolver', () => {
      it('returns the resolved value', () => {
        const demoType = verifiedOrganizationType.getFields()

        expect(demoType.verified.resolve({ verified: true })).toEqual(true)
      })
    })
    describe('testing the summaries resolver', () => {
      it('returns the resolved value', () => {
        const demoType = verifiedOrganizationType.getFields()

        const org = {
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
        }

        const expectedResult = {
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
        }

        expect(demoType.summaries.resolve(org)).toEqual(expectedResult)
      })
    })
    describe('testing the domainCount resolver', () => {
      it('returns the resolved value', () => {
        const demoType = verifiedOrganizationType.getFields()

        expect(demoType.domainCount.resolve({ domainCount: 5 })).toEqual(5)
      })
    })
    describe('testing the domains resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = verifiedOrganizationType.getFields()

        const loader = verifiedDomainLoaderConnectionsByOrgId(
          query,
          cleanseInput,
          {},
        )

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('verifiedDomains', domain._key),
              node: {
                _id: domain._id,
                _key: domain._key,
                _rev: domain._rev,
                id: domain._key,
                domain: 'test.gc.ca',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('verifiedDomains', domain._key),
            endCursor: toGlobalId('verifiedDomains', domain._key),
          },
        }

        await expect(
          demoType.domains.resolve(
            { _id: org._id },
            { first: 1 },
            { loaders: { verifiedDomainLoaderConnectionsByOrgId: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
  })
})
