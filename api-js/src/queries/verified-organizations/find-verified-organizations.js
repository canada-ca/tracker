const { connectionArgs } = require('graphql-relay')
const { verifiedOrganizationConnections } = require('../../types')

const findVerifiedOrganizations = {
  type: verifiedOrganizationConnections.connectionType,
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
