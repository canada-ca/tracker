import { ensure, dbNameFromFile } from 'arango-tools'
import { GraphQLString, GraphQLList, GraphQLInt, GraphQLID } from 'graphql'
import { GraphQLJSON } from 'graphql-scalars'

import { databaseOptions } from '../../../../database-options'
import { loadDmarcGuidanceTagByTagId } from '../../../guidance-tag/loaders'
import { guidanceTagType } from '../../../guidance-tag/objects'
import { dmarcSubType } from '../index'
import { domainType } from '../../../domain/objects'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the dmarcSubType object', () => {
  describe('testing its field definitions', () => {
    it('has sharedId field', () => {
      const demoType = dmarcSubType.getFields()

      expect(demoType).toHaveProperty('sharedId')
      expect(demoType.sharedId.type).toMatchObject(GraphQLID)
    })
    it('has a domain field', () => {
      const demoType = dmarcSubType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(domainType)
    })
    it('has record field', () => {
      const demoType = dmarcSubType.getFields()

      expect(demoType).toHaveProperty('record')
      expect(demoType.record.type).toMatchObject(GraphQLString)
    })
    it('has pPolicy field', () => {
      const demoType = dmarcSubType.getFields()

      expect(demoType).toHaveProperty('pPolicy')
      expect(demoType.pPolicy.type).toMatchObject(GraphQLString)
    })
    it('has spPolicy field', () => {
      const demoType = dmarcSubType.getFields()

      expect(demoType).toHaveProperty('spPolicy')
      expect(demoType.spPolicy.type).toMatchObject(GraphQLString)
    })
    it('has pct field', () => {
      const demoType = dmarcSubType.getFields()

      expect(demoType).toHaveProperty('pct')
      expect(demoType.pct.type).toMatchObject(GraphQLInt)
    })
    it('has a rawJson field', () => {
      const demoType = dmarcSubType.getFields()

      expect(demoType).toHaveProperty('rawJson')
      expect(demoType.rawJson.type).toEqual(GraphQLJSON)
    })
    it('has negativeGuidanceTags field', () => {
      const demoType = dmarcSubType.getFields()

      expect(demoType).toHaveProperty('negativeGuidanceTags')
      expect(demoType.negativeGuidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
    it('has neutralGuidanceTags field', () => {
      const demoType = dmarcSubType.getFields()

      expect(demoType).toHaveProperty('neutralGuidanceTags')
      expect(demoType.neutralGuidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
    it('has positiveGuidanceTags field', () => {
      const demoType = dmarcSubType.getFields()

      expect(demoType).toHaveProperty('positiveGuidanceTags')
      expect(demoType.positiveGuidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the sharedId resolver', () => {
      it('returns the parsed value', () => {
        const demoType = dmarcSubType.getFields()

        expect(demoType.sharedId.resolve({ sharedId: 'sharedId' })).toEqual(
          'sharedId',
        )
      })
    })
    describe('testing the domain resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dmarcSubType.getFields()
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
    describe('testing the record resolver', () => {
      it('returns the parsed value', () => {
        const demoType = dmarcSubType.getFields()

        expect(demoType.record.resolve({ record: 'txtRecord' })).toEqual(
          'txtRecord',
        )
      })
    })
    describe('testing the pPolicy resolver', () => {
      it('returns the parsed value', () => {
        const demoType = dmarcSubType.getFields()

        expect(demoType.pPolicy.resolve({ pPolicy: 'pPolicy' })).toEqual(
          'pPolicy',
        )
      })
    })
    describe('testing the spPolicy resolver', () => {
      it('returns the parsed value', () => {
        const demoType = dmarcSubType.getFields()

        expect(demoType.spPolicy.resolve({ spPolicy: 'spPolicy' })).toEqual(
          'spPolicy',
        )
      })
    })
    describe('testing the pct resolver', () => {
      it('returns the parsed value', () => {
        const demoType = dmarcSubType.getFields()

        expect(demoType.pct.resolve({ pct: 100 })).toEqual(100)
      })
    })
    describe('testing the rawJSON resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dmarcSubType.getFields()

        const rawJson = { item: 1234 }

        expect(demoType.rawJson.resolve({ rawJson })).toEqual(
          JSON.stringify(rawJson),
        )
      })
    })
    describe('testing the negativeGuidanceTags resolver', () => {
      let query, drop, truncate, collections, dmarcGT
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
        dmarcGT = await collections.dmarcGuidanceTags.save({
          _key: 'dmarc1',
          tagName: 'DMARC-TAG',
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
      it('returns the parsed value', async () => {
        const demoType = dmarcSubType.getFields()

        const loader = loadDmarcGuidanceTagByTagId({
          query,
          userKey: 1,
          i18n: {},
        })
        const negativeTags = ['dmarc1']

        expect(
          await demoType.negativeGuidanceTags.resolve(
            { negativeTags },
            {},
            { loaders: { loadDmarcGuidanceTagByTagId: loader } },
          ),
        ).toEqual([
          {
            _id: dmarcGT._id,
            _key: dmarcGT._key,
            _rev: dmarcGT._rev,
            _type: 'guidanceTag',
            guidance: 'Some Interesting Guidance',
            id: 'dmarc1',
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
            tagId: 'dmarc1',
            tagName: 'DMARC-TAG',
          },
        ])
      })
    })
    describe('testing the neutralGuidanceTags resolver', () => {
      let query, drop, truncate, collections, dmarcGT
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
        dmarcGT = await collections.dmarcGuidanceTags.save({
          _key: 'dmarc1',
          tagName: 'DMARC-TAG',
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
      it('returns the parsed value', async () => {
        const demoType = dmarcSubType.getFields()

        const loader = loadDmarcGuidanceTagByTagId({
          query,
          userKey: 1,
          i18n: {},
        })
        const neutralTags = ['dmarc1']

        expect(
          await demoType.neutralGuidanceTags.resolve(
            { neutralTags },
            {},
            { loaders: { loadDmarcGuidanceTagByTagId: loader } },
          ),
        ).toEqual([
          {
            _id: dmarcGT._id,
            _key: dmarcGT._key,
            _rev: dmarcGT._rev,
            _type: 'guidanceTag',
            guidance: 'Some Interesting Guidance',
            id: 'dmarc1',
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
            tagId: 'dmarc1',
            tagName: 'DMARC-TAG',
          },
        ])
      })
    })
    describe('testing the positiveGuidanceTags resolver', () => {
      let query, drop, truncate, collections, dmarcGT
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
        dmarcGT = await collections.dmarcGuidanceTags.save({
          _key: 'dmarc1',
          tagName: 'DMARC-TAG',
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
      it('returns the parsed value', async () => {
        const demoType = dmarcSubType.getFields()

        const loader = loadDmarcGuidanceTagByTagId({
          query,
          userKey: 1,
          i18n: {},
        })
        const positiveTags = ['dmarc1']

        expect(
          await demoType.positiveGuidanceTags.resolve(
            { positiveTags },
            {},
            { loaders: { loadDmarcGuidanceTagByTagId: loader } },
          ),
        ).toEqual([
          {
            _id: dmarcGT._id,
            _key: dmarcGT._key,
            _rev: dmarcGT._rev,
            _type: 'guidanceTag',
            guidance: 'Some Interesting Guidance',
            id: 'dmarc1',
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
            tagId: 'dmarc1',
            tagName: 'DMARC-TAG',
          },
        ])
      })
    })
  })
})
