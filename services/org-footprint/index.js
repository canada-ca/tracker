const { ensure } = require('arango-tools')
const { NotifyClient } = require('notifications-node-client')
const { databaseOptions } = require('./database-options')
const { buildConfig, ConfigError } = require('./config')
const { createLogger } = require('./logger')
const { orgFootprintService } = require('./src')

require('dotenv-safe').config({
  allowEmptyValues: true,
  example: '.env.example',
})

let config
try {
  config = buildConfig()
} catch (err) {
  if (!(err instanceof ConfigError)) throw err
  console.error(err.message)
  process.exit(1)
}

const logger = createLogger({ level: config.logLevel, env: config.nodeEnv })
const notifyClient = new NotifyClient(config.notify.apiUrl, config.notify.apiKey)

;(async () => {
  // Generate Database information
  const { query } = await ensure({
    type: 'database',
    ...config.db,
    options: databaseOptions({ rootPass: config.db.rootPassword }),
  })

  const failures = await orgFootprintService({ config, logger, query, notifyClient })
  if (failures > 0) process.exitCode = 1
})().catch((err) => {
  logger.error({ err }, 'org-footprint run failed')
  process.exitCode = 1
})
