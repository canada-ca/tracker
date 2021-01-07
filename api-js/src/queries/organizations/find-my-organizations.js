const { connectionArgs } = require('graphql-relay')
const { t } = require('@lingui/macro')
const { organizationConnection } = require('../../types')

const findMyOrganizations = {
  type: organizationConnection.connectionType,
  description: 'Select organizations a user has access to.',
  args: {
    ...connectionArgs,
  },
  resolve: async (
    _,
    args,
    {
      i18n,
      userKey,
      auth: { userRequired },
      loaders: { orgLoaderConnectionsByUserId },
    },
  ) => {
    let orgConnections

    await userRequired()

    try {
      orgConnections = await orgLoaderConnectionsByUserId(args)
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather organization connections in findMyOrganizations.`,
      )
      throw new Error(
        i18n._(t`Unable to load organizations. Please try again.`),
      )
    }

    console.info(`User ${userKey} successfully retrieved their organizations.`)

    return orgConnections
  },
}

module.exports = {
  findMyOrganizations,
}
