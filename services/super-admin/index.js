require('dotenv-safe').config({
  allowEmptyValues: true,
  example: '.env.example',
})

const { DB_PASS: rootPass, DB_URL: url, DB_NAME: databaseName } = process.env

const bcrypt = require('bcrypt')
const { ArangoTools } = require('arango-tools')
const { makeMigrations } = require('./migrations')

const { superAdminService } = require('./src')

;(async () => {
  // Generate Database information
  const { migrate } = await ArangoTools({ rootPass, url })
  const { query, collections, transaction } = await migrate(
    makeMigrations({ databaseName, rootPass }),
  )

  await superAdminService({ query, collections, transaction, bcrypt })
})()
