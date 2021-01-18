import { connectionArgs } from 'graphql-relay'
import { verifiedDomainConnection } from '../objects'

export const findVerifiedDomains = {
  type: verifiedDomainConnection.connectionType,
  description: 'Select verified check domains',
  args: {
    ...connectionArgs,
  },
  resolve: async (
    _,
    args,
    { loaders: { verifiedDomainLoaderConnections } },
  ) => {
    const domainConnections = await verifiedDomainLoaderConnections({ ...args })
    return domainConnections
  },
}

module.exports = {
  findVerifiedDomains,
}
