const cors = require('cors')
const express = require('express')
const requestLanguage = require('express-request-language')
const { GraphQLSchema } = require('graphql')
const { createServer } = require('http')
const { ApolloServer } = require('apollo-server-express')
const { setupI18n } = require('@lingui/core')
const fetch = require('isomorphic-fetch')
const bcrypt = require('bcrypt')
const moment = require('moment')

const { createQuerySchema } = require('./queries')
const { createMutationSchema } = require('./mutations')
const englishMessages = require('./locale/en/messages')
const frenchMessages = require('./locale/fr/messages')

const { cleanseInput, slugify } = require('./validators')
const {
  checkDomainOwnership,
  checkDomainPermission,
  checkPermission,
  tokenize,
  userRequired,
  verifyToken,
} = require('./auth')
const {
  sendAuthEmail,
  sendAuthTextMsg,
  sendOrgInviteCreateAccount,
  sendOrgInviteEmail,
  sendPasswordResetEmail,
  sendTfaTextMsg,
  sendVerificationEmail,
} = require('./notify')

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
          en: englishMessages,
          fr: frenchMessages,
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
          checkDomainOwnership: checkDomainOwnership({i18n, userId, query}),
          checkDomainPermission: checkDomainPermission({i18n, userId, query}),
          checkPermission: checkPermission({i18n, userId, query}),
          tokenize,
          userRequired: userRequired({i18n, userId, userLoaderByKey: userLoaderByKey(query)}),
          verifyToken: verifyToken({i18n}),
        },
        validators: {
          cleanseInput,
          slugify,
        },
        notify: {
          sendAuthEmail: sendAuthEmail(i18n),
          sendAuthTextMsg: sendAuthTextMsg(i18n),
          sendOrgInviteCreateAccount: sendOrgInviteCreateAccount(i18n),
          sendOrgInviteEmail: sendOrgInviteEmail(i18n),
          sendPasswordResetEmail: sendPasswordResetEmail(i18n),
          sendTfaTextMsg: sendTfaTextMsg(i18n),
          sendVerificationEmail: sendVerificationEmail(i18n),
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
          dkimLoaderByKey: dkimLoaderByKey(query, i18n),
          dkimResultLoaderByKey: dkimResultLoaderByKey(query, i18n),
          dmarcLoaderByKey: dmarcLoaderByKey(query, i18n),
          spfLoaderByKey: spfLoaderByKey(query, i18n),
          dkimLoaderConnectionsByDomainId: dkimLoaderConnectionsByDomainId(
            query,
            userId,
            cleanseInput,
            i18n,
          ),
          dkimResultsLoaderConnectionByDkimId: dkimResultsLoaderConnectionByDkimId(
            query,
            userId,
            cleanseInput,
            i18n,
          ),
          dmarcLoaderConnectionsByDomainId: dmarcLoaderConnectionsByDomainId(
            query,
            userId,
            cleanseInput,
            i18n,
          ),
          spfLoaderConnectionsByDomainId: spfLoaderConnectionsByDomainId(
            query,
            userId,
            cleanseInput,
            i18n,
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
          orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
            query,
            request.language,
            userId,
            cleanseInput,
            i18n,
          ),
          userLoaderByUserName: userLoaderByUserName(query, i18n),
          userLoaderByKey: userLoaderByKey(query, i18n),
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
