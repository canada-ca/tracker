require('dotenv-safe').config({
  allowEmptyValues: true,
  example: '.env.example',
})

const { DB_PASS: rootPass, DB_URL: url, DB_NAME: databaseName } = process.env

const { ensure } = require('arango-tools')
const { databaseOptions } = require('./database-options')
const logger = require('./src/logger')

const { removeNXDomainService, unclaimedCleanupService, untagNewDomainsService } = require('./src')

;(async () => {
  // Generate Database information
  const { query } = await ensure({
    type: 'database',
    name: databaseName,
    url,
    rootPassword: rootPass,
    options: databaseOptions({ rootPass }),
  })

  try {
    logger.info('Starting NXDOMAIN cleanup service...')
    await removeNXDomainService({ query, log: logger.info.bind(logger) })
    logger.info('NXDOMAIN cleanup service finished successfully.')
  } catch (err) {
    logger.error({ err }, 'NXDOMAIN cleanup service failed')
  }

  try {
    logger.info('Starting unclaimed cleanup service...')
    await unclaimedCleanupService({ query, log: logger.info.bind(logger) })
    logger.info('Unclaimed cleanup service finished successfully.')
  } catch (err) {
    logger.error({ err }, 'Unclaimed cleanup service failed')
  }

  try {
    logger.info('Starting untag new domains service...')
    await untagNewDomainsService({ query, log: logger.info.bind(logger) })
    logger.info('Untag new domain service finished successfully.')
  } catch (err) {
    logger.error({ err }, 'Untag new domain service failed')
  }
})()
