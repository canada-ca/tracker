const { connectionArgs } = require('graphql-relay')
const { t } = require('@lingui/macro')
const { domainConnection } = require('../../types')

const findMyDomains = {
  type: domainConnection.connectionType,
  description: 'Select domains a user has access to.',
  args: {
    ...connectionArgs,
  },
  resolve: async (
    _,
    args,
    { i18n, userKey, loaders: { domainLoaderConnectionsByUserId } },
  ) => {
    let domainConnections

    try {
      domainConnections = await domainLoaderConnectionsByUserId(args)
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather domain connections in findMyDomains.`,
      )
      throw new Error(i18n._(t`Unable to load domains. Please try again.`))
    }

    console.info(`User ${userKey} successfully retrieved their domains.`)

    return domainConnections
  },
}

module.exports = {
  findMyDomains,
}
