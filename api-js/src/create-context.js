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
  loadDkimByKey,
  loadDkimResultByKey,
  loadDmarcByKey,
  loadSpfByKey,
  loadDkimConnectionsByDomainId,
  loadDkimResultConnectionsByDkimId,
  loadDmarcConnectionsByDomainId,
  loadSpfConnectionsByDomainId,
} from './email-scan/loaders'
import {
  loadDkimGuidanceTagById,
  loadDkimGuidanceTagConnectionsByTagId,
  loadDmarcGuidanceTagByTagId,
  loadDmarcGuidanceTagConnectionsByTagId,
  loadHttpsGuidanceTagByTagId,
  loadHttpsGuidanceTagConnectionsByTagId,
  loadSpfGuidanceTagByTagId,
  loadSpfGuidanceTagConnectionsByTagId,
  loadSslGuidanceTagByTagId,
  loadSslGuidanceTagConnectionsByTagId,
} from './guidance-tag/loaders'
import {
  loadOrgByKey,
  loadOrgBySlug,
  loadOrgConnectionsByDomainId,
  loadOrgConnectionsByUserId,
} from './organization/loaders'
import { loadUserByUserName, loadUserByKey } from './user/loaders'
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
import { loadChartSummaryByKey } from './summaries/loaders'

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
        loadUserByKey: loadUserByKey({ query, userKey, i18n }),
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
      loadChartSummaryByKey: loadChartSummaryByKey({ query, userKey, i18n }),
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
      loadDkimByKey: loadDkimByKey({ query, userKey, i18n }),
      loadDkimResultByKey: loadDkimResultByKey({ query, userKey, i18n }),
      loadDmarcByKey: loadDmarcByKey({ query, userKey, i18n }),
      loadSpfByKey: loadSpfByKey({ query, userKey, i18n }),
      loadDkimConnectionsByDomainId: loadDkimConnectionsByDomainId({
        query,
        userKey,
        cleanseInput,
        i18n,
      }),
      loadDkimResultConnectionsByDkimId: loadDkimResultConnectionsByDkimId({
        query,
        userKey,
        cleanseInput,
        i18n,
      }),
      loadDmarcConnectionsByDomainId: loadDmarcConnectionsByDomainId({
        query,
        userKey,
        cleanseInput,
        i18n,
      }),
      loadSpfConnectionsByDomainId: loadSpfConnectionsByDomainId({
        query,
        userKey,
        cleanseInput,
        i18n,
      }),
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
      loadDkimGuidanceTagById: loadDkimGuidanceTagById({
        query,
        userKey,
        i18n,
      }),
      loadDkimGuidanceTagConnectionsByTagId: loadDkimGuidanceTagConnectionsByTagId(
        {
          query,
          userKey,
          cleanseInput,
          i18n,
        },
      ),
      loadDmarcGuidanceTagByTagId: loadDmarcGuidanceTagByTagId({
        query,
        userKey,
        i18n,
      }),
      loadDmarcGuidanceTagConnectionsByTagId: loadDmarcGuidanceTagConnectionsByTagId(
        {
          query,
          userKey,
          cleanseInput,
          i18n,
        },
      ),
      loadHttpsGuidanceTagByTagId: loadHttpsGuidanceTagByTagId({
        query,
        userKey,
        i18n,
      }),
      loadHttpsGuidanceTagConnectionsByTagId: loadHttpsGuidanceTagConnectionsByTagId(
        {
          query,
          userKey,
          cleanseInput,
          i18n,
        },
      ),
      loadSpfGuidanceTagByTagId: loadSpfGuidanceTagByTagId({
        query,
        userKey,
        i18n,
      }),
      loadSpfGuidanceTagConnectionsByTagId: loadSpfGuidanceTagConnectionsByTagId(
        {
          query,
          userKey,
          cleanseInput,
          i18n,
        },
      ),
      loadSslGuidanceTagByTagId: loadSslGuidanceTagByTagId({
        query,
        userKey,
        i18n,
      }),
      loadSslGuidanceTagConnectionsByTagId: loadSslGuidanceTagConnectionsByTagId(
        {
          query,
          userKey,
          cleanseInput,
          i18n,
        },
      ),
      loadOrgByKey: loadOrgByKey({
        query,
        language: request.language,
        userKey,
        i18n,
      }),
      loadOrgBySlug: loadOrgBySlug({
        query,
        language: request.language,
        userKey,
        i18n,
      }),
      loadOrgConnectionsByDomainId: loadOrgConnectionsByDomainId({
        query,
        language: request.language,
        userKey,
        cleanseInput,
        i18n,
      }),
      loadOrgConnectionsByUserId: loadOrgConnectionsByUserId({
        query,
        userKey,
        cleanseInput,
        language: request.language,
        i18n,
      }),
      loadUserByUserName: loadUserByUserName({ query, userKey, i18n }),
      loadUserByKey: loadUserByKey({ query, userKey, i18n }),
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
