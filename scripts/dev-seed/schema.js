// Port of database-migration/index.js: creates the database and user if missing, then
// lets arango-tools ensure every collection, index and view in database.json.
// The schema file is read in place; arango-tools fills its {{placeholders}} from `variables`.
const path = require('node:path')
const { ensure } = require('arango-tools')
const { Database } = require('arangojs')

const SCHEMA_FILE = path.resolve(__dirname, '../../database-migration/database.json')

const ensureDatabase = async ({ DB_URL, DB_NAME, DB_USER, DB_PASS, ROOT_PASS }) => {
  const systemDatabase = new Database({ url: DB_URL, databaseName: '_system', auth: { username: 'root', password: ROOT_PASS } })
  const databases = await systemDatabase.listDatabases()
  if (!databases.includes(DB_NAME)) {
    console.log(`Database "${DB_NAME}" does not exist. Creating it.`)
    await systemDatabase.createDatabase(DB_NAME, {
      users: [{ username: DB_USER, passwd: DB_PASS, active: true }],
    })
  }
}

const ensureSchema = async (env) => {
  await ensureDatabase(env)
  await ensure({
    variables: {
      rootPassword: env.ROOT_PASS,
      dbname: env.DB_NAME,
      username: env.DB_USER,
      password: env.DB_PASS,
      url: env.DB_URL,
    },
    schema: require(SCHEMA_FILE),
  })
  console.log(`Schema ensured for "${env.DB_NAME}".`)
}

module.exports = { ensureSchema }
