import { ensure, dbNameFromFile } from 'arango-tools'
import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLList,
  GraphQLBoolean,
} from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { GraphQLJSON, GraphQLDate } from 'graphql-scalars'

import { databaseOptions } from '../../../../database-options'
import { cleanseInput } from '../../../validators'
import { loadDomainByKey } from '../../../domain/loaders'
import { domainType } from '../../../domain/objects'
import { loadSslGuidanceTagConnectionsByTagId } from '../../../guidance-tag/loaders'
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
    it('has a acceptableCiphers field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('acceptableCiphers')
      expect(demoType.acceptableCiphers.type).toMatchObject(
        GraphQLList(GraphQLString),
      )
    })
    it('has a acceptableCurves field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('acceptableCiphers')
      expect(demoType.acceptableCiphers.type).toMatchObject(
        GraphQLList(GraphQLString),
      )
    })
    it('has a ccsInjectionVulnerable field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('ccsInjectionVulnerable')
      expect(demoType.ccsInjectionVulnerable.type).toMatchObject(GraphQLBoolean)
    })
    it('has a domain field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(domainType)
    })
    it('has a heartbleedVulnerable field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('heartbleedVulnerable')
      expect(demoType.heartbleedVulnerable.type).toMatchObject(GraphQLBoolean)
    })
    it('has a rawJson field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('rawJson')
      expect(demoType.rawJson.type).toEqual(GraphQLJSON)
    })
    it('has a strongCiphers field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('strongCiphers')
      expect(demoType.strongCiphers.type).toMatchObject(
        GraphQLList(GraphQLString),
      )
    })
    it('has a strongCurves field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('strongCurves')
      expect(demoType.strongCurves.type).toMatchObject(
        GraphQLList(GraphQLString),
      )
    })
    it('has a supportsEcdhKeyExchange field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('supportsEcdhKeyExchange')
      expect(demoType.supportsEcdhKeyExchange.type).toMatchObject(
        GraphQLBoolean,
      )
    })
    it('has a timestamp field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('timestamp')
      expect(demoType.timestamp.type).toMatchObject(GraphQLDate)
    })
    it('has a weakCiphers field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('weakCiphers')
      expect(demoType.weakCiphers.type).toMatchObject(
        GraphQLList(GraphQLString),
      )
    })
    it('has a weakCurves field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('weakCurves')
      expect(demoType.weakCurves.type).toMatchObject(GraphQLList(GraphQLString))
    })
    it('has a guidanceTags field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('guidanceTags')
      expect(demoType.guidanceTags.type).toMatchObject(
        guidanceTagConnection.connectionType,
      )
    })
    it('has a negativeGuidanceTags field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('negativeGuidanceTags')
      expect(demoType.negativeGuidanceTags.type).toMatchObject(
        guidanceTagConnection.connectionType,
      )
    })
    it('has a neutralGuidanceTags field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('neutralGuidanceTags')
      expect(demoType.neutralGuidanceTags.type).toMatchObject(
        guidanceTagConnection.connectionType,
      )
    })
    it('has a positiveGuidanceTags field', () => {
      const demoType = sslType.getFields()

      expect(demoType).toHaveProperty('positiveGuidanceTags')
      expect(demoType.positiveGuidanceTags.type).toMatchObject(
        guidanceTagConnection.connectionType,
      )
    })
  })

  describe('testing the field resolvers', () => {
    let query, drop, truncate, collections, domain, ssl, sslGT

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
      ssl = await collections.ssl.save({
        timestamp: '2020-10-02T12:43:39Z',
        guidanceTags: ['ssl1'],
        negativeTags: ['ssl1'],
        neutralTags: ['ssl1'],
        positiveTags: ['ssl1'],
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
    describe('testing the acceptableCiphers resolver', () => {
      it('returns the resolved value', () => {
        const demoType = sslType.getFields()

        const ciphers = [
          'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384',
          'TLS_DHE_RSA_WITH_AES_128_GCM_SHA256',
        ]

        expect(
          demoType.acceptableCiphers.resolve({ acceptable_ciphers: ciphers }),
        ).toEqual([
          'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384',
          'TLS_DHE_RSA_WITH_AES_128_GCM_SHA256',
        ])
      })
    })
    describe('testing the acceptableCurves resolver', () => {
      it('returns the resolved value', () => {
        const demoType = sslType.getFields()

        const curves = ['curve123']

        expect(
          demoType.acceptableCurves.resolve({ acceptable_curves: curves }),
        ).toEqual(['curve123'])
      })
    })
    describe('testing the ccsInjectionVulnerable resolver', () => {
      it('returns the resolved value', () => {
        const demoType = sslType.getFields()

        expect(
          demoType.ccsInjectionVulnerable.resolve({
            ccs_injection_vulnerable: false,
          }),
        ).toEqual(false)
      })
    })
    describe('testing the domain resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = sslType.getFields()

        const loader = loadDomainByKey({ query, userKey: '1', i18n: {} })

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
            { loaders: { loadDomainByKey: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the heartbleedVulnerable resolver', () => {
      it('returns the resolved value', () => {
        const demoType = sslType.getFields()

        expect(
          demoType.heartbleedVulnerable.resolve({
            heartbleed_vulnerable: false,
          }),
        ).toEqual(false)
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
    describe('testing the strongCiphers resolver', () => {
      it('returns the resolved value', () => {
        const demoType = sslType.getFields()

        const ciphers = [
          'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384',
          'TLS_DHE_RSA_WITH_AES_128_GCM_SHA256',
        ]

        expect(
          demoType.strongCiphers.resolve({ strong_ciphers: ciphers }),
        ).toEqual([
          'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384',
          'TLS_DHE_RSA_WITH_AES_128_GCM_SHA256',
        ])
      })
    })
    describe('testing the strongCurves resolver', () => {
      it('returns the resolved value', () => {
        const demoType = sslType.getFields()

        const curves = ['curve123']

        expect(
          demoType.strongCurves.resolve({ strong_curves: curves }),
        ).toEqual(['curve123'])
      })
    })
    describe('testing the supportsEcdhKeyExchange resolver', () => {
      it('returns the resolved value', () => {
        const demoType = sslType.getFields()

        expect(
          demoType.supportsEcdhKeyExchange.resolve({
            supports_ecdh_key_exchange: false,
          }),
        ).toEqual(false)
      })
    })
    describe('testing the timestamp resolver', () => {
      it('returns the resolved value', () => {
        const demoType = sslType.getFields()

        expect(
          demoType.timestamp.resolve({ timestamp: '2020-10-02T12:43:39Z' }),
        ).toEqual(new Date('2020-10-02T12:43:39Z'))
      })
    })
    describe('testing the weakCiphers resolver', () => {
      it('returns the resolved value', () => {
        const demoType = sslType.getFields()

        const ciphers = [
          'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384',
          'TLS_DHE_RSA_WITH_AES_128_GCM_SHA256',
        ]

        expect(
          demoType.weakCiphers.resolve({ weak_ciphers: ciphers }),
        ).toEqual([
          'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384',
          'TLS_DHE_RSA_WITH_AES_128_GCM_SHA256',
        ])
      })
    })
    describe('testing the weakCurves resolver', () => {
      it('returns the resolved value', () => {
        const demoType = sslType.getFields()

        const curves = ['curve123']

        expect(demoType.weakCurves.resolve({ weak_curves: curves })).toEqual([
          'curve123',
        ])
      })
    })
    describe('testing the guidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = sslType.getFields()

        const loader = loadSslGuidanceTagConnectionsByTagId({
          query,
          userKey: '1',
          cleanseInput,
          i18n: {},
        })

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
            { loaders: { loadSslGuidanceTagConnectionsByTagId: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the negativeGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = sslType.getFields()

        const loader = loadSslGuidanceTagConnectionsByTagId({
          query,
          userKey: '1',
          cleanseInput,
          i18n: {},
        })

        const negativeTags = ['ssl1']

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
          demoType.negativeGuidanceTags.resolve(
            { negativeTags },
            { first: 1 },
            { loaders: { loadSslGuidanceTagConnectionsByTagId: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the neutralGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = sslType.getFields()

        const loader = loadSslGuidanceTagConnectionsByTagId({
          query,
          userKey: '1',
          cleanseInput,
          i18n: {},
        })

        const neutralTags = ['ssl1']

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
          demoType.neutralGuidanceTags.resolve(
            { neutralTags },
            { first: 1 },
            { loaders: { loadSslGuidanceTagConnectionsByTagId: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the positiveGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = sslType.getFields()

        const loader = loadSslGuidanceTagConnectionsByTagId({
          query,
          userKey: '1',
          cleanseInput,
          i18n: {},
        })

        const positiveTags = ['ssl1']

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
          demoType.positiveGuidanceTags.resolve(
            { positiveTags },
            { first: 1 },
            { loaders: { loadSslGuidanceTagConnectionsByTagId: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
  })
})
