import { GraphQLBoolean, GraphQLString } from 'graphql'
import { connectionArgs } from 'graphql-relay'

import { organizationOrder } from '../inputs'
import { organizationConnection } from '../objects'

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
    isAdmin: {
      type: GraphQLBoolean,
      description: 'Filter orgs based off of the user being an admin of them.',
    },
    includeSuperAdminOrg: {
      type: GraphQLBoolean,
      description:
        'Filter org list to either include or exclude the super admin org.',
    },
    ...connectionArgs,
  },
  resolve: async (
    _,
    args,
    {
      userKey,
      auth: { checkSuperAdmin, userRequired },
      loaders: { loadOrgConnectionsByUserId },
    },
  ) => {
    await userRequired()

    const isSuperAdmin = await checkSuperAdmin()

    const orgConnections = await loadOrgConnectionsByUserId({
      isSuperAdmin,
      ...args,
    })

    console.info(`User ${userKey} successfully retrieved their organizations.`)

    return orgConnections
  },
}
