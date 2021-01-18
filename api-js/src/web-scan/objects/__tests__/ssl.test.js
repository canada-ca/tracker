import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { GraphQLNonNull, GraphQLID, GraphQLString } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { GraphQLJSON } from 'graphql-scalars'

import { makeMigrations } from '../../../../migrations'
import { cleanseInput } from '../../../validators'
import { domainLoaderByKey } from '../../../domain/loaders'
import { domainType } from '../../../domain/objects'
import { sslGuidanceTagConnectionsLoader } from '../../../guidance-tag/loaders'
import { guidanceTagConnection } from '../../../guidance-tag/objects'
import { sslType } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the ssl gql object', () => {
  describe('testing field definitions', () => {
    it('has an id field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a domain field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(domainType)
    })
    it('has a timestamp field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('timestamp')
      expect(demoType.timestamp.type).toMatchObject(GraphQLString)
    })
    it('has a rawJson field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('rawJson')
      expect(demoType.rawJson.type).toEqual(GraphQLJSON)
    })
    it('has a guidanceTags field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('guidanceTags')
      expect(demoType.guidanceTags.type).toMatchObject(
        guidanceTagConnection.connectionType,
      )
    })
  })

  describe('testing the field resolvers', () => {
    let query, drop, truncate, migrate, collections, domain, ssl, sslGT

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
      ssl = await collections.ssl.save({
        timestamp: '2020-10-02T12:43:39Z',
        guidanceTags: ['ssl1'],
      })
      await collections.domainsSSL.save({
        _from: domain._id,
        _to: ssl._id,
      })
      sslGT = await collections.sslGuidanceTags.save({
        _key: 'ssl1',
        tagName: 'SSL-TAG',
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
        const demoType = sslType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(toGlobalId('ssl', '1'))
      })
    })
    describe('testing the domain resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = sslType.getFields()

        const loader = domainLoaderByKey(query, '1', {})

        const expectedResult = {
          _id: domain._id,
          _key: domain._key,
          _rev: domain._rev,
          _type: 'domain',
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
        const demoType = sslType.getFields()

        expect(
          demoType.timestamp.resolve({ timestamp: '2020-10-02T12:43:39Z' }),
        ).toEqual('2020-10-02T12:43:39Z')
      })
    })
    describe('testing the rawJSON resolver', () => {
      it('returns the resolved value', () => {
        const demoType = sslType.getFields()

        const rawJson = { item: 1234 }

        expect(demoType.rawJson.resolve({ rawJson })).toEqual(
          JSON.stringify(rawJson),
        )
      })
    })
    describe('testing the guidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = sslType.getFields()

        const loader = sslGuidanceTagConnectionsLoader(
          query,
          '1',
          cleanseInput,
          {},
        )

        const guidanceTags = ['ssl1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', sslGT._key),
              node: {
                _id: sslGT._id,
                _key: sslGT._key,
                _rev: sslGT._rev,
                _type: 'guidanceTag',
                id: sslGT._key,
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
                tagId: 'ssl1',
                tagName: 'SSL-TAG',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', sslGT._key),
            endCursor: toGlobalId('guidanceTags', sslGT._key),
          },
        }

        await expect(
          demoType.guidanceTags.resolve(
            { guidanceTags },
            { first: 1 },
            { loaders: { sslGuidanceTagConnectionsLoader: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
  })
})
