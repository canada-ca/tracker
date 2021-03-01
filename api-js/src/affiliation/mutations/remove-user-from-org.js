import { GraphQLNonNull, GraphQLID, GraphQLString } from 'graphql'
import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const removeUserFromOrg = new mutationWithClientMutationId({
  name: 'RemoveUserFromOrg',
  description: '',
  inputFields: () => ({
    userId: {
      type: GraphQLNonNull(GraphQLID),
      description: '',
    },
    orgId: {
      type: GraphQLNonNull(GraphQLID),
      description: '',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description: '',
      resolve: ({ status }) => status,
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
      loaders: { orgLoaderByKey, userLoaderByKey },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse Input
    const { id: requestedUserKey } = fromGlobalId(cleanseInput(args.userId))
    const { id: requestedOrgKey } = fromGlobalId(cleanseInput(args.orgId))

    // Get requesting user
    await userRequired()

    // Get requested org
    const requestedOrg = await orgLoaderByKey.load(requestedOrgKey)
    if (typeof requestedOrg === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to remove user: ${requestedUserKey} from org: ${requestedOrgKey}, however no org with that id could be found.`,
      )
      throw new Error(
        i18n._(t`Unable to remove user from organization. Please try again.`),
      )
    }

    // Check requesting users permission
    const permission = await checkPermission({ orgId: requestedOrg._id })
    if (permission === 'user' || typeof permission === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to remove user: ${requestedUserKey} from org: ${requestedOrg._key}, however they do not have the permission to remove users.`,
      )
      throw new Error(
        i18n._(t`Unable to remove user from organization. Please try again.`),
      )
    }

    // Get requested user
    const requestedUser = await userLoaderByKey.load(requestedUserKey)
    if (typeof requestedUser === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to remove user: ${requestedUserKey} from org: ${requestedOrg._key}, however no user with that id could be found.`,
      )
      throw new Error(
        i18n._(t`Unable to remove user from organization. Please try again.`),
      )
    }

    // Get requested users current permission level
    let affiliationCursor
    try {
      affiliationCursor = await query`
        FOR v, e IN 1..1 ANY ${requestedUser._id} affiliations
          FILTER e._from == ${requestedOrg._id}
          RETURN { _key: e._key, permission: e.permission }
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} attempted to check the current permission of user: ${requestedUser._key} to see if they could be removed.`,
      )
      throw new Error(
        i18n._(t`Unable to remove user from organization. Please try again.`),
      )
    }

    if (affiliationCursor.count < 1) {
      console.warn(
        `User: ${userKey} attempted to remove user: ${requestedUser._key}, but they do not have any affiliations to org: ${requestedOrg._key}.`,
      )
      throw new Error(
        i18n._(t`Unable to remove user from organization. Please try again.`),
      )
    }

    const affiliation = await affiliationCursor.next()

    let canRemove
    if (
      permission === 'super_admin' &&
      (affiliation.permission === 'admin' || affiliation.permission === 'user')
    ) {
      canRemove = true
    } else if (permission === 'admin' && affiliation.permission === 'user') {
      canRemove = true
    } else {
      canRemove = false
    }

    if (canRemove) {
      // Generate list of collections names
      const collectionStrings = []
      for (const property in collections) {
        collectionStrings.push(property.toString())
      }

      // Setup Transaction
      const trx = await transaction(collectionStrings)

      try {
        await trx.step(async () => {
          await query`
          FOR aff IN affiliations
            FILTER aff._from == ${requestedOrg._id}
            FILTER aff._to == ${requestedUser._id}
            REMOVE aff IN affiliations
            RETURN true
        `
        })
      } catch (err) {
        console.error(
          `Transaction step error occurred when user: ${userKey} attempted to remove user: ${requestedUser._key} from org: ${requestedOrg._key}, error: ${err}`,
        )
        throw new Error(
          i18n._(t`Unable to remove user from organization. Please try again.`),
        )
      }

      try {
        await trx.commit()
      } catch (err) {
        console.error(
          `Transaction commit error occurred when user: ${userKey} attempted to remove user: ${requestedUser._key} from org: ${requestedOrg._key}, error: ${err}`,
        )
        throw new Error(
          i18n._(t`Unable to remove user from organization. Please try again.`),
        )
      }

      console.info(
        `User: ${userKey} successfully removed user: ${requestedUser._key} from org: ${requestedOrg._key}.`,
      )

      return {
        status: i18n._(t`Successfully removed user from organization.`),
      }
    } else {
      console.warn(
        `User: ${userKey} attempted to remove user: ${requestedUser._key} from org: ${requestedOrg._key}, but they do not have the right permission.`,
      )
      throw new Error(
        i18n._(t`Unable to remove user from organization. Please try again.`),
      )
    }
  },
})
