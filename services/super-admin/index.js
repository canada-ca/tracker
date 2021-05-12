require('dotenv-safe').config({
  allowEmptyValues: true,
  example: '.env.example',
})

const { DB_PASS: rootPass, DB_URL: url, DB_NAME: databaseName } = process.env

const bcrypt = require('bcryptjs')
const { ensure } = require('arango-tools')
const { databaseOptions } = require('./database-options')

const { superAdminService } = require('./src')

;(async () => {
  // Generate Database information
  const { query, collections, transaction } = await ensure({
    type: 'database',
    name: databaseName,
    url,
    rootPassword: rootPass,
    options: databaseOptions({ rootPass }),
  })

  await superAdminService({ query, collections, transaction, bcrypt, log: console.log })
})()
