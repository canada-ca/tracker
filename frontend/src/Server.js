const { join, resolve } = require('path')
const express = require('express')
const compression = require('compression')
const bodyParser = require('body-parser')
const fs = require('fs')

const staticPath = join(resolve(process.cwd()), 'public')

const frenchHosts = process.env.FRENCH_HOSTS?.split(',') || []
const isProduction = process.env.TRACKER_PRODUCTION === 'true'

const baseHtml = fs.readFileSync(resolve(join('public', 'index.html')), 'utf8')

const htmlByLanguage = {
  en: baseHtml.replace(
    '</head>',
    `<script>window.env={APP_DEFAULT_LANGUAGE:"en",APP_IS_PRODUCTION:${isProduction}}</script></head>`,
  ),
  fr: baseHtml.replace(
    '</head>',
    `<script>window.env={APP_DEFAULT_LANGUAGE:"fr",APP_IS_PRODUCTION:${isProduction}}</script></head>`,
  ),
}

function isHashed(filePath) {
  return /\.[0-9a-f]{8,}\./i.test(filePath)
}

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

  server.use(
    ['/manifest.json', '/robots.txt', '/favicon.ico'],
    express.static(staticPath, { maxAge: '1d', index: false }),
  )

  server.use(
    '/',
    express.static(staticPath, {
      index: false,
      setHeaders(res, filePath) {
        if (isHashed(filePath)) {
          // filePath contains a hash? Cache for 1 year
          res.setHeader('Cache-Control', 'public, max-age=31536000')
        } else {
          // file not already handled and does not contain a hash? Cache for 1d
          res.setHeader('Cache-Control', 'public, max-age=86400')
        }
      },
    }),
  )

  server.get('*', (req, res) => {
    const host = req.hostname
    const lang = frenchHosts.includes(host) ? 'fr' : 'en'

    res.set('Cache-Control', 'no-cache')

    res.send(htmlByLanguage[lang])
  })

  return server
}

module.exports.Server = Server
