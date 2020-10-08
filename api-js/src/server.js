const cors = require('cors')
const express = require('express')
const requestLanguage = require('express-request-language')
const { GraphQLSchema } = require('graphql')
const { createServer } = require('http')
// const { i18n: internationalization, unpackCatalog } = require('lingui-i18n')
const { ApolloServer } = require('apollo-server-express')

const { createQuerySchema } = require('./queries')
const { createMutationSchema } = require('./mutations')

const fetch = require('isomorphic-fetch')
const bcrypt = require('bcrypt')
const moment = require('moment')
const authFunctions = require('./auth')
const { cleanseInput, slugify } = require('./validators')
const notifyFunctions = require('./notify')

const {
  generateDetailTableFields,
  generateGqlQuery,
  dmarcReportLoader,
  domainLoaderByKey,
  domainLoaderByDomain,
  domainLoaderConnectionsByUserId,
  orgLoaderByKey,
  orgLoaderBySlug,
  orgLoaderByConnectionArgs,
  orgLoaderConnectionArgsByDomainId,
  orgLoaderConnectionsByUserId,
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
        moment,
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
          dmarcReportLoader: dmarcReportLoader({
            generateGqlQuery,
            generateDetailTableFields,
            fetch,
          }),
          domainLoaderByKey: domainLoaderByKey(query),
          domainLoaderByDomain: domainLoaderByDomain(query),
          domainLoaderConnectionsByUserId: domainLoaderConnectionsByUserId(
            query,
            userId,
            cleanseInput,
          ),
          orgLoaderConnectionsByUserId: orgLoaderConnectionsByUserId(
            query,
            userId,
            cleanseInput,
          ),
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
