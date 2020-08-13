const dotenv = require('dotenv-safe')
dotenv.config()
const {
  PORT = 4000,
  DB_PASS: rootPass,
  DB_URL: url,
  DB_NAME: databaseName,
} = process.env

const { ArangoTools } = require('arango-tools')
const { Server } = require('./src/server')
const { makeMigrations } = require('./migrations')

;(async () => {
  const { migrate } = await ArangoTools({ rootPass, url })
  const { query, collections, transaction } = await migrate(
    makeMigrations({ databaseName, rootPass }),
  )

  Server({ query, collections, transaction }).listen(PORT, (err) => {
    if (err) throw err
    console.log(`🚀 API listening on port ${PORT}`)
  })
})()
