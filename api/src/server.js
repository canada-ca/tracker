import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { json } from 'body-parser'

import http from 'http'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import compression from 'compression'

import requestLanguage from 'express-request-language'
import { GraphQLSchema } from 'graphql'
import depthLimit from 'graphql-depth-limit'
import { createComplexityLimitRule } from 'graphql-validation-complexity'

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
  const httpServer = http.createServer(app)
  const schema = createSchema()
  const server = new ApolloServer({
    schema,
    validationRules: createValidationRules(maxDepth, complexityCost, scalarCost, objectCost, listFactor),
    introspection: true,
    tracing,
    plugins: [
      // eslint-disable-next-line new-cap
      ApolloServerPluginLandingPageLocalDefault(),
    ],
  })
  await server.start()
  app.set('trust proxy', true)
  app.use(
    '/graphql',
    cors(),
    cookieParser(),
    compression(),
    json(),
    requestLanguage({
      languages: ['en', 'fr'],
    }),
    expressMiddleware(server, {
      context,
    }),
    function (err, _req, res, _next) {
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
    },
  )

  app.get('/alive', (_req, res) => {
    res.json({ ok: 'yes' })
  })

  app.get('/ready', (_req, res) => {
    res.json({ ok: 'yes' })
  })

  return httpServer
}
