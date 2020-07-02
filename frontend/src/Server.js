const { join, resolve } = require('path')
const express = require('express')
const bodyParser = require('body-parser')

const staticPath = join(resolve(process.cwd()), 'public')

function Server() {
  const server = express()
  server.use(bodyParser.json())
  server.disable('x-powered-by')
  server.set('trust proxy', true)

  server.get('/alive', (_req, res) => {
    res.json({ status: 'ok' })
  })

  server.get('/ready', (_req, res) => {
    res.json({ status: 'ready' })
  })

  server.use('/', express.static(staticPath, { maxage: '365d' }))

  server.get('*', (_req, res) => {
    res.sendFile(resolve(join('public', 'index.html')))
  })
  return server
}
module.exports.Server = Server
