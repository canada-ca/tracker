import { GraphQLNonNull, GraphQLID } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { GraphQLDate } from 'graphql-scalars'

import { verifiedOrganizationConnection } from '../../../verified-organizations/objects'
import { verifiedDomainType } from '../index'
import { domainStatus } from '../../../domain/objects'
import { Domain } from '../../../scalars'

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
      expect(demoType.lastRan.type).toMatchObject(GraphQLDate)
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
    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = verifiedDomainType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(
          toGlobalId('verifiedDomain', 1),
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

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('verifiedOrganizations', '1'),
              node: {
                _id: 'organizations/1',
                _key: '1',
                _rev: 'rev',
                _type: 'verifiedOrganization',
                id: '1',
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
            startCursor: toGlobalId('verifiedOrganizations', '1'),
            endCursor: toGlobalId('verifiedOrganizations', '1'),
          },
        }

        expect(
          demoType.organizations.resolve(
            { _id: 'domains/1' },
            { first: 1 },
            {
              loaders: {
                loadVerifiedOrgConnectionsByDomainId: jest
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
