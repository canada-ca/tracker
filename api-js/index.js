const dotenv = require('dotenv-safe')
dotenv.config()
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

const { ArangoTools } = require('arango-tools')
const { Server } = require('./src/server')
const { makeMigrations } = require('./migrations')

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
  })
})()
