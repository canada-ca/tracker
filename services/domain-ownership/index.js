const dotenv = require('dotenv-safe')
dotenv.config()

const {
  DB_PASS: rootPass,
  DB_URL: url,
  DB_NAME: databaseName,
} = process.env

const {ArangoTools} = require('arango-tools')
const { makeMigrations } = require('./migrations')
const { loadDomainOwnership, upsertOwnership } = require('./src')

;(async () => {
  // Generate Database information
  const { migrate } = await ArangoTools({ rootPass, url })
  const { query } = await migrate(
    makeMigrations({ databaseName, rootPass }),
  )
  // Load ownership assignments from github
  const ownerships = await loadDomainOwnership()

  upsertOwnership({ ownerships, query })

})()
