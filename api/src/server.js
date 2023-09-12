import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { json } from 'body-parser'

import http from 'http'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'

import requestLanguage from 'express-request-language'
import { execute, subscribe, GraphQLSchema } from 'graphql'
import depthLimit from 'graphql-depth-limit'
import { createComplexityLimitRule } from 'graphql-validation-complexity'
import { SubscriptionServer } from 'subscriptions-transport-ws'

import { createQuerySchema } from './query'
import { createMutationSchema } from './mutation'

const createSchema = () =>
  new GraphQLSchema({
    query: createQuerySchema(),
    mutation: createMutationSchema(),
  })

const createValidationRules = (maxDepth, complexityCost, scalarCost, objectCost, listFactor) => {
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

export const Server = async ({
  maxDepth,
  complexityCost,
  scalarCost,
  objectCost,
  listFactor,
  tracing,
  context = {},
}) => {
  const app = express()
  app.use('*', cors())

  app.use(cookieParser())

  app.use(json())

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

  // default error handler
  app.use(function (err, _req, res, _next) {
    res.status(200).json({
      error: {
        errors: [
          {
            message: err,
            locations: [
              {
                line: 1,
                column: 1,
              },
            ],
          },
        ],
      },
    })
  })

  const httpServer = http.createServer(app)

  const schema = createSchema()

  const server = new ApolloServer({
    schema,
    context,
    validationRules: createValidationRules(maxDepth, complexityCost, scalarCost, objectCost, listFactor),
    introspection: true,
    tracing,
  })

  await server.start()
  app.use(
    expressMiddleware(server, {
      context,
    }),
  )

  SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
    },
    {
      server: httpServer,
      path: server.graphqlPath,
    },
  )

  return httpServer
}
