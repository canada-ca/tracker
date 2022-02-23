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
import { loadSpfGuidanceTagByTagId } from '../../../guidance-tag/loaders'
import { loadDomainByKey } from '../../../domain/loaders'
import dbschema from '../../../../database.json';

const {
  REDIS_PORT_NUMBER,
  REDIS_DOMAIN_NAME,
  SPF_SCAN_CHANNEL,
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
    spfScan,
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

    spfScan = {
      lookups: 1,
      record: 'record',
      spfDefault: 'spfDefault',
      rawJson: {
        missing: true,
      },
      negativeTags: ['spf1'],
      neutralTags: ['spf1'],
      positiveTags: ['spf1'],
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

    await collections.spfGuidanceTags.save({
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
                `${SPF_SCAN_CHANNEL}/${subscriptionId}`,
                (_err, _count) => {
                  pub.publish(
                    `${SPF_SCAN_CHANNEL}/${subscriptionId}`,
                    JSON.stringify({
                      sharedId: sharedId,
                      domainKey: domain._key,
                      status: status,
                      results: spfScan,
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
        spfScanData {
          sharedId
          domain {
            domain
          }
          status
          lookups
          record
          spfDefault
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
          spfPubSub: pubsub,
        },
        userKey: 'uuid-1234',
        loaders: {
          loadDomainByKey: loadDomainByKey({ query, userKey: '1', i18n: {} }),
          loadSpfGuidanceTagByTagId: loadSpfGuidanceTagByTagId({
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
        spfScanData: {
          sharedId: sharedId,
          domain: {
            domain: 'test.domain.gc.ca',
          },
          status: status.toUpperCase(),
          lookups: 1,
          record: 'record',
          spfDefault: 'spfDefault',
          rawJson: '{"missing":true}',
          negativeGuidanceTags: [
            {
              id: toGlobalId('guidanceTag', 'spf1'),
              tagId: 'spf1',
              tagName: 'SPF-TAG',
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
              id: toGlobalId('guidanceTag', 'spf1'),
              tagId: 'spf1',
              tagName: 'SPF-TAG',
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
              id: toGlobalId('guidanceTag', 'spf1'),
              tagId: 'spf1',
              tagName: 'SPF-TAG',
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
