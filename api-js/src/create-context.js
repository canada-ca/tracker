import bcrypt from 'bcryptjs'
import moment from 'moment'
import fetch from 'isomorphic-fetch'
import { v4 as uuidv4 } from 'uuid'

import { cleanseInput, slugify } from './validators'
import {
  checkDomainOwnership,
  checkDomainPermission,
  checkPermission,
  checkUserIsAdminForUser,
  tokenize,
  userRequired,
} from './auth'
import {
  notifyClient,
  sendAuthEmail,
  sendAuthTextMsg,
  sendOrgInviteCreateAccount,
  sendOrgInviteEmail,
  sendPasswordResetEmail,
  sendTfaTextMsg,
  sendVerificationEmail,
} from './notify'

import {
  affiliationLoaderByKey,
  affiliationLoaderByUserId,
  affiliationLoaderByOrgId,
} from './affiliation/loaders'
import {
  generateDetailTableFields,
  generateGqlQuery,
  dmarcReportLoader,
} from './dmarc-report/loaders'
import {
  dkimFailureLoaderConnectionsBySumId,
  dmarcFailureLoaderConnectionsBySumId,
  dmarcSumLoaderConnectionsByUserId,
  dmarcSummaryEdgeLoaderByDomainIdPeriod,
  dmarcSumLoaderByKey,
  fullPassLoaderConnectionsBySumId,
  spfFailureLoaderConnectionsBySumId,
  loadStartDateFromPeriod,
  dmarcYearlySumEdgeLoader,
} from './dmarc-summaries/loaders'
import {
  domainLoaderByKey,
  domainLoaderByDomain,
  domainLoaderConnectionsByOrgId,
  domainLoaderConnectionsByUserId,
} from './domain/loaders'
import {
  dkimLoaderByKey,
  dkimResultLoaderByKey,
  dmarcLoaderByKey,
  spfLoaderByKey,
  dkimLoaderConnectionsByDomainId,
  dkimResultsLoaderConnectionByDkimId,
  dmarcLoaderConnectionsByDomainId,
  spfLoaderConnectionsByDomainId,
} from './email-scan/loaders'
import {
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
} from './guidance-tag/loaders'
import {
  orgLoaderByKey,
  orgLoaderBySlug,
  orgLoaderConnectionArgsByDomainId,
  orgLoaderConnectionsByUserId,
} from './organization/loaders'
import { userLoaderByUserName, userLoaderByKey } from './user/loaders'
import {
  httpsLoaderByKey,
  httpsLoaderConnectionsByDomainId,
  sslLoaderByKey,
  sslLoaderConnectionsByDomainId,
} from './web-scan/loaders'
import {
  verifiedDomainLoaderByDomain,
  verifiedDomainLoaderByKey,
  verifiedDomainLoaderConnections,
  verifiedDomainLoaderConnectionsByOrgId,
} from './verified-domains/loaders'
import {
  verifiedOrgLoaderByKey,
  verifiedOrgLoaderBySlug,
  verifiedOrgLoaderConnectionsByDomainId,
  verifiedOrgLoaderConnections,
} from './verified-organizations/loaders'
import { chartSummaryLoaderByKey } from './summaries/loaders'

export const createContext = ({
  context,
  req: request,
  res: response,
  i18n,
}) => {
  const { query } = context

  // request.user is populated using the token by the express-jwt middleware in src/server.js
  const userKey = request.user?.userKey

  return {
    ...context,
    i18n,
    request,
    response,
    userKey,
    moment,
    fetch,
    uuidv4,
    auth: {
      bcrypt,
      checkDomainOwnership: checkDomainOwnership({ i18n, userKey, query }),
      checkDomainPermission: checkDomainPermission({ i18n, userKey, query }),
      checkPermission: checkPermission({ i18n, userKey, query }),
      checkUserIsAdminForUser: checkUserIsAdminForUser({
        i18n,
        userKey,
        query,
      }),
      tokenize,
      userRequired: userRequired({
        i18n,
        userKey,
        userLoaderByKey: userLoaderByKey(query),
      }),
      verifyToken: () => request.user,
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
      dkimFailureLoaderConnectionsBySumId: dkimFailureLoaderConnectionsBySumId(
        query,
        userKey,
        cleanseInput,
        i18n,
      ),
      dmarcFailureLoaderConnectionsBySumId: dmarcFailureLoaderConnectionsBySumId(
        query,
        userKey,
        cleanseInput,
        i18n,
      ),
      dmarcSumLoaderConnectionsByUserId: dmarcSumLoaderConnectionsByUserId(
        query,
        userKey,
        cleanseInput,
        i18n,
      ),
      dmarcSummaryEdgeLoaderByDomainIdPeriod: dmarcSummaryEdgeLoaderByDomainIdPeriod(
        query,
        userKey,
        i18n,
      ),
      dmarcSumLoaderByKey: dmarcSumLoaderByKey(query, userKey, i18n),
      fullPassLoaderConnectionsBySumId: fullPassLoaderConnectionsBySumId(
        query,
        userKey,
        cleanseInput,
        i18n,
      ),
      spfFailureLoaderConnectionsBySumId: spfFailureLoaderConnectionsBySumId(
        query,
        userKey,
        cleanseInput,
        i18n,
      ),
      loadStartDateFromPeriod: loadStartDateFromPeriod(moment, userKey, i18n),
      dmarcYearlySumEdgeLoader: dmarcYearlySumEdgeLoader(query, userKey, i18n),
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
