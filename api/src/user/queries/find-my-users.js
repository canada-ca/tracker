import { GraphQLString } from 'graphql'
import { connectionArgs } from 'graphql-relay'

import { affiliationUserOrder } from '../../affiliation/inputs'
import { userConnection } from '../objects/user-connection'

export const findMyUsers = {
  type: userConnection.connectionType,
  description: 'Select users an admin has access to.',
  args: {
    orderBy: {
      type: affiliationUserOrder,
      description: 'Ordering options for user affiliation',
    },
    search: {
      type: GraphQLString,
      description: 'String used to search for users.',
    },
    ...connectionArgs,
  },
  resolve: async (
    _,
    args,
    {
      userKey,
      auth: { checkSuperAdmin, userRequired, verifiedRequired },
      loaders: { loadUserConnectionsByUserId },
    },
  ) => {
    const user = await userRequired()
    verifiedRequired({ user })

    const isSuperAdmin = await checkSuperAdmin()

    const userConnections = await loadUserConnectionsByUserId({
      isSuperAdmin,
      ...args,
    })

    console.info(`User: ${userKey} successfully retrieved their users.`)

    return userConnections
  },
}
