import { connectionArgs } from 'graphql-relay'
import { GraphQLString } from 'graphql'
import { logConnection } from '../objects/log-connection'
import { logOrder } from '../input/log-order'

export const findAuditLogs = {
  type: logConnection.connectionType,
  description: '',
  args: {
    orderBy: {
      type: logOrder,
      description: '',
    },
    search: {
      type: GraphQLString,
      description: 'String used to search for domains.',
    },
    ...connectionArgs,
  },
  resolve: async (
    _,
    args,
    {
      userKey,
      //   auth: {
      //     checkSuperAdmin,
      //     userRequired,
      //     verifiedRequired,
      //     superAdminRequired,
      //   },
      loaders: { loadAuditLogs },
    },
  ) => {
    // const user = await userRequired()
    // verifiedRequired({ user })

    // const isSuperAdmin = await checkSuperAdmin()
    // superAdminRequired({ user, isSuperAdmin })

    const auditLogCollection = await loadAuditLogs({ ...args })

    console.info(`User: ${userKey} successfully retrieved audit logs.`)
    return auditLogCollection
  },
}
