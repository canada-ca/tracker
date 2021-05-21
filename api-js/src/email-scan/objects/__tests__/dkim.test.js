import { GraphQLNonNull, GraphQLID } from 'graphql'
import { GraphQLDate } from 'graphql-scalars'
import { toGlobalId } from 'graphql-relay'

import { domainType } from '../../../domain/objects'
import { dkimType } from '../dkim'
import { dkimResultConnection } from '../dkim-result-connection'

describe('given the dkimType object', () => {
  describe('testing its field definitions', () => {
    it('has an id field', () => {
      const demoType = dkimType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a domain field', () => {
      const demoType = dkimType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(domainType)
    })
    it('has a timestamp field', () => {
      const demoType = dkimType.getFields()

      expect(demoType).toHaveProperty('timestamp')
      expect(demoType.timestamp.type).toMatchObject(GraphQLDate)
    })
    it('has a results field', () => {
      const demoType = dkimType.getFields()

      expect(demoType).toHaveProperty('results')
      expect(demoType.results.type).toMatchObject(
        dkimResultConnection.connectionType,
      )
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dkimType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(toGlobalId('dkim', 1))
      })
    })
    describe('testing the domain resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dkimType.getFields()
        const expectedResult = {
          _id: 'domains/1',
          _key: '1',
          _rev: 'rev',
          _type: 'domain',
          id: '1',
          domain: 'test.domain.gc.ca',
          slug: 'test-domain-gc-ca',
        }

        await expect(
          demoType.domain.resolve(
            { domainId: '1' },
            {},
            {
              loaders: {
                loadDomainByKey: {
                  load: jest.fn().mockReturnValue(expectedResult),
                },
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the timestamp resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dkimType.getFields()

        expect(
          demoType.timestamp.resolve({ timestamp: '2020-10-02T12:43:39Z' }),
        ).toEqual(new Date('2020-10-02T12:43:39Z'))
      })
    })
    describe('testing the results resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dkimType.getFields()

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('dkimResult', '1'),
              node: {
                _id: 'dkimResults/1',
                _key: '1',
                _rev: 'rev',
                _type: 'dkimResult',
                id: '1',
                dkimId: 'dkimGuidanceTags/dkim1',
                selector: 'selector._dkim1',
                record: 'txtRecord',
                keyLength: '2048',
                guidanceTags: ['dkim1'],
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('dkimResult', '1'),
            endCursor: toGlobalId('dkimResult', '1'),
          },
        }

        await expect(
          demoType.results.resolve(
            { _id: '1' },
            { first: 1 },
            {
              loaders: {
                loadDkimResultConnectionsByDkimId: jest
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
