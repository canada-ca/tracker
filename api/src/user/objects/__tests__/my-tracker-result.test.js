import { GraphQLInt } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { domainConnection } from '../../../domain/objects'
import { organizationSummaryType } from '../../../organization/objects'

import { myTrackerType } from '../index'

describe('given the myTracker result gql object', () => {
  describe('testing field definitions', () => {
    it('has a summaries field', () => {
      const demoType = myTrackerType.getFields()

      expect(demoType).toHaveProperty('summaries')
      expect(demoType.summaries.type).toMatchObject(organizationSummaryType)
    })
    it('has a domainCount field', () => {
      const demoType = myTrackerType.getFields()

      expect(demoType).toHaveProperty('domainCount')
      expect(demoType.domainCount.type).toMatchObject(GraphQLInt)
    })
    it('has a domains field', () => {
      const demoType = myTrackerType.getFields()

      expect(demoType).toHaveProperty('domains')
      expect(demoType.domains.type).toMatchObject(
        domainConnection.connectionType,
      )
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the summaries resolver', () => {
      it('returns the resolved field', () => {
        const demoType = myTrackerType.getFields()

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
  })
  describe('testing the domainCount field', () => {
    it('returns the resolved value', () => {
      const demoType = myTrackerType.getFields()
      expect(demoType.domainCount.resolve({ domainCount: 5 })).toEqual(5)
    })
  })
  describe('testing the domains resolver', () => {
    it('returns the resolved value', async () => {
      const demoType = myTrackerType.getFields()

      const expectedResult = {
        edges: [
          {
            cursor: toGlobalId('domains', '1'),
            node: {
              _id: 'domains/1',
              _key: '1',
              _rev: 'rev',
              _type: 'domain',
              id: '1',
              domain: 'test.gc.ca',
            },
          },
        ],
        totalCount: 1,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: toGlobalId('domains', '1'),
          endCursor: toGlobalId('domains', '1'),
        },
      }

      await expect(
        demoType.domains.resolve(
          { _id: 'users/1' },
          { first: 1 },
          {
            loaders: {
              loadDomainConnectionsByUserId: jest
                .fn()
                .mockReturnValue(expectedResult),
            },
          },
        ),
      ).resolves.toEqual(expectedResult)
    })
  })
})
