const dotenv = require('dotenv-safe')
dotenv.config()

const { ArangoTools } = require('arango-tools')
const { NotifyClient } = require('notifications-node-client')
const { Server } = require('./src/server')
const { makeMigrations } = require('./migrations')

const { PORT = 4000, DB_PASS: rootPass, DB_URL: url, DB_NAME: databaseName, NOTIFICATION_API_KEY, NOTIFICATION_API_URL } = process.env

;(async () => {
  const { migrate } = await ArangoTools({ rootPass, url })
  const { query } = await migrate(
    makeMigrations({ databaseName, rootPass }),
  )
  const notifyClient = new NotifyClient(NOTIFICATION_API_URL, NOTIFICATION_API_KEY)

  Server({ 
    query,
    notifyClient,
  }).listen(PORT, (err) => {
    if (err) throw err
    console.log(`🚀 API listening on port ${PORT}`)
  })
})()
