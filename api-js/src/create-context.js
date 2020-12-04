const bcrypt = require('bcrypt')
const moment = require('moment')
const fetch = require('isomorphic-fetch')

const { createI18n } = require('./create-i18n')
const { cleanseInput, slugify } = require('./validators')
const {
  checkDomainOwnership,
  checkDomainPermission,
  checkPermission,
  checkUserIsAdminForUser,
  tokenize,
  userRequired,
  verifyToken,
} = require('./auth')
const {
  notifyClient,
  sendAuthEmail,
  sendAuthTextMsg,
  sendOrgInviteCreateAccount,
  sendOrgInviteEmail,
  sendPasswordResetEmail,
  sendTfaTextMsg,
  sendVerificationEmail,
} = require('./notify')

const {
  chartSummaryLoaderByKey,
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

module.exports.createContext = ({ context, req: request, res: response }) => {
  const { query } = context

  const i18n = createI18n(request.language)

  const verify = verifyToken({ i18n })

  // Get user id from token
  let userKey
  const token = request.headers.authorization || ''
  if (token !== '') {
    userKey = verify({ token }).userKey
  }

  return {
    ...context,
    i18n,
    request,
    response,
    userKey,
    moment,
    fetch,
    auth: {
      bcrypt,
      checkDomainOwnership: checkDomainOwnership({ i18n, userKey, query }),
      checkDomainPermission: checkDomainPermission({ i18n, userKey, query }),
      checkPermission: checkPermission({ i18n, userKey, query }),
      checkUserIsAdminForUser: checkUserIsAdminForUser({ i18n, userKey, query }),
      tokenize,
      userRequired: userRequired({
        i18n,
        userKey,
        userLoaderByKey: userLoaderByKey(query),
      }),
      verifyToken: verifyToken({ i18n }),
    },
    validators: {
      cleanseInput,
      slugify,
    },
    notify: {
      sendAuthEmail: sendAuthEmail(notifyClient, i18n),
      sendAuthTextMsg: sendAuthTextMsg(notifyClient, i18n),
      sendOrgInviteCreateAccount: sendOrgInviteCreateAccount(
        notifyClient,
        i18n,
      ),
      sendOrgInviteEmail: sendOrgInviteEmail(notifyClient, i18n),
      sendPasswordResetEmail: sendPasswordResetEmail(notifyClient, i18n),
      sendTfaTextMsg: sendTfaTextMsg(notifyClient, i18n),
      sendVerificationEmail: sendVerificationEmail(notifyClient, i18n),
    },
    loaders: {
      chartSummaryLoaderByKey: chartSummaryLoaderByKey(query, userKey, i18n),
      dmarcReportLoader: dmarcReportLoader({
        generateGqlQuery,
        generateDetailTableFields,
        fetch,
        i18n,
      }),
      domainLoaderByDomain: domainLoaderByDomain(query, userKey, i18n),
      domainLoaderByKey: domainLoaderByKey(query, userKey, i18n),
      domainLoaderConnectionsByOrgId: domainLoaderConnectionsByOrgId(
        query,
        userKey,
        cleanseInput,
        i18n,
      ),
      domainLoaderConnectionsByUserId: domainLoaderConnectionsByUserId(
        query,
        userKey,
        cleanseInput,
        i18n,
      ),
      dkimLoaderByKey: dkimLoaderByKey(query, userKey, i18n),
      dkimResultLoaderByKey: dkimResultLoaderByKey(query, userKey, i18n),
      dmarcLoaderByKey: dmarcLoaderByKey(query, userKey, i18n),
      spfLoaderByKey: spfLoaderByKey(query, userKey, i18n),
      dkimLoaderConnectionsByDomainId: dkimLoaderConnectionsByDomainId(
        query,
        userKey,
        cleanseInput,
        i18n,
      ),
      dkimResultsLoaderConnectionByDkimId: dkimResultsLoaderConnectionByDkimId(
        query,
        userKey,
        cleanseInput,
        i18n,
      ),
      dmarcLoaderConnectionsByDomainId: dmarcLoaderConnectionsByDomainId(
        query,
        userKey,
        cleanseInput,
        i18n,
      ),
      spfLoaderConnectionsByDomainId: spfLoaderConnectionsByDomainId(
        query,
        userKey,
        cleanseInput,
        i18n,
      ),
      httpsLoaderByKey: httpsLoaderByKey(query, userKey, i18n),
      httpsLoaderConnectionsByDomainId: httpsLoaderConnectionsByDomainId(
        query,
        userKey,
        cleanseInput,
      ),
      sslLoaderByKey: sslLoaderByKey(query, userKey, i18n),
      sslLoaderConnectionsByDomainId: sslLoaderConnectionsByDomainId(
        query,
        userKey,
        cleanseInput,
      ),
      dkimGuidanceTagLoader: dkimGuidanceTagLoader(query, userKey, i18n),
      dkimGuidanceTagConnectionsLoader: dkimGuidanceTagConnectionsLoader(
        query,
        userKey,
        cleanseInput,
        i18n,
      ),
      dmarcGuidanceTagLoader: dmarcGuidanceTagLoader(query, userKey, i18n),
      dmarcGuidanceTagConnectionsLoader: dmarcGuidanceTagConnectionsLoader(
        query,
        userKey,
        cleanseInput,
        i18n,
      ),
      httpsGuidanceTagLoader: httpsGuidanceTagLoader(query, userKey, i18n),
      httpsGuidanceTagConnectionsLoader: httpsGuidanceTagConnectionsLoader(
        query,
        userKey,
        cleanseInput,
        i18n,
      ),
      spfGuidanceTagLoader: spfGuidanceTagLoader(query, userKey, i18n),
      spfGuidanceTagConnectionsLoader: spfGuidanceTagConnectionsLoader(
        query,
        userKey,
        cleanseInput,
        i18n,
      ),
      sslGuidanceTagLoader: sslGuidanceTagLoader(query, userKey, i18n),
      sslGuidanceTagConnectionsLoader: sslGuidanceTagConnectionsLoader(
        query,
        userKey,
        cleanseInput,
        i18n,
      ),
      orgLoaderByKey: orgLoaderByKey(query, request.language, userKey, i18n),
      orgLoaderBySlug: orgLoaderBySlug(query, request.language, userKey, i18n),
      orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
        query,
        request.language,
        userKey,
        cleanseInput,
        i18n,
      ),
      orgLoaderConnectionsByUserId: orgLoaderConnectionsByUserId(
        query,
        userKey,
        cleanseInput,
        request.language,
        i18n,
      ),
      userLoaderByUserName: userLoaderByUserName(query, userKey, i18n),
      userLoaderByKey: userLoaderByKey(query, userKey, i18n),
      affiliationLoaderByKey: affiliationLoaderByKey(query, userKey, i18n),
      affiliationLoaderByUserId: affiliationLoaderByUserId(
        query,
        userKey,
        cleanseInput,
        i18n,
      ),
      affiliationLoaderByOrgId: affiliationLoaderByOrgId(
        query,
        userKey,
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
