import { t } from '@lingui/macro'
import { GraphQLBoolean, GraphQLString } from 'graphql'
import { connectionArgs } from 'graphql-relay'

import { domainOrder } from '../inputs'
import { domainConnection } from '../objects'

export const findMyDomains = {
  type: domainConnection.connectionType,
  description: 'Select domains a user has access to.',
  args: {
    orderBy: {
      type: domainOrder,
      description: 'Ordering options for domain connections.',
    },
    ownership: {
      type: GraphQLBoolean,
      description:
        'Limit domains to those that belong to an organization that has ownership.',
    },
    search: {
      type: GraphQLString,
      description: 'String used to search for domains.',
    },
    ...connectionArgs,
  },
  resolve: async (
    _,
    args,
    {
      i18n,
      userKey,
      auth: { checkSuperAdmin, userRequired },
      loaders: { domainLoaderConnectionsByUserId },
    },
  ) => {
    let domainConnections

    await userRequired()

    const isSuperAdmin = await checkSuperAdmin()

    try {
      domainConnections = await domainLoaderConnectionsByUserId({
        isSuperAdmin,
        ...args,
      })
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather domain connections in findMyDomains.`,
      )
      throw new Error(i18n._(t`Unable to load domains. Please try again.`))
    }

    console.info(`User: ${userKey} successfully retrieved their domains.`)

    return domainConnections
  },
}
