const cors = require('cors')
const express = require('express')
const jwt = require('jsonwebtoken')
const { createServer } = require('http')
const { ApolloServer } = require('apollo-server-express')
const { schema } = require('./schema')

const Server = (context = {}) => {
  const app = express()

  app.use('*', cors())

  app.get('/alive', (_req, res) => {
    res.json({ ok: 'yes' })
  })

  app.get('/ready', (_req, res) => {
    res.json({ ok: 'yes' })
  })

  const server = new ApolloServer({
    schema,
    context: ({ req, res }) => {
      return {
        req,
        res,
        ...context,
      }
    },
  })

  server.applyMiddleware({ app })
  return createServer(app)
}

module.exports = {
  Server,
}
