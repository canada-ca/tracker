require('dotenv-safe').config({
  allowEmptyValues: true,
  example: '.env.example',
})

const { ArangoTools } = require('arango-tools')
const { makeMigrations } = require('./migrations')
const fetch = require('isomorphic-fetch')
const { CosmosClient } = require('@azure/cosmos')
const moment = require('moment')

const {
  DB_PASS: rootPass,
  DB_URL: url,
  DB_NAME: databaseName,
  AZURE_CONN_STRING,
  DATABASE,
  SUMMARIES_CONTAINER,
} = process.env

const {
  arrayEquals,
  createSummaries,
  createSummaryEdge,
  createSummary,
  loadCurrentDates,
  loadDates,
  loadDomainOwnership,
  loadSummaryByDate,
  loadSummaryCountByDomain,
  upsertOwnership,
  removeOwnerships,
  removeSummary,
  removeSummaryEdge,
} = require('./src')

;(async () => {
  // Generate Database information
  const { migrate } = await ArangoTools({ rootPass, url })
  const { query, collections } = await migrate(
    makeMigrations({ databaseName, rootPass }),
  )

  const client = new CosmosClient(AZURE_CONN_STRING)
  const { database } = await client.databases.createIfNotExists({
    id: DATABASE,
  })

  const {
    container: summariesContainer,
  } = await database.containers.createIfNotExists({
    id: SUMMARIES_CONTAINER,
  })

  await removeOwnerships({ query })

  // Load ownership assignments from github
  const ownerships = await loadDomainOwnership({ fetch })

  const summaryCreateFunc = createSummaries(
    arrayEquals,
    loadCurrentDates(query),
    loadDates(moment),
    loadSummaryByDate(summariesContainer),
    loadSummaryCountByDomain(query),
    createSummaryEdge(collections),
    createSummary(query),
    removeSummaryEdge(query),
    removeSummary(query),
  )

  console.info('Assigning ownerships ...')
  Object.keys(ownerships).forEach((key) => {
    console.info(`Assigning domain ownership to: ${String(key)}`)
    upsertOwnership({ ownership: ownerships[key], key, query })

    ownerships[key].forEach((domain) => {
      summaryCreateFunc({
        domain,
      })
    })
  })

  console.info('Completed assigning ownerships.')
})()
