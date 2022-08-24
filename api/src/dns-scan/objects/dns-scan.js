import {GraphQLObjectType, GraphQLString} from 'graphql'
import {connectionArgs, globalIdField} from 'graphql-relay'
import { GraphQLDate } from 'graphql-scalars'

import { dkimOrder, dmarcOrder, spfOrder } from '../inputs'
import { dkimConnection } from './dkim-connection'
import { dmarcConnection } from './dmarc-connection'
import { spfConnection } from './spf-connection'
import { domainType } from '../../domain/objects'
import {nodeInterface} from "../../node";

export const dnsScanType = new GraphQLObjectType({
  name: 'DNSScan',
  fields: () => ({
    id: globalIdField('dns'),
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domainId }, _, { loaders: { loadDomainByKey } }) => {
        const domain = await loadDomainByKey.load(domainId)
        domain.id = domain._key
        return domain
      },
    },
    timestamp: {
      type: GraphQLDate,
      description: `The time when the scan was initiated.`,
      resolve: ({ timestamp }) => new Date(timestamp),
    },
  }),
  interfaces: [nodeInterface],
  description: `Results of DKIM, DMARC, and SPF scans on the given domain.`,
})
