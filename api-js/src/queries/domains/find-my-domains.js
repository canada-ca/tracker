const { connectionArgs } = require('graphql-relay')
const { domainConnection } = require('../../types')

const findMyDomains = {
  type: domainConnection.connectionType,
  description: 'Select domains a user has access to.',
  args: {
    ...connectionArgs,
  },
  resolve: async () => {},
}

module.exports = {
  findMyDomains,
}
