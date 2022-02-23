import { ensure, dbNameFromFile } from 'arango-tools'
import Redis from 'ioredis'
import {
  graphql,
  GraphQLSchema,
  subscribe,
  parse,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLID,
} from 'graphql'
import { RedisPubSub } from 'graphql-redis-subscriptions'
import { toGlobalId } from 'graphql-relay'

import { createQuerySchema } from '../../../query'
import { createSubscriptionSchema } from '../../../subscription'
import { loadSslGuidanceTagByTagId } from '../../../guidance-tag/loaders'
import { loadDomainByKey } from '../../../domain/loaders'
import dbschema from '../../../../database.json';

const {
  REDIS_PORT_NUMBER,
  REDIS_DOMAIN_NAME,
  SSL_SCAN_CHANNEL,
  DB_PASS: rootPass,
  DB_URL: url,
} = process.env

describe('given the spfScanData subscription', () => {
  let pubsub,
    schema,
    publisherClient,
    subscriberClient,
    query,
    truncate,
    collections,
    drop,
    options,
    sslScan,
    createSubscriptionMutation,
    redis,
    pub,
    domain,
    sharedId,
    status

  beforeAll(async () => {
    options = {
      host: REDIS_DOMAIN_NAME,
      port: REDIS_PORT_NUMBER,
    }

    sslScan = {
      acceptable_ciphers: [
        'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384',
        'TLS_DHE_RSA_WITH_AES_128_GCM_SHA256',
      ],
      acceptable_curves: ['curve123'],
      ccs_injection_vulnerable: false,
      heartbleed_vulnerable: false,
      strong_ciphers: [
        'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384',
        'TLS_DHE_RSA_WITH_AES_128_GCM_SHA256',
      ],
      strong_curves: ['curve123'],
      supports_ecdh_key_exchange: false,
      weak_ciphers: [
        'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384',
        'TLS_DHE_RSA_WITH_AES_128_GCM_SHA256',
      ],
      weak_curves: ['curve123'],
      rawJson: {
        missing: true,
      },
      negativeTags: ['ssl1'],
      neutralTags: ['ssl1'],
      positiveTags: ['ssl1'],
    }

    // Generate DB Items
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

    publisherClient = new Redis(options)
    subscriberClient = new Redis(options)
    redis = new Redis(options)
    pub = new Redis(options)

    pubsub = new RedisPubSub({
      publisher: publisherClient,
      subscriber: subscriberClient,
    })
    await collections.sslGuidanceTags.save({
      _key: 'ssl1',
      en: {
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
      },
    })
    domain = await collections.domains.save({
      domain: 'test.domain.gc.ca',
      slug: 'test-domain-gc-ca',
    })
    sharedId = 'some-shared-id'
    status = 'pass'
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await publisherClient.quit()
    await subscriberClient.quit()
    await redis.quit()
    await pub.quit()
    await drop()
  })

  it('returns the subscription data', async () => {
    createSubscriptionMutation = () =>
      new GraphQLObjectType({
        name: 'Mutation',
        fields: () => ({
          testMutation: {
            type: GraphQLInt,
            args: {
              subscriptionId: {
                type: GraphQLID,
              },
            },
            resolve: async (_source, { subscriptionId }) => {
              await redis.subscribe(
                `${SSL_SCAN_CHANNEL}/${subscriptionId}`,
                (_err, _count) => {
                  pub.publish(
                    `${SSL_SCAN_CHANNEL}/${subscriptionId}`,
                    JSON.stringify({
                      sharedId: sharedId,
                      domainKey: domain._key,
                      status: status,
                      results: sslScan,
                    }),
                  )
                },
              )
              return 1
            },
          },
        }),
      })

    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createSubscriptionMutation(),
      subscription: createSubscriptionSchema(),
    })

    const triggerSubscription = setTimeout(() => {
      graphql(
        schema,
        `
          mutation {
            testMutation(subscriptionId: "uuid-1234")
          }
        `,
        null,
        {
          Redis,
          options,
        },
      )
    }, 100)

    const data = await subscribe(
      schema,
      parse(`
      subscription {
        sslScanData {
          sharedId
          domain {
            domain
          }
          status
          acceptableCiphers
          acceptableCurves
          ccsInjectionVulnerable
          heartbleedVulnerable
          strongCiphers
          strongCurves
          supportsEcdhKeyExchange
          weakCiphers
          weakCurves
          rawJson
          negativeGuidanceTags {
            id
            tagId
            tagName
            guidance
            refLinks {
              description
              refLink
            }
            refLinksTech {
              description
              refLink
            }
          }
          neutralGuidanceTags {
            id
            tagId
            tagName
            guidance
            refLinks {
              description
              refLink
            }
            refLinksTech {
              description
              refLink
            }
          }
          positiveGuidanceTags {
            id
            tagId
            tagName
            guidance
            refLinks {
              description
              refLink
            }
            refLinksTech {
              description
              refLink
            }
          }
        }
      }
      `),
      triggerSubscription,
      {
        pubsubs: {
          sslPubSub: pubsub,
        },
        userKey: 'uuid-1234',
        loaders: {
          loadDomainByKey: loadDomainByKey({ query, userKey: '1', i18n: {} }),
          loadSslGuidanceTagByTagId: loadSslGuidanceTagByTagId({
            query,
            userKey: '1',
            i18n: {},
            language: 'en',
          }),
        },
      },
      {},
    )

    const result = await data.next()

    const expectedResult = {
      data: {
        sslScanData: {
          sharedId: sharedId,
          domain: {
            domain: 'test.domain.gc.ca',
          },
          status: status.toUpperCase(),
          acceptableCiphers: [
            'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384',
            'TLS_DHE_RSA_WITH_AES_128_GCM_SHA256',
          ],
          acceptableCurves: ['curve123'],
          ccsInjectionVulnerable: false,
          heartbleedVulnerable: false,
          strongCiphers: [
            'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384',
            'TLS_DHE_RSA_WITH_AES_128_GCM_SHA256',
          ],
          strongCurves: ['curve123'],
          supportsEcdhKeyExchange: false,
          weakCiphers: [
            'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384',
            'TLS_DHE_RSA_WITH_AES_128_GCM_SHA256',
          ],
          weakCurves: ['curve123'],
          rawJson: '{"missing":true}',
          negativeGuidanceTags: [
            {
              id: toGlobalId('guidanceTag', 'ssl1'),
              tagId: 'ssl1',
              tagName: 'SSL-TAG',
              guidance: 'Some Interesting Guidance',
              refLinks: [
                {
                  description: 'refLinksGuide Description',
                  refLink: 'www.refLinksGuide.ca',
                },
              ],
              refLinksTech: [
                {
                  description: 'refLinksTechnical Description',
                  refLink: 'www.refLinksTechnical.ca',
                },
              ],
            },
          ],
          neutralGuidanceTags: [
            {
              id: toGlobalId('guidanceTag', 'ssl1'),
              tagId: 'ssl1',
              tagName: 'SSL-TAG',
              guidance: 'Some Interesting Guidance',
              refLinks: [
                {
                  description: 'refLinksGuide Description',
                  refLink: 'www.refLinksGuide.ca',
                },
              ],
              refLinksTech: [
                {
                  description: 'refLinksTechnical Description',
                  refLink: 'www.refLinksTechnical.ca',
                },
              ],
            },
          ],
          positiveGuidanceTags: [
            {
              id: toGlobalId('guidanceTag', 'ssl1'),
              tagId: 'ssl1',
              tagName: 'SSL-TAG',
              guidance: 'Some Interesting Guidance',
              refLinks: [
                {
                  description: 'refLinksGuide Description',
                  refLink: 'www.refLinksGuide.ca',
                },
              ],
              refLinksTech: [
                {
                  description: 'refLinksTechnical Description',
                  refLink: 'www.refLinksTechnical.ca',
                },
              ],
            },
          ],
        },
      },
    }

    expect(result.value).toEqual(expectedResult)
  })
})
