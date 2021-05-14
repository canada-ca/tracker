import { GraphQLNonNull, GraphQLID, GraphQLInt, GraphQLString } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { GraphQLJSON, GraphQLDate } from 'graphql-scalars'

import { domainType } from '../../../domain/objects'
import { guidanceTagConnection } from '../../../guidance-tag/objects'
import { spfType } from '../index'

describe('given the spfType object', () => {
  describe('testing the field definitions', () => {
    it('has an id field', () => {
      const demoType = spfType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a domain field', () => {
      const demoType = spfType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(domainType)
    })
    it('has a timestamp field', () => {
      const demoType = spfType.getFields()

      expect(demoType).toHaveProperty('timestamp')
      expect(demoType.timestamp.type).toMatchObject(GraphQLDate)
    })
    it('has a lookups field', () => {
      const demoType = spfType.getFields()

      expect(demoType).toHaveProperty('lookups')
      expect(demoType.lookups.type).toMatchObject(GraphQLInt)
    })
    it('has a record field', () => {
      const demoType = spfType.getFields()

      expect(demoType).toHaveProperty('record')
      expect(demoType.record.type).toMatchObject(GraphQLString)
    })
    it('has a spfDefault field', () => {
      const demoType = spfType.getFields()

      expect(demoType).toHaveProperty('spfDefault')
      expect(demoType.spfDefault.type).toMatchObject(GraphQLString)
    })
    it('has a rawJson field', () => {
      const demoType = spfType.getFields()

      expect(demoType).toHaveProperty('rawJson')
      expect(demoType.rawJson.type).toEqual(GraphQLJSON)
    })
    it('has a negativeGuidanceTags field', () => {
      const demoType = spfType.getFields()

      expect(demoType).toHaveProperty('negativeGuidanceTags')
      expect(demoType.negativeGuidanceTags.type).toMatchObject(
        guidanceTagConnection.connectionType,
      )
    })
    it('has a neutralGuidanceTags field', () => {
      const demoType = spfType.getFields()

      expect(demoType).toHaveProperty('neutralGuidanceTags')
      expect(demoType.neutralGuidanceTags.type).toMatchObject(
        guidanceTagConnection.connectionType,
      )
    })
    it('has a positiveGuidanceTags field', () => {
      const demoType = spfType.getFields()

      expect(demoType).toHaveProperty('positiveGuidanceTags')
      expect(demoType.positiveGuidanceTags.type).toMatchObject(
        guidanceTagConnection.connectionType,
      )
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = spfType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(toGlobalId('spf', '1'))
      })
    })
    describe('testing the domain resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = spfType.getFields()

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
            { domainId: 'domains/1' },
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
        const demoType = spfType.getFields()

        expect(
          demoType.timestamp.resolve({ timestamp: '2020-10-02T12:43:39Z' }),
        ).toEqual(new Date('2020-10-02T12:43:39Z'))
      })
    })
    describe('testing the lookups resolver', () => {
      it('returns the resolved value', () => {
        const demoType = spfType.getFields()

        expect(demoType.lookups.resolve({ lookups: 1 })).toEqual(1)
      })
    })
    describe('testing the record resolver', () => {
      it('returns the resolved value', () => {
        const demoType = spfType.getFields()

        expect(demoType.record.resolve({ record: 'txtRecord' })).toEqual(
          'txtRecord',
        )
      })
    })
    describe('testing the spfDefault resolver', () => {
      it('returns the resolved value', () => {
        const demoType = spfType.getFields()

        expect(
          demoType.spfDefault.resolve({ spfDefault: 'spfDefault' }),
        ).toEqual('spfDefault')
      })
    })
    describe('testing the rawJSON resolver', () => {
      it('returns the resolved value', () => {
        const demoType = spfType.getFields()

        const rawJson = { item: 1234 }

        expect(demoType.rawJson.resolve({ rawJson })).toEqual(
          JSON.stringify(rawJson),
        )
      })
    })
    describe('testing the guidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = spfType.getFields()
        const guidanceTags = ['spf1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', 'spf1'),
              node: {
                _id: 'spfGuidanceTags/spf1',
                _key: 'spf1',
                _rev: 'rev',
                _type: 'guidanceTag',
                id: 'spf1',
                guidance: 'Some Interesting Guidance',
                refLinksGuide: [
                  {
                    description: 'refLinksGuide Description',
                    ref_link: 'www.refLinksGuide.ca',
                  },
                ],
                refLinksTechnical: [
                  {
                    description: 'refLinksTechnical Description',
                    ref_link: 'www.refLinksTechnical.ca',
                  },
                ],
                tagId: 'spf1',
                tagName: 'SPF-TAG',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', 'spf1'),
            endCursor: toGlobalId('guidanceTags', 'spf1'),
          },
        }

        await expect(
          demoType.guidanceTags.resolve(
            { guidanceTags },
            { first: 1 },
            {
              loaders: {
                loadSpfGuidanceTagConnectionsByTagId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the negativeGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = spfType.getFields()
        const negativeTags = ['spf1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', 'spf1'),
              node: {
                _id: 'spfGuidanceTags/spf1',
                _key: 'spf1',
                _rev: 'rev',
                _type: 'guidanceTag',
                id: 'spf1',
                guidance: 'Some Interesting Guidance',
                refLinksGuide: [
                  {
                    description: 'refLinksGuide Description',
                    ref_link: 'www.refLinksGuide.ca',
                  },
                ],
                refLinksTechnical: [
                  {
                    description: 'refLinksTechnical Description',
                    ref_link: 'www.refLinksTechnical.ca',
                  },
                ],
                tagId: 'spf1',
                tagName: 'SPF-TAG',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', 'spf1'),
            endCursor: toGlobalId('guidanceTags', 'spf1'),
          },
        }

        await expect(
          demoType.negativeGuidanceTags.resolve(
            { negativeTags },
            { first: 1 },
            {
              loaders: {
                loadSpfGuidanceTagConnectionsByTagId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the neutralGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = spfType.getFields()
        const neutralTags = ['spf1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', 'spf1'),
              node: {
                _id: 'spfGuidanceTags/spf1',
                _key: 'spf1',
                _rev: 'rev',
                _type: 'guidanceTag',
                id: 'spf1',
                guidance: 'Some Interesting Guidance',
                refLinksGuide: [
                  {
                    description: 'refLinksGuide Description',
                    ref_link: 'www.refLinksGuide.ca',
                  },
                ],
                refLinksTechnical: [
                  {
                    description: 'refLinksTechnical Description',
                    ref_link: 'www.refLinksTechnical.ca',
                  },
                ],
                tagId: 'spf1',
                tagName: 'SPF-TAG',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', 'spf1'),
            endCursor: toGlobalId('guidanceTags', 'spf1'),
          },
        }

        await expect(
          demoType.neutralGuidanceTags.resolve(
            { neutralTags },
            { first: 1 },
            {
              loaders: {
                loadSpfGuidanceTagConnectionsByTagId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the positiveGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = spfType.getFields()
        const positiveTags = ['spf1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', 'spf1'),
              node: {
                _id: 'spfGuidanceTags/spf1',
                _key: 'spf1',
                _rev: 'rev',
                _type: 'guidanceTag',
                id: 'spf1',
                guidance: 'Some Interesting Guidance',
                refLinksGuide: [
                  {
                    description: 'refLinksGuide Description',
                    ref_link: 'www.refLinksGuide.ca',
                  },
                ],
                refLinksTechnical: [
                  {
                    description: 'refLinksTechnical Description',
                    ref_link: 'www.refLinksTechnical.ca',
                  },
                ],
                tagId: 'spf1',
                tagName: 'SPF-TAG',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', 'spf1'),
            endCursor: toGlobalId('guidanceTags', 'spf1'),
          },
        }

        await expect(
          demoType.positiveGuidanceTags.resolve(
            { positiveTags },
            { first: 1 },
            {
              loaders: {
                loadSpfGuidanceTagConnectionsByTagId: jest
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
