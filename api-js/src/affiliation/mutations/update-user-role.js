import { GraphQLNonNull, GraphQLID } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { GraphQLEmailAddress } from 'graphql-scalars'
import { t } from '@lingui/macro'

import { RoleEnums } from '../../enums'
import { updateUserRoleUnion } from '../unions'

export const updateUserRole = new mutationWithClientMutationId({
  name: 'UpdateUserRole',
  description: `This mutation allows super admins, and admins of the given organization to
update the permission level of a given user that already belongs to the
given organization.`,
  inputFields: () => ({
    userName: {
      type: GraphQLNonNull(GraphQLEmailAddress),
      description: 'The username of the user you wish to update their role to.',
    },
    orgId: {
      type: GraphQLNonNull(GraphQLID),
      description:
        'The organization that the admin, and the user both belong to.',
    },
    role: {
      type: GraphQLNonNull(RoleEnums),
      description:
        'The role that the admin wants to give to the selected user.',
    },
  }),
  outputFields: () => ({
    result: {
      type: updateUserRoleUnion,
      description:
        '`UpdateUserRoleUnion` returning either a `UpdateUserRoleResult`, or `UpdateUserRoleError` object.',
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
      userKey,
      auth: { checkPermission, userRequired, verifiedRequired },
      loaders: { loadOrgByKey, loadUserByUserName },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse Input
    const userName = cleanseInput(args.userName).toLowerCase()
    const { id: orgId } = fromGlobalId(cleanseInput(args.orgId))
    const role = cleanseInput(args.role)

    // Get requesting user from db
    const user = await userRequired()

    verifiedRequired({ user })

    // Make sure user is not attempting to update their own role
    if (user.userName === userName) {
      console.warn(
        `User: ${userKey} attempted to update their own role in org: ${orgId}.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to update your own role.`),
      }
    }

    // Check to see if requested user exists
    const requestedUser = await loadUserByUserName.load(userName)

    if (typeof requestedUser === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update a user: ${userName} role in org: ${orgId}, however there is no user associated with that user name.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to update role: user unknown.`),
      }
    }

    // Check to see if org exists
    const org = await loadOrgByKey.load(orgId)

    if (typeof org === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update a user: ${requestedUser._key} role in org: ${orgId}, however there is no org associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to update role: organization unknown.`),
      }
    }

    // Check requesting user's permission
    const permission = await checkPermission({ orgId: org._id })

    if (permission === 'user' || typeof permission === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update a user: ${requestedUser._key} role in org: ${org.slug}, however they do not have permission to do so.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(
          t`Permission Denied: Please contact organization admin for help with user role changes.`,
        ),
      }
    }

    // Get user's current permission level
    let affiliationCursor
    try {
      affiliationCursor = await query`
      WITH affiliations, organizations, users
      FOR v, e IN 1..1 ANY ${requestedUser._id} affiliations 
        FILTER e._from == ${org._id}
        RETURN { _key: e._key, permission: e.permission }
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} attempted to update a user's: ${requestedUser._key} role, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to update user's role. Please try again.`),
      )
    }

    if (affiliationCursor.count < 1) {
      console.warn(
        `User: ${userKey} attempted to update a user: ${requestedUser._key} role in org: ${org.slug}, however that user does not have an affiliation with that organization.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(
          t`Unable to update role: user does not belong to organization.`,
        ),
      }
    }

    let affiliation
    try {
      affiliation = await affiliationCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} attempted to update a user's: ${requestedUser._key} role, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to update user's role. Please try again.`),
      )
    }

    // Generate list of collections names
    const collectionStrings = []
    for (const property in collections) {
      collectionStrings.push(property.toString())
    }

    // Setup Transaction
    const trx = await transaction(collectionStrings)

    // Only super admins can create new super admins
    let edge
    if (role === 'super_admin' && permission === 'super_admin') {
      edge = {
        _from: org._id,
        _to: requestedUser._id,
        permission: 'super_admin',
      }
    } else if (
      role === 'admin' &&
      (permission === 'admin' || permission === 'super_admin')
    ) {
      // If requested user's permission is super admin, make sure they don't get downgraded
      if (affiliation.permission === 'super_admin') {
        console.warn(
          `User: ${userKey} attempted to lower user: ${requestedUser._key} from ${affiliation.permission} to: admin.`,
        )
        return {
          _type: 'error',
          code: 400,
          description: i18n._(
            t`Permission Denied: Please contact organization admin for help with updating user roles.`,
          ),
        }
      }

      edge = {
        _from: org._id,
        _to: requestedUser._id,
        permission: 'admin',
      }
    } else if (role === 'user' && permission === 'super_admin') {
      // If requested user's permission is super admin or admin, make sure they don't get downgraded
      if (
        affiliation.permission === 'super_admin' ||
        (affiliation.permission === 'admin' && permission !== 'super_admin')
      ) {
        console.warn(
          `User: ${userKey} attempted to lower user: ${requestedUser._key} from ${affiliation.permission} to: user.`,
        )
        return {
          _type: 'error',
          code: 400,
          description: i18n._(
            t`Permission Denied: Please contact organization admin for help with updating user roles.`,
          ),
        }
      }

      edge = {
        _from: org._id,
        _to: requestedUser._id,
        permission: 'user',
      }
    } else {
      console.warn(
        `User: ${userKey} attempted to lower user: ${requestedUser._key} from ${affiliation.permission} to: ${role}.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(
          t`Permission Denied: Please contact organization admin for help with updating user roles.`,
        ),
      }
    }

    try {
      await trx.step(async () => {
        await query`
          WITH affiliations, organizations, users
          UPSERT { _key: ${affiliation._key} }
            INSERT ${edge}
            UPDATE ${edge}
            IN affiliations
        `
      })
    } catch (err) {
      console.error(
        `Transaction step error occurred when user: ${userKey} attempted to update a user's: ${requestedUser._key} role, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to update user's role. Please try again.`),
      )
    }

    try {
      await trx.commit()
    } catch (err) {
      console.warn(
        `Transaction commit error occurred when user: ${userKey} attempted to update a user's: ${requestedUser._key} role, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to update user's role. Please try again.`),
      )
    }

    console.info(
      `User: ${userKey} successful updated user: ${requestedUser._key} role to ${role} in org: ${org.slug}.`,
    )

    return {
      _type: 'regular',
      status: i18n._(t`User role was updated successfully.`),
    }
  },
})
