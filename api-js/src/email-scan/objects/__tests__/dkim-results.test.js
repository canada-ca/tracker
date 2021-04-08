import { ensure, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql'
import { GraphQLJSON } from 'graphql-scalars'

import { databaseOptions } from '../../../../database-options'
import { cleanseInput } from '../../../validators'
import { loadDkimByKey } from '../../loaders'
import { dkimType, dkimResultType } from '../index'
import { guidanceTagConnection } from '../../../guidance-tag/objects'
import { loadDkimGuidanceTagConnectionsByTagId } from '../../../guidance-tag/loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

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
    let query, drop, truncate, collections, dkim, dkimResult, dkimGT

    beforeAll(async () => {
      ;({ query, drop, truncate, collections } = await ensure({
        type: 'database',
        name: dbNameFromFile(__filename),
        url,
        rootPassword: rootPass,
        options: databaseOptions({ rootPass }),
      }))
    })

    beforeEach(async () => {
      await truncate()
      dkim = await collections.dkim.save({
        timestamp: '2020-10-02T12:43:39Z',
      })
      dkimResult = await collections.dkimResults.save({
        selector: 'selector._dkim1',
        record: 'txtRecord',
        keyLength: '2048',
        guidanceTags: ['dkim1'],
        negativeTags: ['dkim1'],
        neutralTags: ['dkim1'],
        positiveTags: ['dkim1'],
      })
      await collections.dkimToDkimResults.save({
        _to: dkimResult._id,
        _from: dkim._id,
      })
      dkimGT = await collections.dkimGuidanceTags.save({
        _key: 'dkim1',
        tagName: 'DKIM-TAG',
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
      })
    })

    afterAll(async () => {
      await drop()
    })

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

        const loader = loadDkimByKey({ query, userKey: '1', i18n: {} })

        expect(
          await demoType.dkim.resolve(
            { dkimId: dkim._id },
            {},
            { loaders: { loadDkimByKey: loader } },
          ),
        ).toEqual({
          _id: dkim._id,
          _key: dkim._key,
          _rev: dkim._rev,
          _type: 'dkim',
          id: dkim._key,
          timestamp: '2020-10-02T12:43:39Z',
        })
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

        const loader = loadDkimGuidanceTagConnectionsByTagId({
          query,
          userKey: '1',
          cleanseInput,
          i18n: {},
        })
        const guidanceTags = ['dkim1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', dkimGT._key),
              node: {
                _id: dkimGT._id,
                _key: dkimGT._key,
                _rev: dkimGT._rev,
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
            { loaders: { loadDkimGuidanceTagConnectionsByTagId: loader } },
          ),
        ).toEqual(expectedResult)
      })
    })
    describe('testing the negativeGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dkimResultType.getFields()

        const loader = loadDkimGuidanceTagConnectionsByTagId({
          query,
          userKey: '1',
          cleanseInput,
          i18n: {},
        })
        const negativeTags = ['dkim1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', dkimGT._key),
              node: {
                _id: dkimGT._id,
                _key: dkimGT._key,
                _rev: dkimGT._rev,
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
            { loaders: { loadDkimGuidanceTagConnectionsByTagId: loader } },
          ),
        ).toEqual(expectedResult)
      })
    })
    describe('testing the neutralGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dkimResultType.getFields()

        const loader = loadDkimGuidanceTagConnectionsByTagId({
          query,
          userKey: '1',
          cleanseInput,
          i18n: {},
        })
        const neutralTags = ['dkim1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', dkimGT._key),
              node: {
                _id: dkimGT._id,
                _key: dkimGT._key,
                _rev: dkimGT._rev,
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
            { loaders: { loadDkimGuidanceTagConnectionsByTagId: loader } },
          ),
        ).toEqual(expectedResult)
      })
    })
    describe('testing the positiveGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dkimResultType.getFields()

        const loader = loadDkimGuidanceTagConnectionsByTagId({
          query,
          userKey: '1',
          cleanseInput,
          i18n: {},
        })
        const positiveTags = ['dkim1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', dkimGT._key),
              node: {
                _id: dkimGT._id,
                _key: dkimGT._key,
                _rev: dkimGT._rev,
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
            { loaders: { loadDkimGuidanceTagConnectionsByTagId: loader } },
          ),
        ).toEqual(expectedResult)
      })
    })
  })
})
