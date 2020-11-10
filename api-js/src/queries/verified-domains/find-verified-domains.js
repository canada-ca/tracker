const { connectionArgs } = require('graphql-relay')
const { verifiedDomainConnection } = require('../../types')

const findVerifiedDomains = {
  type: verifiedDomainConnection.connectionType,
  description: 'Select blue check domains',
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
