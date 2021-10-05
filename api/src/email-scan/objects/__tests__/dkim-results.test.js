import { toGlobalId } from 'graphql-relay'
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql'
import { GraphQLJSON } from 'graphql-scalars'

import { dkimType, dkimResultType } from '../index'
import { guidanceTagConnection } from '../../../guidance-tag/objects'

describe('given the dkim result object', () => {
  describe('testing its field definitions', () => {
    it('has an id field', () => {
      const demoType = dkimResultType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a dkim field', () => {
      const demoType = dkimResultType.getFields()

      expect(demoType).toHaveProperty('dkim')
      expect(demoType.dkim.type).toEqual(dkimType)
    })
    it('has a selector field', () => {
      const demoType = dkimResultType.getFields()

      expect(demoType).toHaveProperty('selector')
      expect(demoType.selector.type).toEqual(GraphQLString)
    })
    it('has a record field', () => {
      const demoType = dkimResultType.getFields()

      expect(demoType).toHaveProperty('record')
      expect(demoType.record.type).toMatchObject(GraphQLString)
    })
    it('has a keyLength field', () => {
      const demoType = dkimResultType.getFields()

      expect(demoType).toHaveProperty('keyLength')
      expect(demoType.keyLength.type).toMatchObject(GraphQLString)
    })
    it('has a rawJson field', () => {
      const demoType = dkimResultType.getFields()

      expect(demoType).toHaveProperty('rawJson')
      expect(demoType.rawJson.type).toEqual(GraphQLJSON)
    })
    it('has a guidanceTags field', () => {
      const demoType = dkimResultType.getFields()

      expect(demoType).toHaveProperty('guidanceTags')
      expect(demoType.guidanceTags.type).toEqual(
        guidanceTagConnection.connectionType,
      )
    })
    it('has a negativeGuidanceTags field', () => {
      const demoType = dkimResultType.getFields()

      expect(demoType).toHaveProperty('negativeGuidanceTags')
      expect(demoType.negativeGuidanceTags.type).toEqual(
        guidanceTagConnection.connectionType,
      )
    })
    it('has a neutralGuidanceTags field', () => {
      const demoType = dkimResultType.getFields()

      expect(demoType).toHaveProperty('neutralGuidanceTags')
      expect(demoType.neutralGuidanceTags.type).toEqual(
        guidanceTagConnection.connectionType,
      )
    })
    it('has a positiveGuidanceTags field', () => {
      const demoType = dkimResultType.getFields()

      expect(demoType).toHaveProperty('positiveGuidanceTags')
      expect(demoType.positiveGuidanceTags.type).toEqual(
        guidanceTagConnection.connectionType,
      )
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dkimResultType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(
          toGlobalId('dkimResult', 1),
        )
      })
    })
    describe('testing the dkim resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dkimResultType.getFields()

        const expectedResult = {
          _id: 'dkim/1',
          _key: '1',
          _rev: 'rev',
          _type: 'dkim',
          id: '1',
          timestamp: '2020-10-02T12:43:39Z',
        }

        expect(
          await demoType.dkim.resolve(
            { dkimId: 'dkim/1' },
            {},
            {
              loaders: {
                loadDkimByKey: {
                  load: jest.fn().mockReturnValue(expectedResult),
                },
              },
            },
          ),
        ).toEqual(expectedResult)
      })
    })
    describe('testing the selector field', () => {
      it('returns the resolved value', () => {
        const demoType = dkimResultType.getFields()

        expect(
          demoType.selector.resolve({ selector: 'selector._dkim1' }),
        ).toEqual('selector._dkim1')
      })
    })
    describe('testing the record resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dkimResultType.getFields()

        expect(demoType.record.resolve({ record: 'txtRecord' })).toEqual(
          'txtRecord',
        )
      })
    })
    describe('testing the keyLength resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dkimResultType.getFields()

        expect(demoType.keyLength.resolve({ keyLength: '2048' })).toEqual(
          '2048',
        )
      })
    })
    describe('testing the rawJSON resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dkimResultType.getFields()

        const rawJson = { item: 1234 }

        expect(demoType.rawJson.resolve({ rawJson })).toEqual(
          JSON.stringify(rawJson),
        )
      })
    })
    describe('testing the guidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dkimResultType.getFields()

        const guidanceTags = ['dkim1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', 'dkim1'),
              node: {
                _id: 'dkimGuidanceTags/dkim1',
                _key: 'dkim1',
                _rev: 'rev',
                _type: 'guidanceTag',
                guidance: 'Some Interesting Guidance',
                id: 'dkim1',
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
                tagId: 'dkim1',
                tagName: 'DKIM-TAG',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', 'dkim1'),
            endCursor: toGlobalId('guidanceTags', 'dkim1'),
          },
        }

        expect(
          await demoType.guidanceTags.resolve(
            { guidanceTags },
            { first: 1 },
            {
              loaders: {
                loadDkimGuidanceTagConnectionsByTagId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).toEqual(expectedResult)
      })
    })
    describe('testing the negativeGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dkimResultType.getFields()
        const negativeTags = ['dkim1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', 'dkim1'),
              node: {
                _id: 'dkimGuidanceTags/dkim1',
                _key: 'dkim1',
                _rev: 'rev',
                _type: 'guidanceTag',
                guidance: 'Some Interesting Guidance',
                id: 'dkim1',
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
                tagId: 'dkim1',
                tagName: 'DKIM-TAG',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', 'dkim1'),
            endCursor: toGlobalId('guidanceTags', 'dkim1'),
          },
        }

        expect(
          await demoType.negativeGuidanceTags.resolve(
            { negativeTags },
            { first: 1 },
            {
              loaders: {
                loadDkimGuidanceTagConnectionsByTagId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).toEqual(expectedResult)
      })
    })
    describe('testing the neutralGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dkimResultType.getFields()
        const neutralTags = ['dkim1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', 'dkim1'),
              node: {
                _id: 'dkimGuidanceTags/dkim1',
                _key: 'dkim1',
                _rev: 'rev',
                _type: 'guidanceTag',
                guidance: 'Some Interesting Guidance',
                id: 'dkim1',
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
                tagId: 'dkim1',
                tagName: 'DKIM-TAG',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', 'dkim1'),
            endCursor: toGlobalId('guidanceTags', 'dkim1'),
          },
        }

        expect(
          await demoType.neutralGuidanceTags.resolve(
            { neutralTags },
            { first: 1 },
            {
              loaders: {
                loadDkimGuidanceTagConnectionsByTagId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).toEqual(expectedResult)
      })
    })
    describe('testing the positiveGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dkimResultType.getFields()
        const positiveTags = ['dkim1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', 'dkim1'),
              node: {
                _id: 'dkimGuidanceTags/dkim1',
                _key: 'dkim1',
                _rev: 'rev',
                _type: 'guidanceTag',
                guidance: 'Some Interesting Guidance',
                id: 'dkim1',
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
                tagId: 'dkim1',
                tagName: 'DKIM-TAG',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', 'dkim1'),
            endCursor: toGlobalId('guidanceTags', 'dkim1'),
          },
        }

        expect(
          await demoType.positiveGuidanceTags.resolve(
            { positiveTags },
            { first: 1 },
            {
              loaders: {
                loadDkimGuidanceTagConnectionsByTagId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).toEqual(expectedResult)
      })
    })
  })
})
