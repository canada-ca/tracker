import { ArangoTools, dbNameFromFile } from 'arango-tools'
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

import { makeMigrations } from '../../../../migrations'
import { createQuerySchema } from '../../../query'
import { createSubscriptionSchema } from '../../../subscription'
import { dkimGuidanceTagLoader } from '../../../guidance-tag/loaders'

const {
  REDIS_PORT_NUMBER,
  REDIS_DOMAIN_NAME,
  DKIM_SCAN_CHANNEL,
  DB_PASS: rootPass,
  DB_URL: url,
} = process.env

describe('given the dkimScanData subscription', () => {
  let pubsub,
    schema,
    publisherClient,
    subscriberClient,
    query,
    truncate,
    collections,
    drop,
    migrate,
    options,
    dkimScan,
    createSubscriptionMutation

  beforeAll(async () => {
    options = {
      host: REDIS_DOMAIN_NAME,
      port: REDIS_PORT_NUMBER,
    }

    dkimScan = {
      scan: {
        results: [
          {
            selector: 'selector',
            record: 'record',
            keyLength: 'keyLength',
            guidanceTags: ['dkim1'],
          },
        ],
      },
    }

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
                `${DKIM_SCAN_CHANNEL}/${subscriptionId}`,
                (_err, _count) => {
                  pub.publish(
                    `${DKIM_SCAN_CHANNEL}/${subscriptionId}`,
                    JSON.stringify(dkimScan),
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

    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))

    publisherClient = new Redis(options)
    subscriberClient = new Redis(options)

    pubsub = new RedisPubSub({
      publisher: publisherClient,
      subscriber: subscriberClient,
    })
  })

  beforeEach(async () => {
    await collections.dkimGuidanceTags.save({
      _key: 'dkim1',
      tagName: 'DKIM-TAG',
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
    const triggerSubscription = graphql(
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

    const data = await subscribe(
      schema,
      parse(`
      subscription {
        dkimScanData (subscriptionId: "uuid-1234") {
          results {
            selector
            record
            keyLength
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
      }
      `),
      triggerSubscription,
      {
        pubsub,
        loaders: {
          dkimGuidanceTagLoader: dkimGuidanceTagLoader(query, '1', {}),
        },
      },
      {},
    )

    const result = await data.next()

    const expectedResult = {
      data: {
        dkimScanData: {
          results: [
            {
              selector: 'selector',
              record: 'record',
              keyLength: 'keyLength',
              guidanceTags: [
                {
                  id: toGlobalId('guidanceTags', 'dkim1'),
                  tagId: 'dkim1',
                  tagName: 'DKIM-TAG',
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
          ],
        },
      },
    }

    expect(result.value).toEqual(expectedResult)
  })
})
