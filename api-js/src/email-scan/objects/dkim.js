import { GraphQLInt, GraphQLObjectType, GraphQLString } from 'graphql'
import { connectionArgs, connectionDefinitions, globalIdField } from 'graphql-relay'

import { domainType } from '../../domain'
import { dkimResultConnection } from './dkim-result'

export const dkimType = new GraphQLObjectType({
  name: 'DKIM',
  fields: () => ({
    id: globalIdField('dkim'),
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domainId }, _, { loaders: { domainLoaderByKey } }) => {
        const domainKey = domainId.split('/')[1]
        const domain = await domainLoaderByKey.load(domainKey)
        domain.id = domain._key
        return domain
      },
    },
    timestamp: {
      type: GraphQLString,
      description: `The time when the scan was initiated.`,
      resolve: ({ timestamp }) => timestamp,
    },
    results: {
      type: dkimResultConnection.connectionType,
      args: {
        ...connectionArgs,
      },
      description: 'Individual scans results for each dkim selector.',
      resolve: async (
        { _id },
        args,
        { loaders: { dkimResultsLoaderConnectionByDkimId } },
      ) => {
        const dkimResults = await dkimResultsLoaderConnectionByDkimId({
          dkimId: _id,
          ...args,
        })
        return dkimResults
      },
    },
  }),
  interfaces: [nodeInterface],
  description: `DomainKeys Identified Mail (DKIM) permits a person, role, or
organization that owns the signing domain to claim some
responsibility for a message by associating the domain with the
message.  This can be an author's organization, an operational relay,
or one of their agents.`,
})

export const dkimConnection = connectionDefinitions({
  name: 'DKIM',
  nodeType: dkimType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of dkim scans related to a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
