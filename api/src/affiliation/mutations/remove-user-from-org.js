import { GraphQLNonNull, GraphQLID } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { removeUserFromOrgUnion } from '../unions'
import { logActivity } from '../../audit-logs/mutations/log-activity'
import ac from '../../access-control'

export const removeUserFromOrg = new mutationWithClientMutationId({
  name: 'RemoveUserFromOrg',
  description: 'This mutation allows admins or higher to remove users from any organizations they belong to.',
  inputFields: () => ({
    userId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The user id of the user to be removed.',
    },
    orgId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The organization that the user is to be removed from.',
    },
  }),
  outputFields: () => ({
    result: {
      type: removeUserFromOrgUnion,
      description:
        '`RemoveUserFromOrgUnion` returning either a `RemoveUserFromOrgResult`, or `RemoveUserFromOrgError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      query,
      transaction,
      userKey,
      dataSources: { affiliation: affiliationDataSource },
      request: { ip },
      auth: { checkPermission, userRequired, verifiedRequired, tfaRequired },
      loaders: { loadOrgByKey, loadUserByKey },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse Input
    const { id: requestedUserKey } = fromGlobalId(cleanseInput(args.userId))
    const { id: requestedOrgKey } = fromGlobalId(cleanseInput(args.orgId))

    // Get requesting user
    const user = await userRequired()

    verifiedRequired({ user })
    tfaRequired({ user })

    // Get requested org
    const requestedOrg = await loadOrgByKey.load(requestedOrgKey)
    if (typeof requestedOrg === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to remove user: ${requestedUserKey} from org: ${requestedOrgKey}, however no org with that id could be found.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to remove user from unknown organization.`),
      }
    }

    // Check requesting users permission
    const permission = await checkPermission({ orgId: requestedOrg._id })

    // Get requested user
    const requestedUser = await loadUserByKey.load(requestedUserKey)
    if (typeof requestedUser === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to remove user: ${requestedUserKey} from org: ${requestedOrg._key}, however no user with that id could be found.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to remove unknown user from organization.`),
      }
    }

    // Get requested users current permission level
    let affiliation
    try {
      affiliation = await affiliationDataSource.affiliationByOrgAndUser({ orgId: requestedOrg._id, userId: requestedUser._id })
    } catch (err) {
      if (err.affiliationDataSourceOp === 'query') {
        console.error(
          `Database error occurred when user: ${userKey} attempted to check the current permission of user: ${requestedUser._key} to see if they could be removed: ${err}`,
        )
      } else if (err.affiliationDataSourceOp === 'cursor') {
        console.error(
          `Cursor error occurred when user: ${userKey} attempted to check the current permission of user: ${requestedUser._key} to see if they could be removed: ${err}`,
        )
      }
      throw new Error(i18n._(t`Unable to remove user from this organization. Please try again.`))
    }

    if (typeof affiliation === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to remove user: ${requestedUser._key}, but they do not have any affiliations to org: ${requestedOrg._key}.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to remove a user that already does not belong to this organization.`),
      }
    }

    // Only admins, owners, and super admins can remove users
    if (!ac.can(permission).deleteOwn('affiliation').granted) {
      console.warn(
        `User: ${userKey} attempted to remove user: ${requestedUser._key} from org: ${requestedOrg._key}, but they do not have the right permission.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Permission Denied: Please contact organization admin for help with removing users.`),
      }
    }

    // Only super admins can remove super admins and owners
    if (['owner', 'super_admin'].includes(affiliation.permission) && permission !== 'super_admin') {
      console.warn(
        `User: ${userKey} attempted to remove user: ${requestedUser._key} from org: ${requestedOrg._key}, but they do not have the right permission.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Permission Denied: Please contact organization admin for help with removing users.`),
      }
    }

    try {
      await affiliationDataSource.removeAffiliation({ orgId: requestedOrg._id, userId: requestedUser._id })
    } catch (err) {
      if (err.affiliationDataSourceOp === 'trx-step') {
        console.error(
          `Trx step error occurred when user: ${userKey} attempted to remove user: ${requestedUser._key} from org: ${requestedOrg._key}, error: ${err}`,
        )
      } else if (err.affiliationDataSourceOp === 'trx-commit') {
        console.error(
          `Trx commit error occurred when user: ${userKey} attempted to remove user: ${requestedUser._key} from org: ${requestedOrg._key}, error: ${err}`,
        )
      }
      throw new Error(i18n._(t`Unable to remove user from this organization. Please try again.`))
    }

    console.info(`User: ${userKey} successfully removed user: ${requestedUser._key} from org: ${requestedOrg._key}.`)
    await logActivity({
      transaction,
      collections,
      query,
      initiatedBy: {
        id: user._key,
        userName: user.userName,
        role: permission,
        ipAddress: ip,
      },
      action: 'remove',
      target: {
        resource: requestedUser.userName,
        organization: {
          id: requestedOrg._key,
          name: requestedOrg.name,
        }, // name of resource being acted upon
        resourceType: 'user', // user, org, domain
      },
    })

    return {
      _type: 'regular',
      status: i18n._(t`Successfully removed user from organization.`),
      user: {
        id: requestedUser.id,
        userName: requestedUser.userName,
      },
    }
  },
})
