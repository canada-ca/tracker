import cors from 'cors'
import express from 'express'
import http from 'http'
import { ApolloServer } from 'apollo-server-express'
import jwt from 'express-jwt'
import requestLanguage from 'express-request-language'
import { GraphQLSchema } from 'graphql'
import depthLimit from 'graphql-depth-limit'
import { createComplexityLimitRule } from 'graphql-validation-complexity'
import { defineMessage } from '@lingui/macro'

import { createI18n } from './create-i18n'
import { createContext } from './create-context'
import { createQuerySchema } from './query'
import { createMutationSchema } from './mutation'

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

const { AUTHENTICATED_KEY } = process.env

export const Server = (
  // TODO refactor
  // no longer used but preserved because of coupling to argument order
  _PORT = '4000',
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

  app.use(
    jwt({
      secret: AUTHENTICATED_KEY,
      algorithms: ['HS256'],
      credentialsRequired: false, // permissions are checked in the resolvers
    }),
  )

  app.use(function handleJWTError(err, req, res, _next) {
    // Per request i18n:
    // https://github.com/lingui/js-lingui/discussions/954
    const message = 'Invalid token, please request a new one.'
    defineMessage({ message })

    if (err.name === 'UnauthorizedError') {
      const i18n = createI18n(req.language)
      res.status(401).send(i18n._(message))
      console.warn('JWT was attempted to be verified but secret was incorrect.')
    }
  })

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

  return httpServer
}
