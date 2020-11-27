const {
  REDIS_PORT_NUMBER,
  REDIS_DOMAIN_NAME,
  HTTPS_SCAN_CHANNEL,
  DB_PASS: rootPass,
  DB_URL: url,
} = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const Redis = require('ioredis')
const {
  graphql,
  GraphQLSchema,
  subscribe,
  parse,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLID,
} = require('graphql')
const { RedisPubSub } = require('graphql-redis-subscriptions')

const { makeMigrations } = require('../../../migrations')
const { createQuerySchema } = require('../../queries')
const { createSubscriptionSchema } = require('../index')
const { httpsGuidanceTagLoader } = require('../../loaders')
const { toGlobalId } = require('graphql-relay')

describe('given the httpsScanData subscription', () => {
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
    httpsScan,
    createSubscriptionMutation

  beforeAll(async () => {
    options = {
      host: REDIS_DOMAIN_NAME,
      port: REDIS_PORT_NUMBER,
    }

    httpsScan = {
      scan: {
        implementation: 'implementation',
        enforced: 'enforced',
        hsts: 'hsts',
        hstsAge: 'hstsAge',
        preloaded: 'preloaded',
        guidanceTags: ['https1'],
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
                `${HTTPS_SCAN_CHANNEL}/${subscriptionId}`,
                (_err, _count) => {
                  pub.publish(
                    `${HTTPS_SCAN_CHANNEL}/${subscriptionId}`,
                    JSON.stringify(httpsScan),
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
    await collections.httpsGuidanceTags.save({
      _key: 'https1',
      tagName: 'HTTPS-TAG',
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
        httpsScanData (subscriptionId: "uuid-1234") {
          implementation
          enforced
          hsts
          hstsAge
          preloaded
          guidanceTags {
            id
            tagId
            tagName
            guidance
            refLinks {
              description
              refLink
            }
            refLinksTechnical {
              description
              refLink
            }
          }
        }
      }
      `),
      triggerSubscription,
      {
        pubsub,
        loaders: {
          httpsGuidanceTagLoader: httpsGuidanceTagLoader(query, '1', {}),
        },
      },
      {},
    )

    const result = await data.next()

    const expectedResult = {
      data: {
        httpsScanData: {
          implementation: 'implementation',
          enforced: 'enforced',
          hsts: 'hsts',
          hstsAge: 'hstsAge',
          preloaded: 'preloaded',
          guidanceTags: [
            {
              id: toGlobalId('guidanceTags', 'https1'),
              tagId: 'https1',
              tagName: 'HTTPS-TAG',
              guidance: 'Some Interesting Guidance',
              refLinks: [
                {
                  description: 'refLinksGuide Description',
                  refLink: 'www.refLinksGuide.ca',
                },
              ],
              refLinksTechnical: [
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
