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

import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createSubscriptionSchema } from '../../../subscription'
import { loadSslGuidanceTagByTagId } from '../../../guidance-tag/loaders'
import { toGlobalId } from 'graphql-relay'

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
    createSubscriptionMutation

  beforeAll(async () => {
    options = {
      host: REDIS_DOMAIN_NAME,
      port: REDIS_PORT_NUMBER,
    }

    sslScan = {
      guidanceTags: ['ssl1'],
    }

    // Generate DB Items
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))

    publisherClient = new Redis(options)
    subscriberClient = new Redis(options)

    pubsub = new RedisPubSub({
      publisher: publisherClient,
      subscriber: subscriberClient,
    })
  })

  beforeEach(async () => {
    await collections.sslGuidanceTags.save({
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
    await publisherClient.quit()
    await subscriberClient.quit()
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
            resolve: async (
              _source,
              { subscriptionId },
              { Redis, options },
            ) => {
              const redis = await new Redis(options)
              const pub = await new Redis(options)

              await redis.subscribe(
                `${SSL_SCAN_CHANNEL}/${subscriptionId}`,
                (_err, _count) => {
                  pub.publish(
                    `${SSL_SCAN_CHANNEL}/${subscriptionId}`,
                    JSON.stringify(sslScan),
                  )
                },
              )

              await redis.quit()
              await pub.quit()

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
          guidanceTags {
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
          loadSslGuidanceTagByTagId: loadSslGuidanceTagByTagId({
            query,
            userKey: '1',
            i18n: {},
          }),
        },
      },
      {},
    )

    const result = await data.next()

    const expectedResult = {
      data: {
        sslScanData: {
          guidanceTags: [
            {
              id: toGlobalId('guidanceTags', 'ssl1'),
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
