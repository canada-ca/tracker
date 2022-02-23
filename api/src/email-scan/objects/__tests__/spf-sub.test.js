import { ensure, dbNameFromFile } from 'arango-tools'
import { GraphQLString, GraphQLList, GraphQLInt, GraphQLID } from 'graphql'
import { GraphQLJSON } from 'graphql-scalars'

import { loadSpfGuidanceTagByTagId } from '../../../guidance-tag/loaders'
import { guidanceTagType } from '../../../guidance-tag/objects'
import { spfSubType } from '../index'
import { domainType } from '../../../domain/objects'
import { StatusEnum } from '../../../enums'
import dbschema from '../../../../database.json';

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the spfSubType object', () => {
  describe('testing its field definitions', () => {
    it('has sharedId field', () => {
      const demoType = spfSubType.getFields()

      expect(demoType).toHaveProperty('sharedId')
      expect(demoType.sharedId.type).toMatchObject(GraphQLID)
    })
    it('has a domain field', () => {
      const demoType = spfSubType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(domainType)
    })
    it('has a status field', () => {
      const demoType = spfSubType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(StatusEnum)
    })
    it('has lookups field', () => {
      const demoType = spfSubType.getFields()

      expect(demoType).toHaveProperty('lookups')
      expect(demoType.lookups.type).toMatchObject(GraphQLInt)
    })
    it('has record field', () => {
      const demoType = spfSubType.getFields()

      expect(demoType).toHaveProperty('record')
      expect(demoType.record.type).toMatchObject(GraphQLString)
    })
    it('has spfDefault field', () => {
      const demoType = spfSubType.getFields()

      expect(demoType).toHaveProperty('spfDefault')
      expect(demoType.spfDefault.type).toMatchObject(GraphQLString)
    })
    it('has a rawJson field', () => {
      const demoType = spfSubType.getFields()

      expect(demoType).toHaveProperty('rawJson')
      expect(demoType.rawJson.type).toEqual(GraphQLJSON)
    })
    it('has negativeGuidanceTags field', () => {
      const demoType = spfSubType.getFields()

      expect(demoType).toHaveProperty('negativeGuidanceTags')
      expect(demoType.negativeGuidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
    it('has neutralGuidanceTags field', () => {
      const demoType = spfSubType.getFields()

      expect(demoType).toHaveProperty('neutralGuidanceTags')
      expect(demoType.neutralGuidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
    it('has positiveGuidanceTags field', () => {
      const demoType = spfSubType.getFields()

      expect(demoType).toHaveProperty('positiveGuidanceTags')
      expect(demoType.positiveGuidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the sharedId resolver', () => {
      it('returns the parsed value', () => {
        const demoType = spfSubType.getFields()

        expect(demoType.sharedId.resolve({ sharedId: 'sharedId' })).toEqual(
          'sharedId',
        )
      })
    })
    describe('testing the domain resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = spfSubType.getFields()

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
            { domainKey: '1' },
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
    describe('testing the status resolver', () => {
      it('returns the parsed value', () => {
        const demoType = spfSubType.getFields()

        expect(demoType.status.resolve({ status: 'status' })).toEqual('status')
      })
    })
    describe('testing the lookups resolver', () => {
      it('returns the parsed value', () => {
        const demoType = spfSubType.getFields()

        expect(demoType.lookups.resolve({ lookups: 10 })).toEqual(10)
      })
    })
    describe('testing the record resolver', () => {
      it('returns the parsed value', () => {
        const demoType = spfSubType.getFields()

        expect(demoType.record.resolve({ record: 'txtRecord' })).toEqual(
          'txtRecord',
        )
      })
    })
    describe('testing the spfDefault resolver', () => {
      it('returns the parsed value', () => {
        const demoType = spfSubType.getFields()

        expect(
          demoType.spfDefault.resolve({ spfDefault: 'spfDefault' }),
        ).toEqual('spfDefault')
      })
    })
    describe('testing the rawJSON resolver', () => {
      it('returns the resolved value', () => {
        const demoType = spfSubType.getFields()

        const rawJson = { item: 1234 }

        expect(demoType.rawJson.resolve({ rawJson })).toEqual(
          JSON.stringify(rawJson),
        )
      })
    })
    describe('testing the negativeGuidanceTags resolver', () => {
      let query, drop, truncate, collections, spfGT
      beforeAll(async () => {
        ;({ query, drop, truncate, collections } = await ensure({
        variables: {
          dbname: dbNameFromFile(__filename),
          username: 'root',
          rootPassword: rootPass,
          password: rootPass,
          url,
        },

        schema: dbschema,
      }))
      })
      beforeEach(async () => {
        await truncate()
        spfGT = await collections.spfGuidanceTags.save({
          _key: 'spf1',
          en: {
            tagName: 'SPF-TAG',
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
        const demoType = spfSubType.getFields()

        const loader = loadSpfGuidanceTagByTagId({
          query,
          userKey: '1',
          i18n: {},
          language: 'en',
        })
        const negativeTags = ['spf1']

        expect(
          await demoType.negativeGuidanceTags.resolve(
            { negativeTags },
            {},
            { loaders: { loadSpfGuidanceTagByTagId: loader } },
          ),
        ).toEqual([
          {
            _id: spfGT._id,
            _key: spfGT._key,
            _rev: spfGT._rev,
            _type: 'guidanceTag',
            guidance: 'Some Interesting Guidance',
            id: 'spf1',
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
        ])
      })
    })
    describe('testing the neutralGuidanceTags resolver', () => {
      let query, drop, truncate, collections, spfGT
      beforeAll(async () => {
        ;({ query, drop, truncate, collections } = await ensure({
        variables: {
          dbname: dbNameFromFile(__filename),
          username: 'root',
          rootPassword: rootPass,
          password: rootPass,
          url,
        },

        schema: dbschema,
      }))
      })
      beforeEach(async () => {
        await truncate()
        spfGT = await collections.spfGuidanceTags.save({
          _key: 'spf1',
          en: {
            tagName: 'SPF-TAG',
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
        const demoType = spfSubType.getFields()

        const loader = loadSpfGuidanceTagByTagId({
          query,
          userKey: '1',
          i18n: {},
          language: 'en',
        })
        const neutralTags = ['spf1']

        expect(
          await demoType.neutralGuidanceTags.resolve(
            { neutralTags },
            {},
            { loaders: { loadSpfGuidanceTagByTagId: loader } },
          ),
        ).toEqual([
          {
            _id: spfGT._id,
            _key: spfGT._key,
            _rev: spfGT._rev,
            _type: 'guidanceTag',
            guidance: 'Some Interesting Guidance',
            id: 'spf1',
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
        ])
      })
    })
    describe('testing the positiveGuidanceTags resolver', () => {
      let query, drop, truncate, collections, spfGT
      beforeAll(async () => {
        ;({ query, drop, truncate, collections } = await ensure({
        variables: {
          dbname: dbNameFromFile(__filename),
          username: 'root',
          rootPassword: rootPass,
          password: rootPass,
          url,
        },

        schema: dbschema,
      }))
      })
      beforeEach(async () => {
        await truncate()
        spfGT = await collections.spfGuidanceTags.save({
          _key: 'spf1',
          en: {
            tagName: 'SPF-TAG',
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
        const demoType = spfSubType.getFields()

        const loader = loadSpfGuidanceTagByTagId({
          query,
          userKey: '1',
          i18n: {},
          language: 'en',
        })
        const positiveTags = ['spf1']

        expect(
          await demoType.positiveGuidanceTags.resolve(
            { positiveTags },
            {},
            { loaders: { loadSpfGuidanceTagByTagId: loader } },
          ),
        ).toEqual([
          {
            _id: spfGT._id,
            _key: spfGT._key,
            _rev: spfGT._rev,
            _type: 'guidanceTag',
            guidance: 'Some Interesting Guidance',
            id: 'spf1',
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
        ])
      })
    })
  })
})
