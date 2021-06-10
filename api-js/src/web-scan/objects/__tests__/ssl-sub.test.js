import { ensure, dbNameFromFile } from 'arango-tools'
import { GraphQLBoolean, GraphQLList, GraphQLString } from 'graphql'

import { databaseOptions } from '../../../../database-options'
import { loadSslGuidanceTagByTagId } from '../../../guidance-tag/loaders'
import { guidanceTagType } from '../../../guidance-tag/objects'
import { sslSubType } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the sslSubType object', () => {
  describe('testing field definitions', () => {
    it('has a acceptableCiphers field', () => {
      const demoType = sslSubType.getFields()

      expect(demoType).toHaveProperty('acceptableCiphers')
      expect(demoType.acceptableCiphers.type).toMatchObject(
        GraphQLList(GraphQLString),
      )
    })
    it('has a acceptableCurves field', () => {
      const demoType = sslSubType.getFields()

      expect(demoType).toHaveProperty('acceptableCiphers')
      expect(demoType.acceptableCiphers.type).toMatchObject(
        GraphQLList(GraphQLString),
      )
    })
    it('has a ccsInjectionVulnerable field', () => {
      const demoType = sslSubType.getFields()

      expect(demoType).toHaveProperty('ccsInjectionVulnerable')
      expect(demoType.ccsInjectionVulnerable.type).toMatchObject(GraphQLBoolean)
    })
    it('has a heartbleedVulnerable field', () => {
      const demoType = sslSubType.getFields()

      expect(demoType).toHaveProperty('heartbleedVulnerable')
      expect(demoType.heartbleedVulnerable.type).toMatchObject(GraphQLBoolean)
    })
    it('has a strongCiphers field', () => {
      const demoType = sslSubType.getFields()

      expect(demoType).toHaveProperty('strongCiphers')
      expect(demoType.strongCiphers.type).toMatchObject(
        GraphQLList(GraphQLString),
      )
    })
    it('has a strongCurves field', () => {
      const demoType = sslSubType.getFields()

      expect(demoType).toHaveProperty('strongCurves')
      expect(demoType.strongCurves.type).toMatchObject(
        GraphQLList(GraphQLString),
      )
    })
    it('has a supportsEcdhKeyExchange field', () => {
      const demoType = sslSubType.getFields()

      expect(demoType).toHaveProperty('supportsEcdhKeyExchange')
      expect(demoType.supportsEcdhKeyExchange.type).toMatchObject(
        GraphQLBoolean,
      )
    })
    it('has a weakCiphers field', () => {
      const demoType = sslSubType.getFields()

      expect(demoType).toHaveProperty('weakCiphers')
      expect(demoType.weakCiphers.type).toMatchObject(
        GraphQLList(GraphQLString),
      )
    })
    it('has a weakCurves field', () => {
      const demoType = sslSubType.getFields()

      expect(demoType).toHaveProperty('weakCurves')
      expect(demoType.weakCurves.type).toMatchObject(GraphQLList(GraphQLString))
    })
    it('has negativeGuidanceTags field', () => {
      const demoType = sslSubType.getFields()

      expect(demoType).toHaveProperty('negativeGuidanceTags')
      expect(demoType.negativeGuidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
    it('has neutralGuidanceTags field', () => {
      const demoType = sslSubType.getFields()

      expect(demoType).toHaveProperty('neutralGuidanceTags')
      expect(demoType.neutralGuidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
    it('has positiveGuidanceTags field', () => {
      const demoType = sslSubType.getFields()

      expect(demoType).toHaveProperty('positiveGuidanceTags')
      expect(demoType.positiveGuidanceTags.type).toMatchObject(
        GraphQLList(guidanceTagType),
      )
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the acceptableCiphers resolver', () => {
      it('returns the resolved value', () => {
        const demoType = sslSubType.getFields()

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
        const demoType = sslSubType.getFields()

        const curves = ['curve123']

        expect(
          demoType.acceptableCurves.resolve({ acceptable_curves: curves }),
        ).toEqual(['curve123'])
      })
    })
    describe('testing the ccsInjectionVulnerable resolver', () => {
      it('returns the resolved value', () => {
        const demoType = sslSubType.getFields()

        expect(
          demoType.ccsInjectionVulnerable.resolve({
            ccs_injection_vulnerable: false,
          }),
        ).toEqual(false)
      })
    })
    describe('testing the heartbleedVulnerable resolver', () => {
      it('returns the resolved value', () => {
        const demoType = sslSubType.getFields()

        expect(
          demoType.heartbleedVulnerable.resolve({
            heartbleed_vulnerable: false,
          }),
        ).toEqual(false)
      })
    })
    describe('testing the strongCiphers resolver', () => {
      it('returns the resolved value', () => {
        const demoType = sslSubType.getFields()

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
        const demoType = sslSubType.getFields()

        const curves = ['curve123']

        expect(
          demoType.strongCurves.resolve({ strong_curves: curves }),
        ).toEqual(['curve123'])
      })
    })
    describe('testing the supportsEcdhKeyExchange resolver', () => {
      it('returns the resolved value', () => {
        const demoType = sslSubType.getFields()

        expect(
          demoType.supportsEcdhKeyExchange.resolve({
            supports_ecdh_key_exchange: false,
          }),
        ).toEqual(false)
      })
    })
    describe('testing the weakCiphers resolver', () => {
      it('returns the resolved value', () => {
        const demoType = sslSubType.getFields()

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
        const demoType = sslSubType.getFields()

        const curves = ['curve123']

        expect(demoType.weakCurves.resolve({ weak_curves: curves })).toEqual([
          'curve123',
        ])
      })
    })
    describe('testing the negativeGuidanceTags resolver', () => {
      let query, drop, truncate, collections, sslGT
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
      afterAll(async () => {
        await drop()
      })
      it('returns the parsed value', async () => {
        const demoType = sslSubType.getFields()

        const loader = loadSslGuidanceTagByTagId({
          query,
          userKey: '1',
          i18n: {},
        })
        const negativeTags = ['ssl1']

        expect(
          await demoType.negativeGuidanceTags.resolve(
            { negativeTags },
            {},
            { loaders: { loadSslGuidanceTagByTagId: loader } },
          ),
        ).toEqual([
          {
            _id: sslGT._id,
            _key: sslGT._key,
            _rev: sslGT._rev,
            _type: 'guidanceTag',
            guidance: 'Some Interesting Guidance',
            id: 'ssl1',
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
        ])
      })
    })
    describe('testing the neutralGuidanceTags resolver', () => {
      let query, drop, truncate, collections, sslGT
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
      afterAll(async () => {
        await drop()
      })
      it('returns the parsed value', async () => {
        const demoType = sslSubType.getFields()

        const loader = loadSslGuidanceTagByTagId({
          query,
          userKey: '1',
          i18n: {},
        })
        const neutralTags = ['ssl1']

        expect(
          await demoType.neutralGuidanceTags.resolve(
            { neutralTags },
            {},
            { loaders: { loadSslGuidanceTagByTagId: loader } },
          ),
        ).toEqual([
          {
            _id: sslGT._id,
            _key: sslGT._key,
            _rev: sslGT._rev,
            _type: 'guidanceTag',
            guidance: 'Some Interesting Guidance',
            id: 'ssl1',
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
        ])
      })
    })
    describe('testing the positiveGuidanceTags resolver', () => {
      let query, drop, truncate, collections, sslGT
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
      afterAll(async () => {
        await drop()
      })
      it('returns the parsed value', async () => {
        const demoType = sslSubType.getFields()

        const loader = loadSslGuidanceTagByTagId({
          query,
          userKey: '1',
          i18n: {},
        })
        const positiveTags = ['ssl1']

        expect(
          await demoType.positiveGuidanceTags.resolve(
            { positiveTags },
            {},
            { loaders: { loadSslGuidanceTagByTagId: loader } },
          ),
        ).toEqual([
          {
            _id: sslGT._id,
            _key: sslGT._key,
            _rev: sslGT._rev,
            _type: 'guidanceTag',
            guidance: 'Some Interesting Guidance',
            id: 'ssl1',
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
        ])
      })
    })
  })
})
