const { join, resolve } = require('path')
const express = require('express')
const bodyParser = require('body-parser')

function Server() {
  const server = express()
  const staticPath = join(resolve(process.cwd()), 'public')
  server.use('/', express.static(staticPath, { maxage: '365d' }))
  server.use(bodyParser.json())
  server.disable('x-powered-by')

  server.get('/alive', (_req, res) => {
    res.json({ status: 'ok' })
  })

  server.get('/ready', (_req, res) => {
    res.json({ status: 'ready' })
  })

  server.get('/*', (_req, res) => {
    console.log(_req.path)
    res.sendFile(resolve(join('public', 'index.html')))
  })
  return server
}
module.exports.Server = Server
