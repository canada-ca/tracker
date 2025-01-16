import { t } from '@lingui/macro'
import { GraphQLID } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'
import { logActivity } from '../../audit-logs/mutations/log-activity'

import { closeAccountUnion } from '../unions'

export const closeAccountSelf = new mutationWithClientMutationId({
  name: 'CloseAccountSelf',
  description: `This mutation allows a user to close their account.`,
  outputFields: () => ({
    result: {
      type: closeAccountUnion,
      description: '`CloseAccountUnion` returning either a `CloseAccountResult`, or `CloseAccountError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    { i18n, query, collections, transaction, request: { ip }, auth: { userRequired }, validators: { cleanseInput } },
  ) => {
    let submittedUserId
    if (args?.userId) {
      submittedUserId = fromGlobalId(cleanseInput(args.userId)).id
    }

    const user = await userRequired()

    const userId = user._id
    const targetUserName = user.userName

    // Setup Trans action
    const trx = await transaction(collections)

    try {
      await trx.step(
        () => query`
          WITH affiliations, organizations, users
          FOR v, e IN 1..1 INBOUND ${userId} affiliations
            REMOVE { _key: e._key } IN affiliations
            OPTIONS { waitForSync: true }
        `,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred when removing users remaining affiliations when user: ${user._key} attempted to close account: ${userId}: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to close account. Please try again.`))
    }

    try {
      await trx.step(
        () => query`
          WITH users
          REMOVE PARSE_IDENTIFIER(${userId}).key
          IN users OPTIONS { waitForSync: true }
        `,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred when removing user: ${user._key} attempted to close account: ${userId}: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to close account. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred when user: ${user._key} attempted to close account: ${userId}: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to close account. Please try again.`))
    }

    console.info(`User: ${user._key} successfully closed user: ${userId} account.`)
    await logActivity({
      transaction,
      collections,
      query,
      initiatedBy: {
        id: user._key,
        userName: user.userName,
        role: submittedUserId ? 'SUPER_ADMIN' : '',
        ipAddress: ip,
      },
      action: 'delete',
      target: {
        resource: targetUserName, // name of resource being acted upon
        resourceType: 'user', // user, org, domain
      },
    })

    return {
      _type: 'regular',
      status: i18n._(t`Successfully closed account.`),
    }
  },
})

export const closeAccountOther = new mutationWithClientMutationId({
  name: 'CloseAccountOther',
  description: `This mutation allows a super admin to close another user's account.`,
  inputFields: () => ({
    userId: {
      type: GraphQLID,
      description: 'The user id of a user you want to close the account of.',
    },
  }),
  outputFields: () => ({
    result: {
      type: closeAccountUnion,
      description: '`CloseAccountUnion` returning either a `CloseAccountResult`, or `CloseAccountError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      query,
      collections,
      transaction,
      request: { ip },
      auth: { checkSuperAdmin, userRequired },
      loaders: { loadUserByKey },
      validators: { cleanseInput },
    },
  ) => {
    let submittedUserId
    if (args?.userId) {
      submittedUserId = fromGlobalId(cleanseInput(args.userId)).id
    }

    const user = await userRequired()

    let userId = ''
    let targetUserName = ''

    const permission = await checkSuperAdmin()
    if (!permission) {
      console.warn(
        `User: ${user._key} attempted to close user: ${submittedUserId} account, but requesting user is not a super admin.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Permission error: Unable to close other user's account.`),
      }
    }

    const checkUser = await loadUserByKey.load(submittedUserId)
    if (typeof checkUser === 'undefined') {
      console.warn(
        `User: ${user._key} attempted to close user: ${submittedUserId} account, but requested user is undefined.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to close account of an undefined user.`),
      }
    }
    userId = checkUser._id
    targetUserName = checkUser.userName

    // Setup Trans action
    const trx = await transaction(collections)

    try {
      await trx.step(
        () => query`
          WITH affiliations, organizations, users
          FOR v, e IN 1..1 INBOUND ${userId} affiliations
            REMOVE { _key: e._key } IN affiliations
            OPTIONS { waitForSync: true }
        `,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred when removing users remaining affiliations when user: ${user._key} attempted to close account: ${userId}: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to close account. Please try again.`))
    }

    try {
      await trx.step(
        () => query`
          WITH users
          REMOVE PARSE_IDENTIFIER(${userId}).key
          IN users OPTIONS { waitForSync: true }
        `,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred when removing user: ${user._key} attempted to close account: ${userId}: ${err}`,
      )
      await trx.abort()
      throw new Error(i18n._(t`Unable to close account. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred when user: ${user._key} attempted to close account: ${userId}: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to close account. Please try again.`))
    }

    console.info(`User: ${user._key} successfully closed user: ${userId} account.`)
    await logActivity({
      transaction,
      collections,
      query,
      initiatedBy: {
        id: user._key,
        userName: user.userName,
        role: submittedUserId ? 'SUPER_ADMIN' : '',
        ipAddress: ip,
      },
      action: 'delete',
      target: {
        resource: targetUserName, // name of resource being acted upon
        resourceType: 'user', // user, org, domain
      },
    })

    return {
      _type: 'regular',
      status: i18n._(t`Successfully closed account.`),
      user: checkUser,
    }
  },
})
