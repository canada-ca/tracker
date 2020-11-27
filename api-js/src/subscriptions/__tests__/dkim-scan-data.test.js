const { REDIS_PORT_NUMBER, REDIS_DOMAIN_NAME, DKIM_SCAN_CHANNEL } = process.env

const redis = require('redis')
const { graphql, GraphQLSchema, subscribe, parse } = require('graphql')
const { RedisPubSub } = require('graphql-redis-subscriptions')

const { createQuerySchema } = require('../../queries')
const { createSubscriptionSchema } = require('../index')

describe('', () => {
  let pubsub, schema
  beforeAll(() => {
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      subscription: createSubscriptionSchema(),
    })

    pubsub = new RedisPubSub({
      publisher: redis.createClient(),
      subscriber: redis.createClient(),
    })
  })
  it('', async () => {
    pubsub.publish('scan/dkim/uuid-1234', JSON.stringify({}))

    const result = await subscribe(
      schema,
      parse(`
      subscription {
        dkimScanData (subscriptionId: "uuid-1234") {
          results {
            record
          }
        }
      }
      `),
      null,
      {},
    )

    await expect(await result.next().value.data).resolves.toEqual('')
  })
})
