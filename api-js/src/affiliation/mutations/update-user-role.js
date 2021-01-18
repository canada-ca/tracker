import { GraphQLNonNull, GraphQLString, GraphQLID } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { GraphQLEmailAddress } from 'graphql-scalars'
import { t } from '@lingui/macro'
import { RoleEnums } from '../../enums'

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
    status: {
      type: GraphQLString,
      description: 'Informs the user if the user role update was successful.',
      resolve: async (payload) => {
        return payload.status
      },
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
      auth: { checkPermission, userRequired },
      loaders: { orgLoaderByKey, userLoaderByUserName },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse Input
    const userName = cleanseInput(args.userName)
    const { id: orgId } = fromGlobalId(cleanseInput(args.orgId))
    const role = cleanseInput(args.role)

    // Get requesting user from db
    const user = await userRequired()

    // Make sure user is not attempting to update their own role
    if (user.userName === userName) {
      console.warn(
        `User: ${userKey} attempted to update their own role in org: ${orgId}.`,
      )
      throw new Error(
        i18n._(t`Unable to update your own role. Please try again.`),
      )
    }

    // Check to see if requested user exists
    const requestedUser = await userLoaderByUserName.load(userName)

    if (typeof requestedUser === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update a user: ${userName} role in org: ${orgId}, however there is no user associated with that user name.`,
      )
      throw new Error(i18n._(t`Unable to update users role. Please try again.`))
    }

    // Check to see if org exists
    const org = await orgLoaderByKey.load(orgId)

    if (typeof org === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update a user: ${requestedUser._key} role in org: ${orgId}, however there is no org associated with that id.`,
      )
      throw new Error(i18n._(t`Unable to update users role. Please try again.`))
    }

    // Check requesting users permission
    const permission = await checkPermission({ orgId: org._id })

    if (permission === 'user' || typeof permission === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update a user: ${requestedUser._key} role in org: ${org.slug}, however they do not have permission to do so.`,
      )
      throw new Error(i18n._(t`Unable to update users role. Please try again.`))
    }

    // Get users current permission level
    let affiliationCursor
    try {
      affiliationCursor = await query`
      FOR v, e IN 1..1 ANY ${requestedUser._id} affiliations 
        FILTER e._from == ${org._id}
        RETURN { _key: e._key, permission: e.permission }
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} attempted to update a users: ${requestedUser._key} role, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to update users role. Please try again.`))
    }

    if (affiliationCursor.count < 1) {
      console.warn(
        `User: ${userKey} attempted to update a user: ${requestedUser._key} role in org: ${org.slug}, however that user does not have an affiliation with that organization.`,
      )
      throw new Error(
        i18n._(
          t`Unable to update users role. Please invite user to the organization.`,
        ),
      )
    }

    const affiliation = await affiliationCursor.next()

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
      // If requested users permission is super admin, make sure they don't get downgraded
      if (affiliation.permission === 'super_admin') {
        console.warn(
          `User: ${userKey} attempted to lower user: ${requestedUser._key} from ${affiliation.permission} to: admin.`,
        )
        throw new Error(
          i18n._(t`Unable to update users role. Please try again.`),
        )
      }

      edge = {
        _from: org._id,
        _to: requestedUser._id,
        permission: 'admin',
      }
    } else if (role === 'user' && permission === 'super_admin') {
      // If requested users permission is super admin or admin, make sure they don't get downgraded
      if (
        affiliation.permission === 'super_admin' ||
        (affiliation.permission === 'admin' && permission !== 'super_admin')
      ) {
        console.warn(
          `User: ${userKey} attempted to lower user: ${requestedUser._key} from ${affiliation.permission} to: user.`,
        )
        throw new Error(
          i18n._(t`Unable to update users role. Please try again.`),
        )
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
      throw new Error(i18n._(t`Unable to update users role. Please try again.`))
    }

    try {
      await trx.run(async () => {
        await query`
          UPSERT { _key: ${affiliation._key} }
            INSERT ${edge}
            UPDATE ${edge}
            IN affiliations
        `
      })
    } catch (err) {
      console.error(
        `Transaction run error occurred when user: ${userKey} attempted to update a users: ${requestedUser._key} role, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to update users role. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.warn(
        `Transaction commit error occurred when user: ${userKey} attempted to update a users: ${requestedUser._key} role, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to update users role. Please try again.`))
    }

    console.info(
      `User: ${userKey} successful updated user: ${requestedUser._key} role to ${role} in org: ${org.slug}.`,
    )

    return {
      status: i18n._(t`User role was updated successfully.`),
    }
  },
})
