import { GraphQLObjectType } from 'graphql'
import { connectionArgs } from 'graphql-relay'
import { GraphQLDate } from 'graphql-scalars'

import { dkimOrder, dmarcOrder, spfOrder } from '../inputs'
import { dkimConnection } from './dkim-connection'
import { dmarcConnection } from './dmarc-connection'
import { spfConnection } from './spf-connection'
import { domainType } from '../../domain/objects'

export const emailScanType = new GraphQLObjectType({
  name: 'EmailScan',
  fields: () => ({
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ _key }, _, { loaders: { loadDomainByKey } }) => {
        const domain = await loadDomainByKey.load(_key)
        domain.id = domain._key
        return domain
      },
    },
    dkim: {
      type: dkimConnection.connectionType,
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
          type: dkimOrder,
          description: 'Ordering options for dkim connections.',
        },
        ...connectionArgs,
      },
      description: `DomainKeys Identified Mail (DKIM) Signatures scan results.`,
      resolve: async (
        { _id },
        args,
        { loaders: { loadDkimConnectionsByDomainId } },
      ) => {
        const dkim = await loadDkimConnectionsByDomainId({
          domainId: _id,
          ...args,
        })
        return dkim
      },
    },
    dmarc: {
      type: dmarcConnection.connectionType,
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
          type: dmarcOrder,
          description: 'Ordering options for dmarc connections.',
        },
        ...connectionArgs,
      },
      description: `Domain-based Message Authentication, Reporting, and Conformance (DMARC) scan results.`,
      resolve: async (
        { _id },
        args,
        { loaders: { loadDmarcConnectionsByDomainId } },
      ) => {
        const dmarc = await loadDmarcConnectionsByDomainId({
          domainId: _id,
          ...args,
        })
        return dmarc
      },
    },
    spf: {
      type: spfConnection.connectionType,
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
          type: spfOrder,
          description: 'Ordering options for spf connections.',
        },
        ...connectionArgs,
      },
      description: `Sender Policy Framework (SPF) scan results.`,
      resolve: async (
        { _id },
        args,
        { loaders: { loadSpfConnectionsByDomainId } },
      ) => {
        const spf = await loadSpfConnectionsByDomainId({
          domainId: _id,
          ...args,
        })
        return spf
      },
    },
  }),
  description: `Results of DKIM, DMARC, and SPF scans on the given domain.`,
})
