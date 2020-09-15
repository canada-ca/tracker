const { GraphQLBoolean } = require('graphql')

const isUserAdmin = {
  type: GraphQLBoolean,
  description: 'Query used to check if the user has an admin role.',
  resolve: async () => {},
}

module.exports = {
  isUserAdmin,
}
