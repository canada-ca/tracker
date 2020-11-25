const { connectionArgs } = require('graphql-relay')
const { verifiedOrganizationConnection } = require('../../types')

const findVerifiedOrganizations = {
  type: verifiedOrganizationConnection.connectionType,
  description: 'Select organizations a user has access to.',
  args: {
    ...connectionArgs,
  },
  resolve: async (_, args, { loaders: { verifiedOrgLoaderConnections } }) => {
    const orgConnections = await verifiedOrgLoaderConnections(args)
    return orgConnections
  },
}

module.exports = {
  findVerifiedOrganizations,
}
