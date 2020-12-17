const cors = require('cors')
const express = require('express')
const http = require('http')
const { ApolloServer } = require('apollo-server-express')
const requestLanguage = require('express-request-language')
const { GraphQLSchema } = require('graphql')
const depthLimit = require('graphql-depth-limit')
const { createComplexityLimitRule } = require('graphql-validation-complexity')

const { createContext } = require('./create-context')
const { createQuerySchema } = require('./queries')
const { createMutationSchema } = require('./mutations')

const createSchema = () =>
  new GraphQLSchema({
    query: createQuerySchema(),
    mutation: createMutationSchema(),
  })

const createValidationRules = (
  maxDepth,
  complexityCost,
  scalarCost,
  objectCost,
  listFactor,
) => {
  return [
    depthLimit(maxDepth),
    createComplexityLimitRule(complexityCost, {
      scalarCost,
      objectCost,
      listFactor,
      formatErrorMessage: (cost) => {
        console.warn(`User attempted a costly request: ${cost}`)
        return `Query error, query is too complex.`
      },
    }),
  ]
}

const Server = (
  PORT,
  maxDepth,
  complexityCost,
  scalarCost,
  objectCost,
  listFactor,
  context = {},
) => {
  const app = express()

  app.use('*', cors())

  app.use(
    requestLanguage({
      languages: ['en', 'fr'],
    }),
  )

  app.get('/alive', (_req, res) => {
    res.json({ ok: 'yes' })
  })

  app.get('/ready', (_req, res) => {
    res.json({ ok: 'yes' })
  })

  const server = new ApolloServer({
    schema: createSchema(),
    context: async ({ req, res }) => createContext({ context, req, res }),
    validationRules: createValidationRules(
      maxDepth,
      complexityCost,
      scalarCost,
      objectCost,
      listFactor,
    ),
    introspection: true,
    playground: true,
  })

  server.applyMiddleware({ app })

  const httpServer = http.createServer(app)

  server.installSubscriptionHandlers(httpServer)

  console.log(
    `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`,
  )
  console.log(
    `🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`,
  )
  return httpServer
}

module.exports = {
  Server,
}
