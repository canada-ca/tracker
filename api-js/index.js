import './src/env'
import { ArangoTools } from 'arango-tools'
import { Server } from './src/server'
import { makeMigrations } from './migrations'

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
  const { migrate } = await ArangoTools({ rootPass, url })
  const { query, collections, transaction } = await migrate(
    makeMigrations({ databaseName, rootPass }),
  )

  Server(PORT, maxDepth, complexityCost, scalarCost, objectCost, listFactor, {
    query,
    collections,
    transaction,
  }).listen(PORT, (err) => {
    if (err) throw err
    console.log(
      `🚀 Server ready at http://localhost:${PORT}/graphql`,
    )
    console.log(
      `🚀 Subscriptions ready at ws://localhost:${PORT}/graphql`,
    )
  })
})()
