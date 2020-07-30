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

const { tokenize, verifyToken } = require('./src/auth')
const { cleanseInput } = require('./src/validators')
const { userLoaderByUserName, userLoaderByIds } = require('./src/loaders')
const { sendPasswordResetEmail } = require('./src/notify')

;(async () => {
  const { migrate } = await ArangoTools({ rootPass, url })
  const { query } = await migrate(makeMigrations({ databaseName, rootPass }))

  Server({
    query,
    auth: {
      tokenize,
      verifyToken,
    },
    functions: {
      cleanseInput,
    },
    loaders: {
      userLoaderByUserName: userLoaderByUserName(query),
      userLoaderByIds: userLoaderByIds(query)
    },
    notify: {
      sendPasswordResetEmail,
    },
  }).listen(PORT, (err) => {
    if (err) throw err
    console.log(`🚀 API listening on port ${PORT}`)
  })
})()
