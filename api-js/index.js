const dotenv = require('dotenv-safe')
dotenv.config()

const { ArangoTools } = require('arango-tools')
const { Server } = require('./src/server')
const { makeMigrations } = require('./migrations')

const { PORT = 4000, DB_PASS: rootPass, DB_URL: url, DB_NAME: databaseName } = process.env

;(async () => {
  const { migrate } = await ArangoTools({ rootPass, url })
  const { query } = await migrate(
    makeMigrations({ databaseName, rootPass }),
  )

  Server({ query }).listen(PORT, (err) => {
    if (err) throw err
    console.log(`🚀 API listening on port ${PORT}`)
  })
})()
