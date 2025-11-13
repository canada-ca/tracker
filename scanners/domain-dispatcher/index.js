import { config } from 'dotenv-safe'
import { Database } from 'arangojs'
import { connect } from 'nats'
import { dispatchDomains } from './src/dispatchDomains.js'
import { logger } from './src/logger.js'
import { isListening } from './src/isListening.js'
import wait from 'async-wait-until'
// eslint-disable-next-line
const { waitUntil, TimeoutError } = wait

config()

const {
  DB_HOST: host,
  DB_PORT: port,
  DB_COLLECTION: collection,
  DB_NAME: databaseName,
  DB_PASS: password,
  DB_USER: username,
  NATS_URL,
} = process.env

process.on('SIGTERM', () => process.exit(0))
process.on('SIGINT', () => process.exit(0))

let db
;(async () => {
  try {
    await waitUntil(() => isListening({ host, port }), {
      timeout: 100000,
    })
  } catch (e) {
    if (e instanceof TimeoutError) {
      // Unfortunately, 10 seconds have passed but we haven't detected the
      logger.error({
        message: 'No database connection after 10 seconds. Exiting.',
      })
      process.exit(1)
    } else {
      // Some another error, most likely thrown from the predicate
      logger.error({ message: e })
      process.exit(1)
    }
  }

  db = new Database({
    url: `http://${host}:${port}`,
    databaseName,
    auth: { username, password },
  })

  const nc = await connect({ servers: NATS_URL })

  // // create a jetstream client:
  const js = nc.jetstream()

  const publish = async ({ channel = 'scans.requests', msg }) => {
    await js.publish(channel, js.jc.encode(msg))
  }

  const start = new Date()
  const count = await dispatchDomains({
    db,
    publish,
    logger,
    collection,
  })
  const stop = new Date()

  logger.info(`Dispatched ${count} domains in ${(stop - start) / 1000} seconds`)
  process.exit(0)
})()
