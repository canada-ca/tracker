require('dotenv-safe').config({
  allowEmptyValues: true,
  example: '.env.example',
})

const {
  DB_PASS: rootPass,
  DB_URL: url,
  DB_NAME: databaseName,
  NOTIFICATION_API_KEY,
  NOTIFICATION_API_URL,
} = process.env

const { ensure } = require('arango-tools')
const { NotifyClient } = require('notifications-node-client')
const { databaseOptions } = require('./database-options')

const { progressReportService } = require('./src')

const notifyClient = new NotifyClient(NOTIFICATION_API_URL, NOTIFICATION_API_KEY)

;(async () => {
  // Generate Database information
  const { query } = await ensure({
    type: 'database',
    name: databaseName,
    url,
    rootPassword: rootPass,
    options: databaseOptions({ rootPass }),
  })

  await progressReportService({ query, log: console.log, notifyClient })
})()
