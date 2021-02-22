import { connectionArgs } from 'graphql-relay'

import { verifiedOrganizationOrder } from '../inputs'
import { verifiedOrganizationConnection } from '../objects'

export const findVerifiedOrganizations = {
  type: verifiedOrganizationConnection.connectionType,
  description: 'Select organizations a user has access to.',
  args: {
    orderBy: {
      type: verifiedOrganizationOrder,
      description: 'Ordering options for verified organization connections.',
    },
    ...connectionArgs,
  },
  resolve: async (_, args, { loaders: { verifiedOrgLoaderConnections } }) => {
    const orgConnections = await verifiedOrgLoaderConnections(args)
    return orgConnections
  },
}
