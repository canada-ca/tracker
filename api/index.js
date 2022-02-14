import './src/env'
import { ensure } from 'arango-tools'
import { Server } from './src/server'
import { databaseOptions } from './database-options'
import { connect, JSONCodec } from 'nats'

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
  LOGIN_REQUIRED,
  NATS_URL,
} = process.env

;(async () => {
  const { query, collections, transaction } = await ensure({
    type: 'database',
    name: databaseName,
    url,
    rootPassword: rootPass,
    options: databaseOptions({ rootPass }),
  })

  console.log(`Connecting to NATS server: ${NATS_URL}`)

  let nc
  try {
    nc = await connect({ servers: NATS_URL })
  } catch (e) {
    console.error('Error while connecting to NATS server: ', e)
  }

  console.log(`Successfully connected to NATS server: ${NATS_URL}`)

  let jsm
  try {
    jsm = await nc.jetstreamManager()
  } catch (e) {
    console.error('Error while creating jetstreamManager: ', e)
  }

  try {
    await jsm.streams.add({ name: 'domains', subjects: ['domains.*'] })
  } catch (e) {
    console.error('Error while adding jetstream stream "domains.*"')
  }

  // create a jetstream client:
  const js = nc.jetstream()

  // eslint-disable-next-line new-cap
  const jc = JSONCodec()

  const publish = async ({ channel, msg }) => {
    await js.publish(channel, jc.encode(msg))
  }

  const server = await Server({
    arango: {
      db: databaseName,
      url,
      as: {
        username: 'root',
        password: rootPass,
      },
    },
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
      publish,
    },
  })

  console.log(
    `Starting server with "LOGIN_REQUIRED" set to "${LOGIN_REQUIRED}"`,
  )

  await server.listen(PORT, (err) => {
    if (err) throw err
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`)
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}/graphql`)
  })
})()
