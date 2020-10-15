const { GraphQLBoolean } = require('graphql')

const isUserAdmin = {
  type: GraphQLBoolean,
  description: 'Query used to check if the user has an admin role.',
  resolve: async (
    _,
    args,
    {
      userId: userKey,
      query,
      auth: { checkPermission },
      loaders: { userLoaderByKey, orgLoaderConnectionsByUserId },
    },
  ) => {
    const orgConnections = await orgLoaderConnectionsByUserId({})

    const user = await userLoaderByKey.load(userKey)

    let permission

    for (var i = 0; i < orgConnections.edges.length; i++) {
      permission = await checkPermission(
        user._id,
        'organizations/'.concat(orgConnections.edges[i].node.id),
        query,
      )
      if (permission === 'admin' || permission === 'super_admin') {
        return true
      }
    }
    return false
  },
}

module.exports = {
  isUserAdmin,
}
