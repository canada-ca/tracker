import { GraphQLBoolean, GraphQLString } from 'graphql'
import { connectionArgs } from 'graphql-relay'
import { organizationOrder } from '../inputs'
import { webCheckConnection } from '../objects/web-check-connection'

export const findMyWebCheckOrganizations = {
  type: webCheckConnection.connectionType,
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
    ...connectionArgs,
  },
  resolve: async (
    _,
    args,
    {
      userKey,
      auth: { checkSuperAdmin, userRequired, verifiedRequired },
      loaders: { loadWebCheckConnectionsByUserId },
    },
  ) => {
    const user = await userRequired()
    verifiedRequired({ user })

    const isSuperAdmin = await checkSuperAdmin()

    const webCheckConnections = await loadWebCheckConnectionsByUserId({
      isSuperAdmin,
      ...args,
    })

    console.info(`User ${userKey} successfully retrieved their organizations.`)
    return webCheckConnections
  },
}
