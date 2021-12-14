const dns = require('dns2')
const { Packet } = dns

const { DOMAIN, TOKEN } = process.env

const domain = DOMAIN || 'log4shell.tracker.alpha.canada.ca'
const token = TOKEN || 't'

const server = dns.createServer({
  udp: true,
  tcp: true,
})

server.on('request', (request, send) => {
  const response = Packet.createResponseFromRequest(request)
  const [question] = request.questions
  const { name } = question

  // Test domain lookup
  if (name.endsWith(`.${token}.${domain}`)) {
    console.log(
      JSON.stringify({
        timestamp: Date.now(),
        domainHash: name.replace(`.${token}.${domain}`, ''),
      }),
    )
  }
  send(response)
})
;(async () => {
  const closed = new Promise((resolve) => process.on('SIGINT', resolve))
  await server.listen({
    udp: 5353,
    tcp: 5454,
  })
  console.log('Listening.')
  console.log(server.addresses())
  await closed
  process.stdout.write('\n')
  await server.close()
  console.log('Closed.')
})()
