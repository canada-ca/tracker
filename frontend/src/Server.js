const { join, resolve } = require('path')
const express = require('express')
const compression = require('compression')
const bodyParser = require('body-parser')
const fs = require('fs')

const staticPath = join(resolve(process.cwd()), 'public')

const frenchHosts = process.env.FRENCH_HOSTS?.split(',') || []
const isProduction = process.env.TRACKER_PRODUCTION === 'true'

function Server() {
  const server = express()
  server.use(bodyParser.json())
  server.use(compression())
  server.disable('x-powered-by')
  server.set('trust proxy', true)

  server.get('/alive', (_req, res) => {
    res.json({ status: 'ok' })
  })

  server.get('/ready', (_req, res) => {
    res.json({ status: 'ready' })
  })

  server.use('/', express.static(staticPath, { maxage: '365d', index: false }))

  server.get('*', (req, res) => {
    const host = req.hostname
    const defaultLanguage = frenchHosts.includes(host) ? 'fr' : 'en'
    let html = fs
      .readFileSync(resolve(join('public', 'index.html')), 'utf8')
      .replace(
        '</head>',
        `<script>window.env={APP_DEFAULT_LANGUAGE:"${defaultLanguage}",APP_IS_PRODUCTION:${isProduction} }</script></head>`,
      )
    res.send(html)
  })
  return server
}
module.exports.Server = Server
