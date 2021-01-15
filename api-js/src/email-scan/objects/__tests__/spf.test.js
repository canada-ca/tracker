import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { GraphQLNonNull, GraphQLID, GraphQLInt, GraphQLString } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { GraphQLJSON } from 'graphql-scalars'

import { makeMigrations } from '../../../../migrations'
import { cleanseInput } from '../../../validators'
import { domainLoaderByKey } from '../../../domain/loaders'
import { domainType } from '../../../domain/objects'
import { spfGuidanceTagConnectionsLoader } from '../../../guidance-tag/loaders'
import { guidanceTagConnection } from '../../../guidance-tag/objects'
import { spfType } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

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
      expect(demoType.timestamp.type).toMatchObject(GraphQLString)
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
    it('has a guidanceTags field', () => {
      const demoType = spfType.getFields()

      expect(demoType).toHaveProperty('guidanceTags')
      expect(demoType.guidanceTags.type).toMatchObject(
        guidanceTagConnection.connectionType,
      )
    })
  })

  describe('testing the field resolvers', () => {
    let query, drop, truncate, migrate, collections, domain, spf, spfGT

    beforeAll(async () => {
      ;({ migrate } = await ArangoTools({ rootPass, url }))
      ;({ query, drop, truncate, collections } = await migrate(
        makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
      ))
    })

    beforeEach(async () => {
      domain = await collections.domains.save({
        domain: 'test.domain.gc.ca',
        slug: 'test-domain-gc-ca',
      })
      spf = await collections.spf.save({
        timestamp: '2020-10-02T12:43:39Z',
        lookups: 5,
        record: 'txtRecord',
        spfDefault: 'default',
        guidanceTags: ['spf1'],
      })
      await collections.domainsSPF.save({
        _from: domain._id,
        _to: spf._id,
      })
      spfGT = await collections.spfGuidanceTags.save({
        _key: 'spf1',
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
      })
    })

    afterEach(async () => {
      await truncate()
    })

    afterAll(async () => {
      await drop()
    })

    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = spfType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(toGlobalId('spf', '1'))
      })
    })
    describe('testing the domain resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = spfType.getFields()

        const loader = domainLoaderByKey(query, '1', {})

        const expectedResult = {
          _id: domain._id,
          _key: domain._key,
          _rev: domain._rev,
          id: domain._key,
          domain: 'test.domain.gc.ca',
          slug: 'test-domain-gc-ca',
        }

        await expect(
          demoType.domain.resolve(
            { domainId: domain._id },
            {},
            { loaders: { domainLoaderByKey: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the timestamp resolver', () => {
      it('returns the resolved value', () => {
        const demoType = spfType.getFields()

        expect(
          demoType.timestamp.resolve({ timestamp: '2020-10-02T12:43:39Z' }),
        ).toEqual('2020-10-02T12:43:39Z')
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

        const loader = spfGuidanceTagConnectionsLoader(
          query,
          '1',
          cleanseInput,
          {},
        )

        const guidanceTags = ['spf1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', spfGT._key),
              node: {
                _id: spfGT._id,
                _key: spfGT._key,
                _rev: spfGT._rev,
                id: spfGT._key,
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
            startCursor: toGlobalId('guidanceTags', spfGT._key),
            endCursor: toGlobalId('guidanceTags', spfGT._key),
          },
        }

        await expect(
          demoType.guidanceTags.resolve(
            { guidanceTags },
            { first: 1 },
            { loaders: { spfGuidanceTagConnectionsLoader: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
  })
})
