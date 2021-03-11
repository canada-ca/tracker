import { GraphQLObjectType } from 'graphql'
import { connectionArgs } from 'graphql-relay'
import { GraphQLDate, GraphQLDateTime } from 'graphql-scalars'

import { domainType } from '../../domain/objects'
import { httpsOrder, sslOrder } from '../inputs'
import { httpsConnection } from './https'
import { sslConnection } from './ssl'

export const webScanType = new GraphQLObjectType({
  name: 'WebScan',
  fields: () => ({
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ _key }, _, { loaders: { domainLoaderByKey } }) => {
        const domain = await domainLoaderByKey.load(_key)
        domain.id = domain._key
        return domain
      },
    },
    https: {
      type: httpsConnection.connectionType,
      args: {
        startDate: {
          type: GraphQLDate,
          description: 'Start date for date filter.',
        },
        endDate: {
          type: GraphQLDate,
          description: 'End date for date filter.',
        },
        orderBy: {
          type: httpsOrder,
          description: 'Ordering options for https connections.',
        },
        ...connectionArgs,
      },
      description: `Hyper Text Transfer Protocol Secure scan results.`,
      resolve: async (
        { _id },
        args,
        { loaders: { httpsLoaderConnectionsByDomainId } },
      ) => {
        const https = await httpsLoaderConnectionsByDomainId({
          domainId: _id,
          ...args,
        })
        return https
      },
    },
    ssl: {
      type: sslConnection.connectionType,
      args: {
        startDate: {
          type: GraphQLDateTime,
          description: 'Start date for date filter.',
        },
        endDate: {
          type: GraphQLDateTime,
          description: 'End date for date filter.',
        },
        orderBy: {
          type: sslOrder,
          description: 'Ordering options for ssl connections.',
        },
        ...connectionArgs,
      },
      description: `Secure Socket Layer scan results.`,
      resolve: async (
        { _id },
        args,
        { loaders: { sslLoaderConnectionsByDomainId } },
      ) => {
        const ssl = await sslLoaderConnectionsByDomainId({
          domainId: _id,
          ...args,
        })
        return ssl
      },
    },
  }),
  description: `Results of HTTPS, and SSL scan on the given domain.`,
})
