const { ensure } = require('arango-tools')
const { NotifyClient } = require('notifications-node-client')
const { databaseOptions } = require('./database-options')
const { buildConfig } = require('./config')
const { createLogger } = require('./logger')
const { orgFootprintService } = require('./src')

require('dotenv-safe').config({
  allowEmptyValues: true,
  example: '.env.example',
})

const config = buildConfig()
const logger = createLogger({ level: config.logLevel, env: config.nodeEnv })
const notifyClient = new NotifyClient(config.notify.apiUrl, config.notify.apiKey)

;(async () => {
  // Generate Database information
  const { query } = await ensure({
    type: 'database',
    ...config.db,
    options: databaseOptions({ rootPass: config.db.rootPassword }),
  })

  await orgFootprintService({ config, logger, query, notifyClient })
})()
