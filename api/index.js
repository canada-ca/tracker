import './src/env'
import { Database, aql } from 'arangojs'
import { Server } from './src/server'

const {
  PORT = 4000,
  DB_PASS: rootPass,
  DB_URL: url,
  DB_NAME: databaseName,
  DEPTH_LIMIT: maxDepth,
  COST_LIMIT: complexityCost,
  SCALAR_COST: scalarCost,
  OBJECT_COST: objectCost,
  LIST_FACTOR: listFactor,
  TRACING_ENABLED: tracing,
  LOGIN_REQUIRED,
} = process.env

const collections = [
  'users',
  'organizations',
  'domains',
  'dkim',
  'dkimResults',
  'dmarc',
  'spf',
  'https',
  'ssl',
  'dkimGuidanceTags',
  'dmarcGuidanceTags',
  'spfGuidanceTags',
  'httpsGuidanceTags',
  'sslGuidanceTags',
  'chartSummaries',
  'dmarcSummaries',
  'aggregateGuidanceTags',
  'scanSummaryCriteria',
  'chartSummaryCriteria',
  'scanSummaries',
  'affiliations',
  'claims',
  'domainsDKIM',
  'dkimToDkimResults',
  'domainsDMARC',
  'domainsSPF',
  'domainsHTTPS',
  'domainsSSL',
  'ownership',
  'domainsToDmarcSummaries',
]

;(async () => {
  const db = new Database({
    url,
    databaseName,
    auth: { username: 'root', password: rootPass },
  })

  const query = async function query(strings, ...vars) {
    return db.query(aql(strings, ...vars), {
      count: true,
    })
  }

  const transaction = async function transaction(collections) {
    return db.beginTransaction(collections)
  }

  const server = await Server({
    arango: {
      db: databaseName,
      url,
      as: {
        username: 'root',
        password: rootPass,
      },
    },
    maxDepth,
    complexityCost,
    scalarCost,
    objectCost,
    listFactor,
    tracing,
    context: {
      query,
      collections,
      transaction,
    },
  })

  console.log(
    `Starting server with "LOGIN_REQUIRED" set to "${LOGIN_REQUIRED}"`,
  )

  await server.listen(PORT, (err) => {
    if (err) throw err
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`)
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}/graphql`)
  })
})()
