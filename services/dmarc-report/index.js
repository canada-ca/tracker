require('dotenv-safe').config({
  allowEmptyValues: true,
  example: '.env.example',
})

const { ensure } = require('arango-tools')
const { databaseOptions } = require('./database-options')
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
  calculatePercentages,
  createSummaries,
  createSummaryEdge,
  createSummary,
  loadCurrentDates,
  loadDates,
  loadDomainOwnership,
  loadSummaryByDate,
  loadSummaryCountByDomain,
  initializeSummaries,
  updateCurrentSummaries,
  updateMonthSummary,
  updateThirtyDays,
  upsertOwnership,
  removeOwnerships,
  removeSummary,
  removeSummaryEdge,
} = require('./src')

;(async () => {
  // Generate Database information
  const { query, collections } = await ensure({
    type: 'database',
    name: databaseName,
    url,
    rootPassword: rootPass,
    options: databaseOptions({ rootPass }),
  })

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
    loadDates(moment),
    loadSummaryCountByDomain(query),
    initializeSummaries(
      calculatePercentages,
      createSummaryEdge(collections),
      createSummary(query),
      loadSummaryByDate(summariesContainer),
    ),
    updateCurrentSummaries(
      arrayEquals,
      loadCurrentDates(query),
      updateThirtyDays(
        calculatePercentages,
        createSummary(query),
        createSummaryEdge(collections),
        loadSummaryByDate(summariesContainer),
        removeSummaryEdge(query),
        removeSummary(query),
      ),
      updateMonthSummary(
        calculatePercentages,
        createSummary(query),
        createSummaryEdge(collections),
        loadSummaryByDate(summariesContainer),
        removeSummaryEdge(query),
        removeSummary(query),
      ),
    ),
  )

  console.info('Assigning ownerships ...')
  const keys = Object.keys(ownerships)

  for (const key of keys) {
    console.info(`Assigning domain ownership to: ${String(key)}`)
    await upsertOwnership({ ownership: ownerships[key], key, query })

    for (const domain of ownerships[key]) {
      await summaryCreateFunc({ domain })
    }
  }

  console.info('Completed assigning ownerships.')
})()
