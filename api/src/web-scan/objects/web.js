import { GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql'
import { globalIdField } from 'graphql-relay'

import { nodeInterface } from '../../node'
import { GraphQLDateTime } from 'graphql-scalars'
import { webScanType } from './web-scan'

export const webType = new GraphQLObjectType({
  name: 'Web',
  fields: () => ({
    id: globalIdField('web'),
    domain: {
      type: GraphQLString,
      description: `The domain string the scan was ran on.`,
    },
    timestamp: {
      type: GraphQLDateTime,
      description: `The time when the scan was initiated.`,
      resolve: ({ timestamp }) => new Date(timestamp),
    },
    results: {
      type: new GraphQLList(webScanType),
      description: `Results of the web scan at each IP address.`,
      resolve: async ({ _id }, args, { loaders: { loadWebScansByWebId } }) => {
        return await loadWebScansByWebId({
          webId: _id,
          ...args,
        })
      },
    },
  }),
  interfaces: [nodeInterface],
  description: `Results of TLS and HTTP connection scans on the given domain.`,
})
