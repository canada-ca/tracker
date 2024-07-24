const { config } = require('dotenv-safe')
const { ensure } = require('arango-tools')
const { Database } = require('arangojs')

config()

const { DB_DESCRIPTION = './database.json', DB_NAME, ROOT_PASS, DB_USER, DB_PASS, DB_URL } = process.env

const schema = require(DB_DESCRIPTION)

;(async () => {
  const systemDatabase = new Database({ url: DB_URL, databaseName: '_system' })
  await systemDatabase.login('root', ROOT_PASS)
  const databases = await systemDatabase.listDatabases()
  if (!databases.includes(DB_NAME)) {
    console.log(`Tracker database ${DB_NAME} does not exist. Creating it.`)
    try {
      await systemDatabase.createDatabase(DB_NAME, {
        users: [
          {
            username: DB_USER,
            passwd: DB_PASS,
            active: true,
          },
        ],
      })
    } catch (e) {
      console.error(`Failed to create database ${DB_NAME}: ${e.message}`)
      process.exit(1)
    }
  }

  await ensure({
    variables: {
      rootPassword: ROOT_PASS,
      dbname: DB_NAME,
      username: DB_USER,
      password: DB_PASS,
      url: DB_URL,
    },
    schema,
  })
})()
