import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLList,
  GraphQLBoolean,
} from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { GraphQLJSON, GraphQLDate } from 'graphql-scalars'

import { domainType } from '../../../domain/objects'
import { guidanceTagConnection } from '../../../guidance-tag/objects'
import { sslType } from '../index'

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
            { domainId: 'domains/1' },
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
        const guidanceTags = ['ssl1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', 'ssl1'),
              node: {
                _id: 'sslGuidanceTags/ssl1',
                _key: 'ssl1',
                _rev: 'rev',
                _type: 'guidanceTag',
                id: 'ssl1',
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
            startCursor: toGlobalId('guidanceTags', 'ssl1'),
            endCursor: toGlobalId('guidanceTags', 'ssl1'),
          },
        }

        await expect(
          demoType.guidanceTags.resolve(
            { guidanceTags },
            { first: 1 },
            {
              loaders: {
                loadSslGuidanceTagConnectionsByTagId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the negativeGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = sslType.getFields()
        const negativeTags = ['ssl1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', 'ssl1'),
              node: {
                _id: 'sslGuidanceTags/ssl1',
                _key: 'ssl1',
                _rev: 'rev',
                _type: 'guidanceTag',
                id: 'ssl1',
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
            startCursor: toGlobalId('guidanceTags', 'ssl1'),
            endCursor: toGlobalId('guidanceTags', 'ssl1'),
          },
        }

        await expect(
          demoType.negativeGuidanceTags.resolve(
            { negativeTags },
            { first: 1 },
            {
              loaders: {
                loadSslGuidanceTagConnectionsByTagId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the neutralGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = sslType.getFields()
        const neutralTags = ['ssl1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', 'ssl1'),
              node: {
                _id: 'sslGuidanceTags/ssl1',
                _key: 'ssl1',
                _rev: 'rev',
                _type: 'guidanceTag',
                id: 'ssl1',
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
            startCursor: toGlobalId('guidanceTags', 'ssl1'),
            endCursor: toGlobalId('guidanceTags', 'ssl1'),
          },
        }

        await expect(
          demoType.neutralGuidanceTags.resolve(
            { neutralTags },
            { first: 1 },
            {
              loaders: {
                loadSslGuidanceTagConnectionsByTagId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the positiveGuidanceTags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = sslType.getFields()
        const positiveTags = ['ssl1']

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', 'ssl1'),
              node: {
                _id: 'sslGuidanceTags/ssl1',
                _key: 'ssl1',
                _rev: 'rev',
                _type: 'guidanceTag',
                id: 'ssl1',
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
            startCursor: toGlobalId('guidanceTags', 'ssl1'),
            endCursor: toGlobalId('guidanceTags', 'ssl1'),
          },
        }

        await expect(
          demoType.positiveGuidanceTags.resolve(
            { positiveTags },
            { first: 1 },
            {
              loaders: {
                loadSslGuidanceTagConnectionsByTagId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
  })
})
