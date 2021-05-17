import {
  GraphQLInt,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
  GraphQLID,
} from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { verifiedDomainConnection } from '../../../verified-domains/objects'
import { verifiedOrganizationType } from '../index'
import { organizationSummaryType } from '../../../organization/objects'
import { Acronym, Slug } from '../../../scalars'

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

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('verifiedDomains', '1'),
              node: {
                _id: 'domains/1',
                _key: '1',
                _rev: 'rev',
                _type: 'verifiedDomain',
                id: '1',
                domain: 'test.gc.ca',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('verifiedDomains', '1'),
            endCursor: toGlobalId('verifiedDomains', '1'),
          },
        }

        await expect(
          demoType.domains.resolve(
            { _id: 'organizations/1' },
            { first: 1 },
            {
              loaders: {
                loadVerifiedDomainConnectionsByOrgId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
  })
})
