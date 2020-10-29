const { GraphQLBoolean } = require('graphql')
const { t } = require('@lingui/macro')

const isUserAdmin = {
  type: GraphQLBoolean,
  description: 'Query used to check if the user has an admin role.',
  resolve: async (
    _,
    __,
    {
      i18n,
      query,
      userId,
      auth: { userRequired },
      loaders: { userLoaderByKey },
    },
  ) => {
    const user = await userRequired(userId, userLoaderByKey)

    let userAdmin
    try {
      userAdmin = await query`
      FOR v, e IN 1..1 INBOUND ${user._id} affiliations 
      FILTER e.permission == "admin" || e.permission == "super_admin" 
      LIMIT 1 
      RETURN e.permission
      `
    } catch (err) {
      console.error(`Database error occurred when user: ${userId} was seeing if they were an admin, err: ${err}`)
      throw new Error(i18n._(t`Unable to verify if user is an admin, please try again.`))
    }

    if (userAdmin.count > 0) {
      return true
    } 

    return false
  },
}

module.exports = {
  isUserAdmin,
}
