import './src/env'
import { ensure } from 'arango-tools'
import { Server } from './src/server'
import { databaseOptions } from './database-options'

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
} = process.env

;(async () => {
  const { query, collections, transaction } = await ensure({
    type: 'database',
    name: databaseName,
    url,
    rootPassword: rootPass,
    options: databaseOptions({ rootPass }),
  })

  Server(PORT, maxDepth, complexityCost, scalarCost, objectCost, listFactor, {
    query,
    collections,
    transaction,
  }).listen(PORT, (err) => {
    if (err) throw err
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`)
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}/graphql`)
  })
})()
