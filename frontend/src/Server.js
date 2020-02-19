const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')

function Server() {
  const server = express()
  server.use(bodyParser.json())
  server.use(express.static('./dist'))

  server.get('/alive', (_req, res) => {
    res.json({ status: 'ok' })
  })

  server.get('/ready', (_req, res) => {
    res.json({ status: 'ready' })
  })

  server.get('/*', (_req, res) => {
    const indexFile = path.resolve('./dist/index.html')
    res.sendFile(indexFile)
  })
  return server
}
module.exports.Server = Server
