require('dotenv-safe').config({
  allowEmptyValues: true,
  example: '.env.example',
})

const { DB_PASS: rootPass, DB_URL: url, DB_NAME: databaseName } = process.env

const { ensure } = require('arango-tools')
const { databaseOptions } = require('./database-options')

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
    console.log('Starting NXDOMAIN cleanup service...')
    await removeNXDomainService({ query, log: console.log })
    console.log('NXDOMAIN cleanup service finished successfully.')
  } catch (err) {
    console.log(err)
  }

  try {
    console.log('Starting unclaimed cleanup service...')
    await unclaimedCleanupService({ query, log: console.log })
    console.log('Unclaimed cleanup service finished successfully.')
  } catch (err) {
    console.log(err)
  }

  try {
    console.log('Starting untag new domains service...')
    await untagNewDomainsService({ query, log: console.log })
    console.log('Untag new domain service finished successfully.')
  } catch (err) {
    console.log(err)
  }
})()
