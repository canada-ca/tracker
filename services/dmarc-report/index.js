require('dotenv-safe').config({
  allowEmptyValues: true,
  example: '.env.example',
})

const { CosmosClient } = require('@azure/cosmos')
const moment = require('moment')

const {
  createOwnership,
  createSummary,
  removeOwnership,
  removeSummary,
  upsertSummary,
  arangoConnection,
} = require('./src/database')
const {
  loadArangoDates,
  loadArangoThirtyDaysCount,
  loadCategoryTotals,
  loadCheckDomain,
  loadCheckOrg,
  loadCosmosDates,
  loadDkimFailureTable,
  loadDmarcFailureTable,
  loadFullPassTable,
  loadOrgOwner,
  loadDomainOwnership,
  loadSpfFailureTable,
} = require('./src/loaders')
const { dmarcReport } = require('./src/dmarc-report')

const {
  DB_PASS: rootPass,
  DB_URL: url,
  DB_NAME: databaseName,
  AZURE_CONN_STRING,
  DATABASE,
  SUMMARIES_CONTAINER,
} = process.env

;(async () => {
  const { collections, query, transaction } = await arangoConnection({
    url,
    databaseName,
    rootPass,
  })

  const client = new CosmosClient(AZURE_CONN_STRING)
  const { database } = await client.databases.createIfNotExists({
    id: DATABASE,
  })

  const { container: summariesContainer } = await database.containers.createIfNotExists({
    id: SUMMARIES_CONTAINER,
  })

  const currentDate = moment().startOf('month').format('YYYY-MM-DD')
  const cosmosDates = await loadCosmosDates({
    container: summariesContainer,
  })()

  // setup factory functions
  const setupCreateSummary = createSummary({
    transaction,
    collections,
    query,
    loadCategoryTotals: loadCategoryTotals({
      container: summariesContainer,
    }),
    loadDkimFailureTable: loadDkimFailureTable({
      container: summariesContainer,
    }),
    loadDmarcFailureTable: loadDmarcFailureTable({
      container: summariesContainer,
    }),
    loadFullPassTable: loadFullPassTable({
      container: summariesContainer,
    }),
    loadSpfFailureTable: loadSpfFailureTable({
      container: summariesContainer,
    }),
  })

  const setupUpsertSummary = upsertSummary({
    transaction,
    collections,
    query,
    loadCategoryTotals: loadCategoryTotals({
      container: summariesContainer,
    }),
    loadDkimFailureTable: loadDkimFailureTable({
      container: summariesContainer,
    }),
    loadDmarcFailureTable: loadDmarcFailureTable({
      container: summariesContainer,
    }),
    loadFullPassTable: loadFullPassTable({
      container: summariesContainer,
    }),
    loadSpfFailureTable: loadSpfFailureTable({
      container: summariesContainer,
    }),
  })

  const setupCreateOwnership = createOwnership({
    transaction,
    collections,
    query,
  })

  const setupRemoveOwnership = removeOwnership({
    transaction,
    collections,
    query,
  })

  const setupRemoveSummary = removeSummary({ transaction, collections, query })

  const ownerships = await loadDomainOwnership()

  await dmarcReport({
    ownerships,
    loadArangoDates: loadArangoDates({ query }),
    loadArangoThirtyDaysCount: loadArangoThirtyDaysCount({ query }),
    loadCheckOrg: loadCheckOrg({ query }),
    loadCheckDomain: loadCheckDomain({ query }),
    loadOrgOwner: loadOrgOwner({ query }),
    createOwnership: setupCreateOwnership,
    removeOwnership: setupRemoveOwnership,
    removeSummary: setupRemoveSummary,
    createSummary: setupCreateSummary,
    upsertSummary: setupUpsertSummary,
    cosmosDates,
    currentDate,
  })
})()
