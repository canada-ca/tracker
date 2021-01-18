import { connectionArgs } from 'graphql-relay'
import { verifiedOrganizationConnection } from '../objects'

export const findVerifiedOrganizations = {
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
