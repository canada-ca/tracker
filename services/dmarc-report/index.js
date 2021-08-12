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
  loadOrgOwner,
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

  const { container: summariesContainer } =
    await database.containers.createIfNotExists({
      id: SUMMARIES_CONTAINER,
    })

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
  const keys = Object.keys(ownerships)

  for (const orgAcronymEn of keys) {
    for (const domain of ownerships[orgAcronymEn]) {
      const orgOwner = await loadOrgOwner({
        query,
        domain,
      })

      console.log(orgOwner)

      if (!orgOwner) {
        console.info(`Assigning domain ownership to: ${String(orgAcronymEn)}`)
        await upsertOwnership({
          ownership: ownerships[orgAcronymEn],
          orgAcronymEn,
          query,
        })
      } else if (orgOwner === orgAcronymEn) {
        console.info(`Removing domain ownership to: ${domain}`)
        await removeOwnerships({ query, domain })
  
        console.info(`Assigning domain ownership to: ${String(orgAcronymEn)}`)
        await upsertOwnership({
          ownership: ownerships[orgAcronymEn],
          orgAcronymEn,
          query,
        })
      }

      await summaryCreateFunc({ domain })
    }
    break
  }

  console.info('Completed assigning ownerships.')
})()
