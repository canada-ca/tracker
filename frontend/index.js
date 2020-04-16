const { Server } = require('./src/Server')
const { PORT = 3000, HOST = '0.0.0.0' } = process.env

;(async () => {
  const server = new Server()
  server.listen({ port: PORT, host: HOST }, () =>
    console.log(`🚀 Tracker listening on ${HOST}:${PORT}`),
  )
  process.on('SIGTERM', () => process.exit(0))
  process.on('SIGINT', () => process.exit(0))
})()
