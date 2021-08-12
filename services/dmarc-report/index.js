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

  // Load ownership assignments from github
  const ownerships = await loadDomainOwnership({ fetch })

  // get org acronyms
  const orgAcronyms = Object.keys(ownerships)

  // loop through orgs
  for (const orgAcronymEn of orgAcronyms) {
    console.log(`Updating DMARC summary info for org: ${String(orgAcronymEn)}`)
    // loop through the domains
    for (const domain of ownerships[orgAcronymEn]) {
      console.info(`\tWorking on domain: ${domain}`)

      // get the current owner of the domain
      const orgOwner = await loadOrgOwner({
        query,
        domain,
      })

      // if the domain is not owned create ownership
      if (!orgOwner) {
        console.info(`\t\tAssigning ${domain} ownership to: ${String(orgAcronymEn)}`)
        await upsertOwnership({
          ownership: ownerships[orgAcronymEn],
          key: orgAcronymEn,
          query,
        })
      } 
      // if the domain is owned by another org, remove ownership and assign a new one
      else if (orgOwner !== orgAcronymEn) {
        console.info(`\t\tRemoving ${domain} ownership to: ${domain}`)
        await removeOwnerships({ query, domain })

        console.info(`\t\tAssigning ${domain} ownership to: ${String(orgAcronymEn)}`)
        await upsertOwnership({
          ownership: ownerships[orgAcronymEn],
          orgAcronymEn,
          query,
        })
      } else {
        console.info(`\t\t${domain} is already assigned to ${String(orgAcronymEn)}`)
      }

      await summaryCreateFunc({ domain })
    }
    break
  }

  console.info('Completed assigning ownerships.')
})()
