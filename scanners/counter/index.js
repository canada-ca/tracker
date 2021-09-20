import { config } from 'dotenv-safe'
import fs from 'fs'
import { connect } from 'nats'
import { differenceInTime } from './differenceInTime.js'

config()

const { NODE_ENV, SUBSCRIBE_TO: subject, NATS_SERVERS } = process.env

const events = []
let count = 0
let first, last

const exit = () => {
  const elapsedTime = differenceInTime(first, last)
  if (first && last) {
    console.log({ elapsedTime })
    if (NODE_ENV !== 'production') {
      console.log(`Writing the ${count} events of this run to events.json`)
      fs.writeFileSync(
        'events.json',
        JSON.stringify(events, null, 2),
        'utf8',
        console.log,
      )
    }
  }
  process.exit(0)
}

process.on('SIGTERM', exit)
process.on('SIGINT', exit)
;(async () => {
  const nc = await connect({ servers: NATS_SERVERS.split(',') })

  const sub = nc.subscribe(subject)
  for await (const m of sub) {
    const now = Date.now()
    if (!first) first = now
    last = now
    count++
    let service
    const subject = m.subject
    switch (subject) {
      case subject.match(/https.processed/)?.input:
        service = 'https-processor'
        break
      case subject.match(/dns.processed/)?.input:
        service = 'dns-processor'
        break
      case subject.match(/tls.processed/)?.input: {
        service = 'tls-processor'
        break
      }
      case subject.match(/https$/)?.input: {
        service = 'https-scanner'
        break
      }
      case subject.match(/tls$/)?.input: {
        service = 'tls-scanner'
        break
      }
      case subject.match(/dns$/)?.input: {
        service = 'dns-scanner'
        break
      }
      default: {
        service = 'domain-dispatcher'
        break
      }
    }
    const [_, domain] = subject.split('.')
    events.push({
      id: count,
      subject: m.subject,
      service,
      domain,
      time: Math.floor(now / 1000),
    })
    console.log({ count, subject: m.subject, time: now })
  }
})()
