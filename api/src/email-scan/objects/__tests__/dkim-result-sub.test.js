import { ensure, dbNameFromFile } from 'arango-tools'
import { GraphQLString, GraphQLList } from 'graphql'
import { GraphQLJSON } from 'graphql-scalars'

import { databaseOptions } from '../../../../database-options'
import { loadDkimGuidanceTagByTagId } from '../../../guidance-tag/loaders'
import { guidanceTagType } from '../../../guidance-tag/objects'
import { dkimResultSubType } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('Given The dkimResultSubType object', () => {
  describe('testing its field definitions', () => {
    it('has selector field', () => {
      const demoType = dkimResultSubType.getFields()

      expect(demoType).toHaveProperty('selector')
      expect(demoType.selector.type).toMatchObject(GraphQLString)
    })
    it('has record field', () => {
      const demoType = dkimResultSubType.getFields()

      expect(demoType).toHaveProperty('record')
      expect(demoType.record.type).toMatchObject(GraphQLString)
    })
    it('has keyLength field', () => {
      const demoType = dkimResultSubType.getFields()

      expect(demoType).toHaveProperty('keyLength')
      expect(demoType.keyLength.type).toMatchObject(GraphQLString)
    })
    it('has a rawJson field', () => {
      const demoType = dkimResultSubType.getFields()

      expect(demoType).toHaveProperty('rawJson')
      expect(demoType.rawJson.type).toEqual(GraphQLJSON)
    })
    it('has negativeGuidanceTags field', () => {
      const demoType = dkimResultSubType.getFields()

      expect(demoType).toHaveProperty('negativeGuidanceTags')
      expect(demoType.negativeGuidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
    it('has neutralGuidanceTags field', () => {
      const demoType = dkimResultSubType.getFields()

      expect(demoType).toHaveProperty('neutralGuidanceTags')
      expect(demoType.neutralGuidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
    it('has positiveGuidanceTags field', () => {
      const demoType = dkimResultSubType.getFields()

      expect(demoType).toHaveProperty('positiveGuidanceTags')
      expect(demoType.positiveGuidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the selector resolver', () => {
      it('returns the parsed value', () => {
        const demoType = dkimResultSubType.getFields()

        expect(
          demoType.selector.resolve({ selector: 'selector._dkim1' }),
        ).toEqual('selector._dkim1')
      })
    })
    describe('testing the record resolver', () => {
      it('returns the parsed value', () => {
        const demoType = dkimResultSubType.getFields()

        expect(demoType.record.resolve({ record: 'txtRecord' })).toEqual(
          'txtRecord',
        )
      })
    })
    describe('testing the keyLength resolver', () => {
      it('returns the parsed value', () => {
        const demoType = dkimResultSubType.getFields()

        expect(demoType.keyLength.resolve({ keyLength: '2048' })).toEqual(
          '2048',
        )
      })
    })
    describe('testing the rawJSON resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dkimResultSubType.getFields()

        const rawJson = { item: 1234 }

        expect(demoType.rawJson.resolve({ rawJson })).toEqual(
          JSON.stringify(rawJson),
        )
      })
    })
    describe('testing the negativeGuidanceTags resolver', () => {
      let query, drop, truncate, collections, dkimGT
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
        dkimGT = await collections.dkimGuidanceTags.save({
          _key: 'dkim1',
          en: {
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
          },
        })
      })
      afterAll(async () => {
        await drop()
      })
      it('returns the parsed value', async () => {
        const demoType = dkimResultSubType.getFields()

        const loader = loadDkimGuidanceTagByTagId({
          query,
          userKey: '1',
          i18n: {},
          language: 'en',
        })
        const negativeTags = ['dkim1']

        expect(
          await demoType.negativeGuidanceTags.resolve(
            { negativeTags },
            {},
            { loaders: { loadDkimGuidanceTagByTagId: loader } },
          ),
        ).toEqual([
          {
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
        ])
      })
    })
    describe('testing the neutralGuidanceTags resolver', () => {
      let query, drop, truncate, collections, dkimGT
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
        dkimGT = await collections.dkimGuidanceTags.save({
          _key: 'dkim1',
          en: {
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
          },
        })
      })
      afterAll(async () => {
        await drop()
      })
      it('returns the parsed value', async () => {
        const demoType = dkimResultSubType.getFields()

        const loader = loadDkimGuidanceTagByTagId({
          query,
          userKey: '1',
          i18n: {},
          language: 'en',
        })
        const neutralTags = ['dkim1']

        expect(
          await demoType.neutralGuidanceTags.resolve(
            { neutralTags },
            {},
            { loaders: { loadDkimGuidanceTagByTagId: loader } },
          ),
        ).toEqual([
          {
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
        ])
      })
    })
    describe('testing the positiveGuidanceTags resolver', () => {
      let query, drop, truncate, collections, dkimGT
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
        dkimGT = await collections.dkimGuidanceTags.save({
          _key: 'dkim1',
          en: {
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
          },
        })
      })
      afterAll(async () => {
        await drop()
      })
      it('returns the parsed value', async () => {
        const demoType = dkimResultSubType.getFields()

        const loader = loadDkimGuidanceTagByTagId({
          query,
          userKey: '1',
          i18n: {},
          language: 'en',
        })
        const positiveTags = ['dkim1']

        expect(
          await demoType.positiveGuidanceTags.resolve(
            { positiveTags },
            {},
            { loaders: { loadDkimGuidanceTagByTagId: loader } },
          ),
        ).toEqual([
          {
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
        ])
      })
    })
  })
})
