const { GraphQLEmailAddress } = require('graphql-scalars')
const { t } = require('@lingui/macro')
const { userType } = require('../../types')

const findUserByUsername = {
  type: userType,
  args: {
    userName: {
      type: GraphQLEmailAddress,
      description: 'Email address of user you wish to gather data for.',
    },
  },
  description: 'Query a specific user by user name.',
  resolve: async (
    _,
    args,
    {
      i18n,
      query,
      userId,
      auth: { userRequired },
      loaders: { userLoaderByUserName },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse input
    const userName = cleanseInput(args.userName)
    // Get querying user
    const currentUser = await userRequired()

    if (userName === '') {
      console.error(`User: ${userId} provided no username argument to query`)
      throw new Error(
        i18n._(t`Unable to query user without a username, please try again.`),
      )
    }

    let userAdmin
    try {
      userAdmin = await query`
      FOR v, e IN 1..1 INBOUND ${currentUser._id} affiliations
      FILTER e.permission == "admin" || e.permission == "super_admin"
      LIMIT 1
      RETURN e.permission
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userId} was querying for users, err: ${err}`,
      )
      throw new Error(i18n._(t`Unable to query user, please try again.`))
    }

    if (userAdmin.count > 0) {
      // Retrieve user by userName
      const user = await userLoaderByUserName.load(userName)
      return user
    } else {
      console.warn(`User ${userId} is not permitted to query users.`)
      throw new Error(i18n._(t`User could not be queried.`))
    }
  },
}

module.exports = {
  findUserByUsername,
}
