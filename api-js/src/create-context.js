import bcrypt from 'bcryptjs'
import moment from 'moment'
import fetch from 'isomorphic-fetch'
import { v4 as uuidv4 } from 'uuid'

import { createI18n } from './create-i18n'
import { cleanseInput, slugify } from './validators'
import {
  checkDomainOwnership,
  checkDomainPermission,
  checkPermission,
  checkSuperAdmin,
  checkUserIsAdminForUser,
  tokenize,
  userRequired,
  verifyToken,
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
  loadAffiliationByKey,
  loadAffiliationConnectionsByUserId,
  loadAffiliationConnectionsByOrgId,
} from './affiliation/loaders'
import {
  loadDkimFailConnectionsBySumId,
  loadDmarcFailConnectionsBySumId,
  loadDmarcSummaryConnectionsByUserId,
  loadDmarcSummaryEdgeByDomainIdAndPeriod,
  loadDmarcSummaryByKey,
  loadFullPassConnectionsBySumId,
  loadSpfFailureConnectionsBySumId,
  loadStartDateFromPeriod,
  loadDmarcYearlySumEdge,
} from './dmarc-summaries/loaders'
import {
  loadDomainByKey,
  loadDomainByDomain,
  loadDomainConnectionsByOrgId,
  loadDomainConnectionsByUserId,
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

export const createContext = ({ context, req: request, res: response }) => {
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
    uuidv4,
    auth: {
      bcrypt,
      checkDomainOwnership: checkDomainOwnership({ i18n, userKey, query }),
      checkDomainPermission: checkDomainPermission({ i18n, userKey, query }),
      checkPermission: checkPermission({ i18n, userKey, query }),
      checkSuperAdmin: checkSuperAdmin({ i18n, userKey, query }),
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
      verifyToken: verifyToken({ i18n }),
    },
    validators: {
      cleanseInput,
      slugify,
    },
    notify: {
      sendAuthEmail: sendAuthEmail({ notifyClient, i18n }),
      sendAuthTextMsg: sendAuthTextMsg({ notifyClient, i18n }),
      sendOrgInviteCreateAccount: sendOrgInviteCreateAccount({
        notifyClient,
        i18n,
      }),
      sendOrgInviteEmail: sendOrgInviteEmail({ notifyClient, i18n }),
      sendPasswordResetEmail: sendPasswordResetEmail({ notifyClient, i18n }),
      sendTfaTextMsg: sendTfaTextMsg({ notifyClient, i18n }),
      sendVerificationEmail: sendVerificationEmail({ notifyClient, i18n }),
    },
    loaders: {
      chartSummaryLoaderByKey: chartSummaryLoaderByKey(query, userKey, i18n),
      loadDkimFailConnectionsBySumId: loadDkimFailConnectionsBySumId({
        query,
        userKey,
        cleanseInput,
        i18n,
      }),
      loadDmarcFailConnectionsBySumId: loadDmarcFailConnectionsBySumId({
        query,
        userKey,
        cleanseInput,
        i18n,
      }),
      loadDmarcSummaryConnectionsByUserId: loadDmarcSummaryConnectionsByUserId({
        query,
        userKey,
        cleanseInput,
        i18n,
        loadStartDateFromPeriod: loadStartDateFromPeriod(moment, userKey, i18n),
      }),
      loadDmarcSummaryEdgeByDomainIdAndPeriod: loadDmarcSummaryEdgeByDomainIdAndPeriod(
        {
          query,
          userKey,
          i18n,
        },
      ),
      loadDmarcSummaryByKey: loadDmarcSummaryByKey({ query, userKey, i18n }),
      loadFullPassConnectionsBySumId: loadFullPassConnectionsBySumId({
        query,
        userKey,
        cleanseInput,
        i18n,
      }),
      loadSpfFailureConnectionsBySumId: loadSpfFailureConnectionsBySumId({
        query,
        userKey,
        cleanseInput,
        i18n,
      }),
      loadStartDateFromPeriod: loadStartDateFromPeriod({
        moment,
        userKey,
        i18n,
      }),
      loadDmarcYearlySumEdge: loadDmarcYearlySumEdge({ query, userKey, i18n }),
      loadDomainByDomain: loadDomainByDomain({ query, userKey, i18n }),
      loadDomainByKey: loadDomainByKey({ query, userKey, i18n }),
      loadDomainConnectionsByOrgId: loadDomainConnectionsByOrgId({
        query,
        userKey,
        cleanseInput,
        i18n,
      }),
      loadDomainConnectionsByUserId: loadDomainConnectionsByUserId({
        query,
        userKey,
        cleanseInput,
        i18n,
      }),
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
      loadAffiliationByKey: loadAffiliationByKey({ query, userKey, i18n }),
      loadAffiliationConnectionsByUserId: loadAffiliationConnectionsByUserId({
        query,
        language: request.language,
        userKey,
        cleanseInput,
        i18n,
      }),
      loadAffiliationConnectionsByOrgId: loadAffiliationConnectionsByOrgId({
        query,
        userKey,
        cleanseInput,
        i18n,
      }),
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
