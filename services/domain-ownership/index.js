require('dotenv-safe').config({
  allowEmptyValues: true,
  example: '.env.example',
})

const { DB_PASS: rootPass, DB_URL: url, DB_NAME: databaseName } = process.env

const { ArangoTools } = require('arango-tools')
const { makeMigrations } = require('./migrations')
const fetch = require('isomorphic-fetch')
const {
  loadDomainOwnership,
  upsertOwnership,
  removeOwnerships,
} = require('./src')

;(async () => {
  // Generate Database information
  const { migrate } = await ArangoTools({ rootPass, url })
  const { query } = await migrate(makeMigrations({ databaseName, rootPass }))

  await removeOwnerships({ query })

  // Load ownership assignments from github
  const ownerships = await loadDomainOwnership({ fetch })
  await upsertOwnership({ ownerships, query })

  console.info('Completed assigning ownerships.')
})()
