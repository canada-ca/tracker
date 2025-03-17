require('dotenv-safe').config({
  allowEmptyValues: true,
  example: '.env.example',
})

const { CosmosClient } = require('@azure/cosmos')
const moment = require('moment')

const { arangoConnection } = require('./src/database')
const { loadCosmosDates, loadDomainOwnership } = require('./src/loaders')
const { dmarcReport } = require('./src/dmarc-report')

const {
  DB_PASS: rootPass,
  DB_URL: url,
  DB_NAME: databaseName,
  AZURE_CONN_STRING,
  DATABASE,
  SUMMARIES_CONTAINER,
  UPDATE_ALL_DATES,
} = process.env

const updateAllDates = UPDATE_ALL_DATES === 'true'

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

  const ownerships = await loadDomainOwnership()

  const cosmosDates = await loadCosmosDates({ container: summariesContainer })

  await dmarcReport({
    ownerships,
    arangoCtx: { collections, query, transaction },
    currentDate,
    cosmosDates,
    container: summariesContainer,
    updateAllDates,
  })
})()
