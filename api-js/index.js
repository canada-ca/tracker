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

const bcrypt = require('bcrypt')
const { tokenize, verifyToken } = require('./src/auth')
const { cleanseInput } = require('./src/validators')
const {
  sendOrgInviteCreateAccount,
  sendOrgInviteEmail,
  sendPasswordResetEmail,
  sendTfaTextMsg,
  sendVerificationEmail,
} = require('./src/notify')

;(async () => {
  const { migrate } = await ArangoTools({ rootPass, url })
  const { query } = await migrate(makeMigrations({ databaseName, rootPass }))

  Server({
    query,
    auth: {
      bcrypt,
      tokenize,
      verifyToken,
    },
    functions: {
      cleanseInput,
    },
    notify: {
      sendOrgInviteCreateAccount,
      sendOrgInviteEmail,
      sendPasswordResetEmail,
      sendTfaTextMsg,
      sendVerificationEmail,
    },
  }).listen(PORT, (err) => {
    if (err) throw err
    console.log(`🚀 API listening on port ${PORT}`)
  })
})()
