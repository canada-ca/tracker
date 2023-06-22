require('dotenv-safe').config({
  allowEmptyValues: true,
  example: '.env.example',
})

const { DB_PASS: rootPass, DB_URL: url, DB_NAME: databaseName } = process.env

const { ensure } = require('arango-tools')
const { databaseOptions } = require('./database-options')

const { domainCleanupService } = require('./src')

;(async () => {
  // Generate Database information
  const { query } = await ensure({
    type: 'database',
    name: databaseName,
    url,
    rootPassword: rootPass,
    options: databaseOptions({ rootPass }),
  })

  await domainCleanupService({ query, log: console.log })
})()