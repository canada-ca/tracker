require('dotenv-safe').config({
  allowEmptyValues: true,
  example: '.env.example',
})

const moment = require('moment')

const { arangoConnection, createCosmosClient } = require('./src/database')
const { loadCosmosDates, loadDomainOwnership } = require('./src/loaders')
const { dmarcReport } = require('./src/dmarc-report')

const {
  DB_PASS: rootPass,
  DB_URL: url,
  DB_NAME: databaseName,
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

  const client = createCosmosClient()
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
