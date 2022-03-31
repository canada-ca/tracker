import { config } from 'dotenv-safe'
import { connect, JSONCodec, StringCodec } from 'nats'
// import fetch from 'node-fetch'
import { logger } from './src/logger.js'

config()

const { SUBSCRIBE_TO: topic, NATS_URL } = process.env
// console.log(NATS_URL, topic)

process.on('SIGTERM', () => process.exit(0))
process.on('SIGINT', () => process.exit(0))
;(async () => {
  const nc = await connect({ servers: NATS_URL })

  // create a codec
  const jc = JSONCodec()
  // create a simple subscriber and iterate over messages
  // matching the subscription
  const sub = nc.subscribe(topic, { queue: 'spring4shell-scanner' })
  for await (const m of sub) {
    // console.log({ m: JSON.stringify(jc.decode(m.data)) })
    const { domain } = jc.decode(m.data)
    // console.log(domain)
    const res = await fetch(`https://${domain}`)
    console.log(JSON.stringify({ domain: domain, httpStatus: res.status }))
  }
  console.log('subscription closed')

  // we want to insure that messages that are in flight
  // get processed, so we are going to drain the
  // connection. Drain is the same as close, but makes
  // sure that all messages in flight get seen
  // by the iterator. After calling drain on the connection
  // the connection closes.
  await nc.drain()

  // logger.info(`Dispatched ${count} domains in ${(stop - start) / 1000} seconds`)
  process.exit(0)
})()
