const { connectionArgs } = require('graphql-relay')
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
    {
      userId,
      loaders: {
        domainLoaderConnectionsByUserId,
      },
    },
  ) => {
    let domainConnections

    try {
      domainConnections = await domainLoaderConnectionsByUserId({args})
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userId} was trying to gather domain connections in findMyDomains.`,
      )
      throw new Error('Unable to load domains. Please try again.')
    }

    console.info(`User ${userId} successfully retrieved their domains.`)

    return domainConnections
  },
}

module.exports = {
  findMyDomains,
}
