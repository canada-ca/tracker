import { connectionArgs } from 'graphql-relay'
import { t } from '@lingui/macro'

import { organizationOrder } from '../inputs'
import { organizationConnection } from '../objects'
import { GraphQLString } from 'graphql'

export const findMyOrganizations = {
  type: organizationConnection.connectionType,
  description: 'Select organizations a user has access to.',
  args: {
    orderBy: {
      type: organizationOrder,
      description: 'Ordering options for organization connections',
    },
    search: {
      type: GraphQLString,
      description: 'String argument used to search for organizations.',
    },
    ...connectionArgs,
  },
  resolve: async (
    _,
    args,
    {
      i18n,
      userKey,
      auth: { checkSuperAdmin, userRequired },
      loaders: { orgLoaderConnectionsByUserId },
    },
  ) => {
    let orgConnections

    await userRequired()

    const isSuperAdmin = await checkSuperAdmin()

    try {
      orgConnections = await orgLoaderConnectionsByUserId({
        isSuperAdmin,
        ...args,
      })
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather organization connections in findMyOrganizations.`,
      )
      throw new Error(
        i18n._(t`Unable to load organizations. Please try again.`),
      )
    }

    console.info(`User ${userKey} successfully retrieved their organizations.`)

    return orgConnections
  },
}
