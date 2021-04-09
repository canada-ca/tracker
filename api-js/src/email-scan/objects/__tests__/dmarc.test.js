import { ensure, dbNameFromFile } from 'arango-tools'
import { GraphQLNonNull, GraphQLID, GraphQLString, GraphQLInt } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { GraphQLJSON, GraphQLDate } from 'graphql-scalars'

import { databaseOptions } from '../../../../database-options'
import { cleanseInput } from '../../../validators'
import { loadDomainByKey } from '../../../domain/loaders'
import { domainType } from '../../../domain/objects'
import { loadDmarcGuidanceTagConnectionsByTagId } from '../../../guidance-tag/loaders'
import { guidanceTagConnection } from '../../../guidance-tag/objects'
import { dmarcType } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the dmarcType object', () => {
  describe('testing its field definitions', () => {
    it('has an id field', () => {
      const demoType = dmarcType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a domain field', () => {
      const demoType = dmarcType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(domainType)
    })
    it('has a timestamp field', () => {
      const demoType = dmarcType.getFields()

      expect(demoType).toHaveProperty('timestamp')
      expect(demoType.timestamp.type).toMatchObject(GraphQLDate)
    })
    it('has a record field', () => {
      const demoType = dmarcType.getFields()

      expect(demoType).toHaveProperty('record')
      expect(demoType.record.type).toMatchObject(GraphQLString)
    })
    it('has a pPolicy field', () => {
      const demoType = dmarcType.getFields()

      expect(demoType).toHaveProperty('pPolicy')
      expect(demoType.pPolicy.type).toEqual(GraphQLString)
    })
    it('has a spPolicy field', () => {
      const demoType = dmarcType.getFields()

      expect(demoType).toHaveProperty('spPolicy')
      expect(demoType.spPolicy.type).toMatchObject(GraphQLString)
    })
    it('has a pct field', () => {
      const demoType = dmarcType.getFields()

      expect(demoType).toHaveProperty('pct')
      expect(demoType.pct.type).toMatchObject(GraphQLInt)
    })
    it('has a rawJson field', () => {
      const demoType = dmarcType.getFields()

      expect(demoType).toHaveProperty('rawJson')
      expect(demoType.rawJson.type).toEqual(GraphQLJSON)
    })
    it('has a guidanceTags field', () => {
      const demoType = dmarcType.getFields()

      expect(demoType).toHaveProperty('guidanceTags')
      expect(demoType.guidanceTags.type).toMatchObject(
        guidanceTagConnection.connectionType,
      )
    })
    it('has a negativeGuidanceTags field', () => {
      const demoType = dmarcType.getFields()

      expect(demoType).toHaveProperty('negativeGuidanceTags')
      expect(demoType.negativeGuidanceTags.type).toMatchObject(
        guidanceTagConnection.connectionType,
      )
    })
    it('has a neutralGuidanceTags field', () => {
      const demoType = dmarcType.getFields()

      expect(demoType).toHaveProperty('neutralGuidanceTags')
      expect(demoType.neutralGuidanceTags.type).toMatchObject(
        guidanceTagConnection.connectionType,
      )
    })
    it('has a positiveGuidanceTags field', () => {
      const demoType = dmarcType.getFields()

      expect(demoType).toHaveProperty('positiveGuidanceTags')
      expect(demoType.positiveGuidanceTags.type).toMatchObject(
        guidanceTagConnection.connectionType,
      )
    })
  })

  describe('testing its field resolvers', () => {
    let query, drop, truncate, collections, domain, dmarc, dmarcGT

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
      domain = await collections.domains.save({
        domain: 'test.domain.gc.ca',
        slug: 'test-domain-gc-ca',
      })
      dmarc = await collections.dmarc.save({
        timestamp: '2020-10-02T12:43:39Z',
        record: 'txtRecord',
        pPolicy: 'pPolicy',
        spPolicy: 'spPolicy',
        pct: 100,
        guidanceTags: ['dmarc1'],
        negativeTags: ['dmarc1'],
        neutralTags: ['dmarc1'],
        positiveTags: ['dmarc1'],
      })
      await collections.domainsDMARC.save({
        _from: domain._id,
        _to: dmarc._id,
      })
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

    afterEach(async () => {
      await truncate()
    })

    afterAll(async () => {
      await drop()
    })

    describe('testing the id field resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dmarcType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(toGlobalId('dmarc', 1))
      })
    })
    describe('testing the domain resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dmarcType.getFields()

        const loader = loadDomainByKey({ query, userKey: '1', i18n: {} })

        await expect(
          demoType.domain.resolve(
            { domainId: domain._id },
            {},
            { loaders: { loadDomainByKey: loader } },
          ),
        ).resolves.toEqual({
          _id: domain._id,
          _key: domain._key,
          _rev: domain._rev,
          _type: 'domain',
          id: domain._key,
          domain: 'test.domain.gc.ca',
          slug: 'test-domain-gc-ca',
        })
      })
    })
    describe('testing the timestamp resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dmarcType.getFields()

        expect(
          demoType.timestamp.resolve({ timestamp: '2020-10-02T12:43:39Z' }),
        ).toEqual(new Date('2020-10-02T12:43:39Z'))
      })
    })
    describe('testing the record resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dmarcType.getFields()

        expect(demoType.record.resolve({ record: 'txtRecord' })).toEqual(
          'txtRecord',
        )
      })
    })
    describe('testing the pPolicy resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dmarcType.getFields()

        expect(demoType.pPolicy.resolve({ pPolicy: 'pPolicy' })).toEqual(
          'pPolicy',
        )
      })
    })
    describe('testing the spPolicy resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dmarcType.getFields()

        expect(demoType.spPolicy.resolve({ spPolicy: 'spPolicy' })).toEqual(
          'spPolicy',
        )
      })
    })
    describe('testing the pct resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dmarcType.getFields()

        expect(demoType.pct.resolve({ pct: 100 })).toEqual(100)
      })
    })
    describe('testing the rawJSON resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dmarcType.getFields()

        const rawJson = { item: 1234 }

        expect(demoType.rawJson.resolve({ rawJson })).toEqual(
          JSON.stringify(rawJson),
        )
      })
    })
    describe('testing the guidanceTag resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dmarcType.getFields()

        const loader = loadDmarcGuidanceTagConnectionsByTagId({
          query,
          userKey: '1',
          cleanseInput,
          i18n: {},
        })
        const guidanceTags = ['dmarc1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', dmarcGT._key),
              node: {
                _id: dmarcGT._id,
                _key: dmarcGT._key,
                _rev: dmarcGT._rev,
                _type: 'guidanceTag',
                guidance: 'Some Interesting Guidance',
                id: dmarcGT._key,
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
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', dmarcGT._key),
            endCursor: toGlobalId('guidanceTags', dmarcGT._key),
          },
        }

        await expect(
          demoType.guidanceTags.resolve(
            { guidanceTags },
            { first: 1 },
            { loaders: { loadDmarcGuidanceTagConnectionsByTagId: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the negativeGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dmarcType.getFields()

        const loader = loadDmarcGuidanceTagConnectionsByTagId({
          query,
          userKey: '1',
          cleanseInput,
          i18n: {},
        })
        const negativeTags = ['dmarc1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', dmarcGT._key),
              node: {
                _id: dmarcGT._id,
                _key: dmarcGT._key,
                _rev: dmarcGT._rev,
                _type: 'guidanceTag',
                guidance: 'Some Interesting Guidance',
                id: dmarcGT._key,
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
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', dmarcGT._key),
            endCursor: toGlobalId('guidanceTags', dmarcGT._key),
          },
        }

        await expect(
          demoType.negativeGuidanceTags.resolve(
            { negativeTags },
            { first: 1 },
            { loaders: { loadDmarcGuidanceTagConnectionsByTagId: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the neutralGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dmarcType.getFields()

        const loader = loadDmarcGuidanceTagConnectionsByTagId({
          query,
          userKey: '1',
          cleanseInput,
          i18n: {},
        })
        const neutralTags = ['dmarc1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', dmarcGT._key),
              node: {
                _id: dmarcGT._id,
                _key: dmarcGT._key,
                _rev: dmarcGT._rev,
                _type: 'guidanceTag',
                guidance: 'Some Interesting Guidance',
                id: dmarcGT._key,
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
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', dmarcGT._key),
            endCursor: toGlobalId('guidanceTags', dmarcGT._key),
          },
        }

        await expect(
          demoType.neutralGuidanceTags.resolve(
            { neutralTags },
            { first: 1 },
            { loaders: { loadDmarcGuidanceTagConnectionsByTagId: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the positiveGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = dmarcType.getFields()

        const loader = loadDmarcGuidanceTagConnectionsByTagId({
          query,
          userKey: '1',
          cleanseInput,
          i18n: {},
        })
        const positiveTags = ['dmarc1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', dmarcGT._key),
              node: {
                _id: dmarcGT._id,
                _key: dmarcGT._key,
                _rev: dmarcGT._rev,
                _type: 'guidanceTag',
                guidance: 'Some Interesting Guidance',
                id: dmarcGT._key,
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
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', dmarcGT._key),
            endCursor: toGlobalId('guidanceTags', dmarcGT._key),
          },
        }

        await expect(
          demoType.positiveGuidanceTags.resolve(
            { positiveTags },
            { first: 1 },
            { loaders: { loadDmarcGuidanceTagConnectionsByTagId: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
  })
})
