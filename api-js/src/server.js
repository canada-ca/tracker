const cors = require('cors')
const express = require('express')
const requestLanguage = require('express-request-language')
const { GraphQLSchema } = require('graphql')
const { createServer } = require('http')
// const { i18n: internationalization, unpackCatalog } = require('lingui-i18n')
const { ApolloServer } = require('apollo-server-express')

const { createQuerySchema } = require('./queries')
const { createMutationSchema } = require('./mutations')

const bcrypt = require('bcrypt')
const authFunctions = require('./auth')
const { cleanseInput, slugify } = require('./validators')
const notifyFunctions = require('./notify')

const {
  domainLoaderByKey,
  domainLoaderBySlug,
  orgLoaderByKey,
  orgLoaderBySlug,
  orgLoaderByConnectionArgs,
  orgLoaderConnectionArgsByDomainId,
  userLoaderByUserName,
  userLoaderByKey,
} = require('./loaders')

// internationalization.load({
//   fr: unpackCatalog(require('./locale/fr/messages.js')),
//   en: unpackCatalog(require('./locale/en/messages.js')),
// })

const Server = (context = {}) => {
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

  // internationalization.activate(req.language)
  // const schema = new GraphQLSchema({
  //   query: createQuerySchema(internationalization),
  //   mutation: createMutationSchema(internationalization)
  // })

  const server = new ApolloServer({
    schema: new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    }),

    context: ({ req: request, res: response }) => {
      const { query, collections, transaction } = context
      const { verifyToken } = authFunctions
      // Get user id from token
      let userId
      const token = request.headers.authorization || ''
      if (token !== '') {
        userId = verifyToken({ token }).userId
      }

      return {
        query,
        collections,
        transaction,
        request,
        response,
        userId,
        auth: {
          bcrypt,
          ...authFunctions,
        },
        validators: {
          cleanseInput,
          slugify,
        },
        notify: {
          ...notifyFunctions,
        },
        loaders: {
          domainLoaderByKey: domainLoaderByKey(query),
          domainLoaderBySlug: domainLoaderBySlug(query),
          orgLoaderByKey: orgLoaderByKey(query, request.language),
          orgLoaderBySlug: orgLoaderBySlug(query, request.language),
          orgLoaderByConnectionArgs: orgLoaderByConnectionArgs(
            query,
            request.language,
            userId,
            cleanseInput,
          ),
          orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
            query,
            request.language,
            userId,
            cleanseInput,
          ),
          userLoaderByUserName: userLoaderByUserName(query),
          userLoaderByKey: userLoaderByKey(query),
        },
      }
    },
  })

  server.applyMiddleware({ app })
  return createServer(app)
}

module.exports = {
  Server,
}
