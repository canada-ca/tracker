import bcrypt from 'bcryptjs'
import moment from 'moment'
import fetch from 'isomorphic-fetch'
import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'

import { loadUserByKey } from './user/loaders'
import { cleanseInput, decryptPhoneNumber, slugify } from './validators'
import { initializeLoaders } from './initialize-loaders'
import {
  checkDomainOwnership,
  checkDomainPermission,
  checkOrgOwner,
  checkPermission,
  checkSuperAdmin,
  checkUserBelongsToOrg,
  checkUserIsAdminForUser,
  tokenize,
  saltedHash,
  userRequired,
  verifiedRequired,
  verifyToken,
  tfaRequired,
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

export async function createContext({
  query,
  transaction,
  collections,
  req: request,
  res: response,
  i18n,
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
    transaction,
    collections,
    i18n,
    request,
    response,
    userKey,
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
      checkDomainPermission: checkDomainPermission({ i18n, userKey, query }),
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
      sendOrgInviteCreateAccount: sendOrgInviteCreateAccount({
        notifyClient,
        i18n,
      }),
      sendOrgInviteEmail: sendOrgInviteEmail({ notifyClient, i18n }),
      sendPasswordResetEmail: sendPasswordResetEmail({ notifyClient, i18n }),
      sendTfaTextMsg: sendTfaTextMsg({ notifyClient, i18n }),
      sendVerificationEmail: sendVerificationEmail({ notifyClient, i18n }),
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
