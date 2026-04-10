import bcrypt from 'bcryptjs'
import moment from 'moment'
import fetch from 'isomorphic-fetch'
import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'

import { loadUserByKey } from './user/loaders'
import { cleanseInput, decryptPhoneNumber, slugify } from './validators'
import { initializeLoaders } from './initialize-loaders'
import { SummariesDataSource } from './summaries'
import { DnsScanDataSource } from './dns-scan'
import { WebScanDataSource } from './web-scan'
import { AuditLogsDataSource } from './audit-logs'
import { AdditionalFindingsDataSource } from './additional-findings'
import { TagsDataSource } from './tags'
import {
  AuthDataSource,
  checkDomainOwnership,
  checkDomainPermission,
  checkOrgOwner,
  checkPermission,
  checkSuperAdmin,
  checkUserBelongsToOrg,
  checkUserIsAdminForUser,
  tokenize,
  saltedHash,
  superAdminRequired,
  userRequired,
  verifiedRequired,
  verifyToken,
  tfaRequired,
} from './auth'
import {
  notifyClient,
  sendAuthEmail,
  sendAuthTextMsg,
  sendInviteRequestEmail,
  sendOrgInviteCreateAccount,
  sendOrgInviteEmail,
  sendPasswordResetEmail,
  sendUpdatedUserNameEmail,
  sendVerificationEmail,
  sendRoleChangeEmail,
} from './notify'

export async function createContext({
  query,
  db,
  transaction,
  collections,
  publish,
  req: request,
  res: response,
  i18n,
  language,
  loginRequiredBool,
  salt,
}) {
  const verify = verifyToken({ i18n })

  // Get user id from token
  let userKey
  const token = request.headers.authorization || ''
  if (token !== '') {
    userKey = verify({ token }).userKey
  } else {
    userKey = 'NO_USER'
  }

  return {
    query,
    db,
    transaction,
    collections,
    publish,
    i18n,
    request,
    response,
    userKey,
    language,
    moment,
    fetch,
    uuidv4,
    jwt,
    auth: {
      bcrypt,
      checkDomainOwnership: checkDomainOwnership({
        i18n,
        userKey,
        query,
        auth: { loginRequiredBool },
      }),
      checkDomainPermission: checkDomainPermission({
        i18n,
        userKey,
        query,
        auth: { loginRequiredBool },
      }),
      checkOrgOwner: checkOrgOwner({ i18n, userKey, query }),
      checkPermission: checkPermission({ i18n, userKey, query }),
      checkSuperAdmin: checkSuperAdmin({ i18n, userKey, query }),
      checkUserBelongsToOrg: checkUserBelongsToOrg({ i18n, query, userKey }),
      checkUserIsAdminForUser: checkUserIsAdminForUser({
        i18n,
        userKey,
        query,
      }),
      loginRequiredBool,
      tokenize,
      tfaRequired: tfaRequired({ i18n }),
      saltedHash: saltedHash(salt),
      superAdminRequired: superAdminRequired({ i18n }),
      userRequired: userRequired({
        i18n,
        userKey,
        loadUserByKey: loadUserByKey({ query, userKey, i18n }),
      }),
      verifiedRequired: verifiedRequired({ i18n }),
      verifyToken: verifyToken({ i18n }),
    },
    validators: {
      cleanseInput,
      decryptPhoneNumber,
      slugify,
    },
    notify: {
      sendAuthEmail: sendAuthEmail({ notifyClient, i18n }),
      sendAuthTextMsg: sendAuthTextMsg({ notifyClient, i18n }),
      sendInviteRequestEmail: sendInviteRequestEmail({ notifyClient, i18n }),
      sendOrgInviteCreateAccount: sendOrgInviteCreateAccount({
        notifyClient,
        i18n,
      }),
      sendOrgInviteEmail: sendOrgInviteEmail({ notifyClient, i18n }),
      sendPasswordResetEmail: sendPasswordResetEmail({ notifyClient, i18n }),
      sendUpdatedUserNameEmail: sendUpdatedUserNameEmail({
        notifyClient,
        i18n,
      }),
      sendVerificationEmail: sendVerificationEmail({ notifyClient, i18n }),
      sendRoleChangeEmail: sendRoleChangeEmail({ notifyClient, i18n }),
    },
    dataSources: {
      auth: new AuthDataSource({ query, userKey, i18n }),
      summaries: new SummariesDataSource({ query, userKey, cleanseInput, i18n }),
      additionalFindings: new AdditionalFindingsDataSource({ query, userKey, i18n, language: request.language }),
      auditLogs: new AuditLogsDataSource({ query, userKey, cleanseInput, i18n, transaction, collections }),
      dnsScan: new DnsScanDataSource({ query, userKey, cleanseInput, i18n }),
      tags: new TagsDataSource({ query, userKey, i18n, language: request.language, transaction, collections }),
      webScan: new WebScanDataSource({ query, userKey, cleanseInput, i18n }),
    },
    loaders: initializeLoaders({
      query,
      userKey,
      i18n,
      language: request.language,
      cleanseInput,
      loginRequiredBool,
      moment,
    }),
  }
}
