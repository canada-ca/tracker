import { GraphQLObjectType } from 'graphql'
import { connectionArgs, globalIdField } from 'graphql-relay'
import { GraphQLDate } from 'graphql-scalars'

import { dkimResultConnection } from './dkim-result-connection'
import { dkimResultOrder } from '../inputs'
import { domainType } from '../../domain/objects'
import { nodeInterface } from '../../node'

export const dkimType = new GraphQLObjectType({
  name: 'DKIM',
  fields: () => ({
    id: globalIdField('dkim'),
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domainId }, _, { loaders: { loadDomainByKey } }) => {
        const domainKey = domainId.split('/')[1]
        const domain = await loadDomainByKey.load(domainKey)
        domain.id = domain._key
        return domain
      },
    },
    timestamp: {
      type: GraphQLDate,
      description: `The time when the scan was initiated.`,
      resolve: ({ timestamp }) => new Date(timestamp),
    },
    results: {
      type: dkimResultConnection.connectionType,
      args: {
        orderBy: {
          type: dkimResultOrder,
          description: 'Ordering options for DKIM result connections.',
        },
        ...connectionArgs,
      },
      description: 'Individual scans results for each DKIM selector.',
      resolve: async (
        { _id },
        args,
        { loaders: { loadDkimResultConnectionsByDkimId } },
      ) => {
        const dkimResults = await loadDkimResultConnectionsByDkimId({
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
