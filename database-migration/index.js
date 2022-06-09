const { config } = require('dotenv-safe')
const { ensure } = require('arango-tools')

config()

const { DB_DESCRIPTION, DB_NAME, ROOT_PASS, DB_USER, DB_PASS, DB_URL } =
  process.env

const schema = require(DB_DESCRIPTION)

;(async () => {
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
