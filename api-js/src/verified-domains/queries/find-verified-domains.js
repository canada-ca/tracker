import { connectionArgs } from 'graphql-relay'

import { verifiedDomainOrder } from '../inputs'
import { verifiedDomainConnection } from '../objects'

export const findVerifiedDomains = {
  type: verifiedDomainConnection.connectionType,
  description: 'Select verified check domains',
  args: {
    orderBy: {
      type: verifiedDomainOrder,
      description: 'Ordering options for verified domain connections.',
    },
    ...connectionArgs,
  },
  resolve: async (_, args, { loaders: { loadVerifiedDomainConnections } }) => {
    const domainConnections = await loadVerifiedDomainConnections(args)
    return domainConnections
  },
}

module.exports = {
  findVerifiedDomains,
}
