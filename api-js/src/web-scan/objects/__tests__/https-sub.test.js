import { ensure, dbNameFromFile } from 'arango-tools'
import { GraphQLString, GraphQLList, GraphQLID } from 'graphql'
import { GraphQLJSON } from 'graphql-scalars'

import { databaseOptions } from '../../../../database-options'
import { loadHttpsGuidanceTagByTagId } from '../../../guidance-tag/loaders'
import { guidanceTagType } from '../../../guidance-tag/objects'
import { httpsSubType } from '../index'
import { domainType } from '../../../domain/objects'
import { StatusEnum } from '../../../enums'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the httpsSubType object', () => {
  describe('testing its field definitions', () => {
    it('has sharedId field', () => {
      const demoType = httpsSubType.getFields()

      expect(demoType).toHaveProperty('sharedId')
      expect(demoType.sharedId.type).toMatchObject(GraphQLID)
    })
    it('has a domain field', () => {
      const demoType = httpsSubType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(domainType)
    })
    it('has a status field', () => {
      const demoType = httpsSubType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(StatusEnum)
    })
    it('has implementation field', () => {
      const demoType = httpsSubType.getFields()

      expect(demoType).toHaveProperty('implementation')
      expect(demoType.implementation.type).toMatchObject(GraphQLString)
    })
    it('has enforced field', () => {
      const demoType = httpsSubType.getFields()

      expect(demoType).toHaveProperty('enforced')
      expect(demoType.enforced.type).toMatchObject(GraphQLString)
    })
    it('has hsts field', () => {
      const demoType = httpsSubType.getFields()

      expect(demoType).toHaveProperty('hsts')
      expect(demoType.hsts.type).toMatchObject(GraphQLString)
    })
    it('has hstsAge field', () => {
      const demoType = httpsSubType.getFields()

      expect(demoType).toHaveProperty('hstsAge')
      expect(demoType.hstsAge.type).toMatchObject(GraphQLString)
    })
    it('has preloaded field', () => {
      const demoType = httpsSubType.getFields()

      expect(demoType).toHaveProperty('preloaded')
      expect(demoType.preloaded.type).toMatchObject(GraphQLString)
    })
    it('has a rawJson field', () => {
      const demoType = httpsSubType.getFields()

      expect(demoType).toHaveProperty('rawJson')
      expect(demoType.rawJson.type).toEqual(GraphQLJSON)
    })
    it('has negativeGuidanceTags field', () => {
      const demoType = httpsSubType.getFields()

      expect(demoType).toHaveProperty('negativeGuidanceTags')
      expect(demoType.negativeGuidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
    it('has neutralGuidanceTags field', () => {
      const demoType = httpsSubType.getFields()

      expect(demoType).toHaveProperty('neutralGuidanceTags')
      expect(demoType.neutralGuidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
    it('has positiveGuidanceTags field', () => {
      const demoType = httpsSubType.getFields()

      expect(demoType).toHaveProperty('positiveGuidanceTags')
      expect(demoType.positiveGuidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the sharedId resolver', () => {
      it('returns the parsed value', () => {
        const demoType = httpsSubType.getFields()

        expect(demoType.sharedId.resolve({ sharedId: 'sharedId' })).toEqual(
          'sharedId',
        )
      })
    })
    describe('testing the domain resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = httpsSubType.getFields()

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
        const demoType = httpsSubType.getFields()

        expect(demoType.status.resolve({ status: 'status' })).toEqual('status')
      })
    })
    describe('testing the implementation resolver', () => {
      it('returns the parsed value', () => {
        const demoType = httpsSubType.getFields()

        expect(
          demoType.implementation.resolve({ implementation: 'implementation' }),
        ).toEqual('implementation')
      })
    })
    describe('testing the enforced resolver', () => {
      it('returns the parsed value', () => {
        const demoType = httpsSubType.getFields()

        expect(demoType.enforced.resolve({ enforced: 'enforced' })).toEqual(
          'enforced',
        )
      })
    })
    describe('testing the hsts resolver', () => {
      it('returns the parsed value', () => {
        const demoType = httpsSubType.getFields()

        expect(demoType.hsts.resolve({ hsts: 'hsts' })).toEqual('hsts')
      })
    })
    describe('testing the hstsAge resolver', () => {
      it('returns the parsed value', () => {
        const demoType = httpsSubType.getFields()

        expect(demoType.hstsAge.resolve({ hstsAge: 'hstsAge' })).toEqual(
          'hstsAge',
        )
      })
    })
    describe('testing the preloaded resolver', () => {
      it('returns the parsed value', () => {
        const demoType = httpsSubType.getFields()

        expect(demoType.preloaded.resolve({ preloaded: 'preloaded' })).toEqual(
          'preloaded',
        )
      })
    })
    describe('testing the rawJSON resolver', () => {
      it('returns the resolved value', () => {
        const demoType = httpsSubType.getFields()

        const rawJson = { item: 1234 }

        expect(demoType.rawJson.resolve({ rawJson })).toEqual(
          JSON.stringify(rawJson),
        )
      })
    })
    describe('testing the negativeGuidanceTags resolver', () => {
      let query, drop, truncate, collections, httpsGT
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
        httpsGT = await collections.httpsGuidanceTags.save({
          _key: 'https1',
          tagName: 'HTTPS-TAG',
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
        const demoType = httpsSubType.getFields()

        const loader = loadHttpsGuidanceTagByTagId({
          query,
          userKey: '1',
          i18n: {},
        })
        const negativeTags = ['https1']

        expect(
          await demoType.negativeGuidanceTags.resolve(
            { negativeTags },
            {},
            { loaders: { loadHttpsGuidanceTagByTagId: loader } },
          ),
        ).toEqual([
          {
            _id: httpsGT._id,
            _key: httpsGT._key,
            _rev: httpsGT._rev,
            _type: 'guidanceTag',
            guidance: 'Some Interesting Guidance',
            id: 'https1',
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
            tagId: 'https1',
            tagName: 'HTTPS-TAG',
          },
        ])
      })
    })
    describe('testing the neutralGuidanceTags resolver', () => {
      let query, drop, truncate, collections, httpsGT
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
        httpsGT = await collections.httpsGuidanceTags.save({
          _key: 'https1',
          tagName: 'HTTPS-TAG',
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
        const demoType = httpsSubType.getFields()

        const loader = loadHttpsGuidanceTagByTagId({
          query,
          userKey: '1',
          i18n: {},
        })
        const neutralTags = ['https1']

        expect(
          await demoType.neutralGuidanceTags.resolve(
            { neutralTags },
            {},
            { loaders: { loadHttpsGuidanceTagByTagId: loader } },
          ),
        ).toEqual([
          {
            _id: httpsGT._id,
            _key: httpsGT._key,
            _rev: httpsGT._rev,
            _type: 'guidanceTag',
            guidance: 'Some Interesting Guidance',
            id: 'https1',
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
            tagId: 'https1',
            tagName: 'HTTPS-TAG',
          },
        ])
      })
    })
    describe('testing the positiveGuidanceTags resolver', () => {
      let query, drop, truncate, collections, httpsGT
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
        httpsGT = await collections.httpsGuidanceTags.save({
          _key: 'https1',
          tagName: 'HTTPS-TAG',
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
        const demoType = httpsSubType.getFields()

        const loader = loadHttpsGuidanceTagByTagId({
          query,
          userKey: '1',
          i18n: {},
        })
        const positiveTags = ['https1']

        expect(
          await demoType.positiveGuidanceTags.resolve(
            { positiveTags },
            {},
            { loaders: { loadHttpsGuidanceTagByTagId: loader } },
          ),
        ).toEqual([
          {
            _id: httpsGT._id,
            _key: httpsGT._key,
            _rev: httpsGT._rev,
            _type: 'guidanceTag',
            guidance: 'Some Interesting Guidance',
            id: 'https1',
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
            tagId: 'https1',
            tagName: 'HTTPS-TAG',
          },
        ])
      })
    })
  })
})
