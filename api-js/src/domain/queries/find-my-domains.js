import { t } from '@lingui/macro'
import { GraphQLBoolean } from 'graphql'
import { connectionArgs } from 'graphql-relay'

import { domainConnection } from '../objects'

export const findMyDomains = {
  type: domainConnection.connectionType,
  description: 'Select domains a user has access to.',
  args: {
    ownership: {
      type: GraphQLBoolean,
      description:
        'Limit domains to those that belong to an organization that has ownership.',
    },
    ...connectionArgs,
  },
  resolve: async (
    _,
    args,
    {
      i18n,
      userKey,
      auth: { userRequired },
      loaders: { domainLoaderConnectionsByUserId },
    },
  ) => {
    let domainConnections

    await userRequired()

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
