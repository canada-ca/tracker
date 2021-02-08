import './src/env'
import { ensure } from 'arango-tools'
import { Server } from './src/server'
import { databaseOptions } from './database-options'
import Redis from 'ioredis'
import { RedisPubSub } from 'graphql-redis-subscriptions'

const {
  PORT = 4000,
  DB_PASS: rootPass,
  DB_URL: url,
  DB_NAME: databaseName,
  DEPTH_LIMIT: maxDepth,
  COST_LIMIT: complexityCost,
  SCALAR_COST: scalarCost,
  OBJECT_COST: objectCost,
  LIST_FACTOR: listFactor,
  TRACING_ENABLED: tracing,
  REDIS_PORT_NUMBER,
  REDIS_DOMAIN_NAME,
} = process.env

;(async () => {
  const { query, collections, transaction } = await ensure({
    type: 'database',
    name: databaseName,
    url,
    rootPassword: rootPass,
    options: databaseOptions({ rootPass }),
  })

  // Connect With Redis
  const options = {
    host: REDIS_DOMAIN_NAME,
    port: REDIS_PORT_NUMBER,
  }

  const pubsub = new RedisPubSub({
    publisher: new Redis(options),
    subscriber: new Redis(options),
  })

  Server({
    maxDepth,
    complexityCost,
    scalarCost,
    objectCost,
    listFactor,
    tracing,
    context: {
      query,
      collections,
      transaction,
      pubsub,
    },
  }).listen(PORT, (err) => {
    if (err) throw err
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`)
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}/graphql`)
  })
})()
