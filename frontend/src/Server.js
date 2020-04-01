const { join, resolve } = require('path')
const express = require('express')
const bodyParser = require('body-parser')

function Server() {
  const server = express()
  server.use(bodyParser.json())
  server.use(express.static(resolve(join('build'))))
  server.disable('x-powered-by')

  server.get('/alive', (_req, res) => {
    res.json({ status: 'ok' })
  })

  server.get('/ready', (_req, res) => {
    res.json({ status: 'ready' })
  })

  server.get('/*', (_req, res) => {
    res.sendFile(resolve(join('build', 'index.html')))
  })
  return server
}
module.exports.Server = Server
