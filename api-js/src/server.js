import cors from 'cors'
import express from 'express'
import http from 'http'
import { ApolloServer } from 'apollo-server-express'
import requestLanguage from 'express-request-language'
import { GraphQLSchema } from 'graphql'
import depthLimit from 'graphql-depth-limit'
import { createComplexityLimitRule } from 'graphql-validation-complexity'

import { createContext } from './create-context'
import { createQuerySchema } from './query'
import { createMutationSchema } from './mutation'
import { createSubscriptionSchema } from './subscriptions'
import { createI18n } from './create-i18n'
import { verifyToken, userRequired } from './auth'
import { userLoaderByKey } from './user/loaders'

const createSchema = () =>
  new GraphQLSchema({
    query: createQuerySchema(),
    mutation: createMutationSchema(),
    subscription: createSubscriptionSchema(),
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

  app.get('/alive', (_req, res) => {
    res.json({ ok: 'yes' })
  })

  app.get('/ready', (_req, res) => {
    res.json({ ok: 'yes' })
  })

  const server = new ApolloServer({
    schema: createSchema(),
    context: async ({ req, res, connection }) => {
      if (connection) {
        req = {
          headers: {
            authorization: connection.context.authorization,
          },
          language: connection.context.language,
        }
        return createContext({ context, req, res })
      } else {
        return createContext({ context, req, res })
      }
    },
    subscriptions: {
      onConnect: async (connectionParams, webSocket) => {
        const enLangPos = String(
          webSocket.upgradeReq.headers['accept-language'],
        ).indexOf('en')
        const frLangPos = String(
          webSocket.upgradeReq.headers['accept-language'],
        ).indexOf('fr')
        let language
        if (frLangPos > enLangPos) {
          language = 'fr'
        } else {
          language = 'en'
        }

        let authorization
        if (connectionParams.authorization) {
          authorization = connectionParams.authorization
        }

        const i18n = createI18n(language)
        const verify = verifyToken({ i18n })
        const token = authorization || ''

        let userKey
        if (token !== '') {
          userKey = verify({ token })
        }

        await userRequired({
          i18n,
          userId: userKey,
          userLoaderByKey: userLoaderByKey(context.query),
        })()

        console.info(`User: ${userKey}, connected to subscription.`)

        return {
          language,
          authorization,
        }
      },
    },
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
