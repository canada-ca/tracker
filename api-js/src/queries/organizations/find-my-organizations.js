const { connectionArgs } = require('graphql-relay')
const { organizationConnection } = require('../../types')

const findMyOrganizations = {
  type: organizationConnection.connectionType,
  description: 'Select organizations a user has access to.',
  args: {
    ...connectionArgs,
  },
  resolve: async () => {},
}

module.exports = {
  findMyOrganizations,
}
