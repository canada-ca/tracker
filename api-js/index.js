import './src/env'
import { ArangoTools } from 'arango-tools'
import { Server } from './src/server'
import { makeMigrations } from './migrations'
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
  REDIS_PORT_NUMBER,
  REDIS_DOMAIN_NAME,
} = process.env

;(async () => {
  // Connect With Arango
  const { migrate } = await ArangoTools({ rootPass, url })
  const { query, collections, transaction } = await migrate(
    makeMigrations({ databaseName, rootPass }),
  )

  // Connect With Redis
  const options = {
    host: REDIS_DOMAIN_NAME,
    port: REDIS_PORT_NUMBER,
  }

  const pubsub = new RedisPubSub({
    publisher: new Redis(options),
    subscriber: new Redis(options),
  })

  Server(PORT, maxDepth, complexityCost, scalarCost, objectCost, listFactor, {
    query,
    collections,
    transaction,
    pubsub,
  }).listen(PORT, (err) => {
    if (err) throw err
    console.log(
      `🚀 Server ready at http://localhost:${PORT}/graphql`,
    )
    console.log(
      `🚀 Subscriptions ready at ws://localhost:${PORT}/graphql`,
    )
  })
})()
