import { config } from 'dotenv-safe'
import { connect, JSONCodec } from 'nats'

config()

const { SUBSCRIBE_TO: topic, NATS_URL } = process.env

const headers = {
  DNT: '1',
  'Content-Type': 'application/x-www-form-urlencoded',
}
const body = 'class.module.classLoader.DefaultAssertionStatus=nonsense'
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
    const { domain } = jc.decode(m.data)
    try {
      const res1 = await fetch(`https://${domain}`)
      console.log(
        JSON.stringify({
          domain,
          method: 'GET',
          httpStatus: res1.status,
        }),
      )
    } catch (error) {
      console.error(JSON.stringify({ domain, error }))
    }
    try {
      const res2 = await fetch(`https://${domain}`, {
        method: 'POST',
        body,
        headers,
      })
      const data = await res2.text()
      console.log(
        JSON.stringify({
          domain,
          method: 'POST',
          httpStatus: res2.status,
          data,
        }),
      )
      if (res2.status === 400) console.info(`!!!${domain} returned code 400!!!`)
    } catch (error) {
      console.error(JSON.stringify({ domain, error }))
    }
  }
  console.log('subscription closed')

  // we want to insure that messages that are in flight
  // get processed, so we are going to drain the
  // connection. Drain is the same as close, but makes
  // sure that all messages in flight get seen
  // by the iterator. After calling drain on the connection
  // the connection closes.
  await nc.drain()

  process.exit(0)
})()
