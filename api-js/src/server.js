const cors = require('cors')
const express = require('express')
const requestLanguage = require('express-request-language')
const { GraphQLSchema } = require('graphql')
const { createServer } = require('http')
const { ApolloServer } = require('apollo-server-express')
const { setupI18n } = require('@lingui/core')

const { createQuerySchema } = require('./queries')
const { createMutationSchema } = require('./mutations')

const fetch = require('isomorphic-fetch')
const bcrypt = require('bcrypt')
const moment = require('moment')
const authFunctions = require('./auth')
const { cleanseInput, slugify } = require('./validators')
const notifyFunctions = require('./notify')

// const englishMessages = require('./locale/en/messages')
// const frenchMessages = require('./locale/fr/messages')

const {
  generateDetailTableFields,
  generateGqlQuery,
  dmarcReportLoader,
  domainLoaderByKey,
  domainLoaderByDomain,
  domainLoaderConnectionsByOrgId,
  domainLoaderConnectionsByUserId,
  dkimLoaderByKey,
  dkimResultLoaderByKey,
  dmarcLoaderByKey,
  spfLoaderByKey,
  dkimLoaderConnectionsByDomainId,
  dkimResultsLoaderConnectionByDkimId,
  dmarcLoaderConnectionsByDomainId,
  spfLoaderConnectionsByDomainId,
  orgLoaderByKey,
  orgLoaderBySlug,
  orgLoaderByConnectionArgs,
  orgLoaderConnectionArgsByDomainId,
  orgLoaderConnectionsByUserId,
  userLoaderByUserName,
  userLoaderByKey,
  httpsLoaderByKey,
  httpsLoaderConnectionsByDomainId,
  sslLoaderByKey,
  sslLoaderConnectionsByDomainId,
} = require('./loaders')

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

      const i18n = setupI18n({
        language: request.language,
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          // en: englishMessages,
          // fr: frenchMessages,
        },
      })

      return {
        i18n,
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
            i18n,
          }),
          domainLoaderByDomain: domainLoaderByDomain(query, i18n),
          domainLoaderByKey: domainLoaderByKey(query, i18n),
          domainLoaderConnectionsByOrgId: domainLoaderConnectionsByOrgId(
            query,
            userId,
            cleanseInput,
            i18n,
          ),
          domainLoaderConnectionsByUserId: domainLoaderConnectionsByUserId(
            query,
            userId,
            cleanseInput,
            i18n,
          ),
          orgLoaderConnectionsByUserId: orgLoaderConnectionsByUserId(
            query,
            userId,
            cleanseInput,
            request.language,
            i18n,
          ),
          dkimLoaderByKey: dkimLoaderByKey(query),
          dkimResultLoaderByKey: dkimResultLoaderByKey(query),
          dmarcLoaderByKey: dmarcLoaderByKey(query),
          spfLoaderByKey: spfLoaderByKey(query),
          dkimLoaderConnectionsByDomainId: dkimLoaderConnectionsByDomainId(
            query,
            userId,
            cleanseInput,
          ),
          dkimResultsLoaderConnectionByDkimId: dkimResultsLoaderConnectionByDkimId(
            query,
            userId,
            cleanseInput,
          ),
          dmarcLoaderConnectionsByDomainId: dmarcLoaderConnectionsByDomainId(
            query,
            userId,
            cleanseInput,
          ),
          spfLoaderConnectionsByDomainId: spfLoaderConnectionsByDomainId(
            query,
            userId,
            cleanseInput,
          ),
          httpsLoaderByKey: httpsLoaderByKey(query),
          httpsLoaderConnectionsByDomainId: httpsLoaderConnectionsByDomainId(
            query,
            userId,
            cleanseInput,
          ),
          sslLoaderByKey: sslLoaderByKey(query),
          sslLoaderConnectionsByDomainId: sslLoaderConnectionsByDomainId(
            query,
            userId,
            cleanseInput,
          ),
          orgLoaderByKey: orgLoaderByKey(query, request.language, i18n),
          orgLoaderBySlug: orgLoaderBySlug(query, request.language, i18n),
          orgLoaderByConnectionArgs: orgLoaderByConnectionArgs(
            query,
            request.language,
            userId,
            cleanseInput,
            i18n,
          ),
          orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
            query,
            request.language,
            userId,
            cleanseInput,
            i18n,
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
