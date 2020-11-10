const cors = require('cors')
const express = require('express')
// const http = require('http')
// const { createServer } = require('graphql-transport-ws')
const { graphqlHTTP } = require('express-graphql')
const { GraphQLSchema /*, execute, subscribe */ } = require('graphql')
const expressPlayground = require('graphql-playground-middleware-express')
  .default
const requestLanguage = require('express-request-language')
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
  dkimGuidanceTagLoader,
  dkimGuidanceTagConnectionsLoader,
  dmarcGuidanceTagLoader,
  dmarcGuidanceTagConnectionsLoader,
  httpsGuidanceTagLoader,
  httpsGuidanceTagConnectionsLoader,
  spfGuidanceTagLoader,
  spfGuidanceTagConnectionsLoader,
  sslGuidanceTagLoader,
  sslGuidanceTagConnectionsLoader,
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
  affiliationLoaderByKey,
  affiliationLoaderByUserId,
  affiliationLoaderByOrgId,
  verifiedDomainLoaderByDomain,
  verifiedDomainLoaderByKey,
  verifiedDomainLoaderConnections,
  verifiedDomainLoaderConnectionsByOrgId,
  verifiedOrgLoaderByKey,
  verifiedOrgLoaderBySlug,
  verifiedOrgLoaderConnectionsByDomainId,
  verifiedOrgLoaderConnections,
} = require('./loaders')

const createSchema = ({ language }) =>
  new GraphQLSchema({
    query: createQuerySchema(createI18n(language)),
    mutation: createMutationSchema(createI18n(language)),
  })

const createI18n = (language) =>
  setupI18n({
    language: language,
    locales: ['en', 'fr'],
    missing: 'Traduction manquante',
    catalogs: {
      en: englishMessages,
      fr: frenchMessages,
    },
  })

const createContext = ({ context, request, response }) => {
  const { query } = context
  // Get user id from token
  let userId
  const token = request.headers.authorization || ''
  if (token !== '') {
    userId = verifyToken({ token }).userId
  }

  const i18n = createI18n(request.language)

  return {
    i18n,
    ...context,
    request,
    response,
    userId,
    moment,
    auth: {
      bcrypt,
      checkDomainOwnership: checkDomainOwnership({ i18n, userId, query }),
      checkDomainPermission: checkDomainPermission({ i18n, userId, query }),
      checkPermission: checkPermission({ i18n, userId, query }),
      tokenize,
      userRequired: userRequired({
        i18n,
        userId,
        userLoaderByKey: userLoaderByKey(query),
      }),
      verifyToken: verifyToken({ i18n }),
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
      domainLoaderByDomain: domainLoaderByDomain(query, userId, i18n),
      domainLoaderByKey: domainLoaderByKey(query, userId, i18n),
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
      dkimLoaderByKey: dkimLoaderByKey(query, userId, i18n),
      dkimResultLoaderByKey: dkimResultLoaderByKey(query, userId, i18n),
      dmarcLoaderByKey: dmarcLoaderByKey(query, userId, i18n),
      spfLoaderByKey: spfLoaderByKey(query, userId, i18n),
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
      httpsLoaderByKey: httpsLoaderByKey(query, i18n),
      httpsLoaderConnectionsByDomainId: httpsLoaderConnectionsByDomainId(
        query,
        userId,
        cleanseInput,
      ),
      sslLoaderByKey: sslLoaderByKey(query, i18n),
      sslLoaderConnectionsByDomainId: sslLoaderConnectionsByDomainId(
        query,
        userId,
        cleanseInput,
      ),
      dkimGuidanceTagLoader: dkimGuidanceTagLoader(query, userId, i18n),
      dkimGuidanceTagConnectionsLoader: dkimGuidanceTagConnectionsLoader(
        query,
        userId,
        cleanseInput,
        i18n,
      ),
      dmarcGuidanceTagLoader: dmarcGuidanceTagLoader(query, userId, i18n),
      dmarcGuidanceTagConnectionsLoader: dmarcGuidanceTagConnectionsLoader(
        query,
        userId,
        cleanseInput,
        i18n,
      ),
      httpsGuidanceTagLoader: httpsGuidanceTagLoader(query, userId, i18n),
      httpsGuidanceTagConnectionsLoader: httpsGuidanceTagConnectionsLoader(
        query,
        userId,
        cleanseInput,
        i18n,
      ),
      spfGuidanceTagLoader: spfGuidanceTagLoader(query, userId, i18n),
      spfGuidanceTagConnectionsLoader: spfGuidanceTagConnectionsLoader(
        query,
        userId,
        cleanseInput,
        i18n,
      ),
      sslGuidanceTagLoader: sslGuidanceTagLoader(query, userId, i18n),
      sslGuidanceTagConnectionsLoader: sslGuidanceTagConnectionsLoader(
        query,
        userId,
        cleanseInput,
        i18n,
      ),
      orgLoaderByKey: orgLoaderByKey(query, request.language, userId, i18n),
      orgLoaderBySlug: orgLoaderBySlug(query, request.language, userId, i18n),
      orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
        query,
        request.language,
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
      userLoaderByUserName: userLoaderByUserName(query, userId, i18n),
      userLoaderByKey: userLoaderByKey(query, userId, i18n),
      affiliationLoaderByKey: affiliationLoaderByKey(query, userId, i18n),
      affiliationLoaderByUserId: affiliationLoaderByUserId(
        query,
        userId,
        cleanseInput,
        i18n,
      ),
      affiliationLoaderByOrgId: affiliationLoaderByOrgId(
        query,
        userId,
        cleanseInput,
        i18n,
      ),
      verifiedDomainLoaderByDomain: verifiedDomainLoaderByDomain(query, i18n),
      verifiedDomainLoaderByKey: verifiedDomainLoaderByKey(query, i18n),
      verifiedDomainLoaderConnections: verifiedDomainLoaderConnections(
        query,
        cleanseInput,
        i18n,
      ),
      verifiedDomainLoaderConnectionsByOrgId: verifiedDomainLoaderConnectionsByOrgId(
        query,
        cleanseInput,
        i18n,
      ),
      verifiedOrgLoaderByKey: verifiedOrgLoaderByKey(
        query,
        request.language,
        i18n,
      ),
      verifiedOrgLoaderBySlug: verifiedOrgLoaderBySlug(
        query,
        request.language,
        i18n,
      ),
      verifiedOrgLoaderConnectionsByDomainId: verifiedOrgLoaderConnectionsByDomainId(
        query,
        request.language,
        cleanseInput,
        i18n,
      ),
      verifiedOrgLoaderConnections: verifiedOrgLoaderConnections(
        query,
        request.language,
        cleanseInput,
        i18n,
      ),
    },
  }
}

const Server = (_PORT, context = {}) => {
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

  app.get(
    '/graphql',
    expressPlayground({
      endpoint: '/graphql',
    }),
  )

  app.use(
    '/graphql',
    graphqlHTTP(async (request, response, _graphQLParams) => ({
      graphiql: false,
      schema: createSchema({ language: request.language }),
      context: createContext({ context, request, response }),
    })),
  )

  // const httpServer = http.createServer(app)

  // httpServer.listen(4001, () => {
  //   createServer(
  //     {
  //       schema: createSchema('en'),
  //       execute,
  //       subscribe,
  //     },
  //     {
  //       server: httpServer,
  //       path: '/graphql',
  //     },
  //   )
  // })

  return app
}

module.exports = {
  Server,
}
