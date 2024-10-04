import { GraphQLBoolean, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql'
import { globalIdField } from 'graphql-relay'
import { GraphQLDateTime } from 'graphql-scalars'

import { nodeInterface } from '../../node'
import { dmarcType } from './dmarc'
import { spfType } from './spf'
import { dkimType } from './dkim'
import { mxRecordType } from './mx-record'

export const dnsScanType = new GraphQLObjectType({
  name: 'DNSScan',
  fields: () => ({
    id: globalIdField('dns'),
    domain: {
      type: GraphQLString,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domain }) => domain,
    },
    timestamp: {
      type: GraphQLDateTime,
      description: `The time when the scan was initiated.`,
      resolve: ({ timestamp }) => new Date(timestamp),
    },
    baseDomain: {
      type: GraphQLString,
      description: `String of the base domain the scan was run on.`,
    },
    recordExists: {
      type: GraphQLBoolean,
      description: `Whether or not there are DNS records for the domain scanned.`,
    },
    resolveChain: {
      type: new GraphQLList(new GraphQLList(GraphQLString)),
      description: `The chain CNAME/IP addresses for the domain.`,
    },
    cnameRecord: {
      type: GraphQLString,
      description: `The CNAME for the domain (if it exists).`,
    },
    mxRecords: {
      type: mxRecordType,
      description: `The MX records for the domain (if they exist).`,
    },
    nsRecords: {
      type: nsRecordType,
      description: `The NS records for the domain.`,
    },
    dmarc: {
      type: dmarcType,
      description: `The DMARC scan results for the domain.`,
    },
    spf: {
      type: spfType,
      description: `The SPF scan results for the domain.`,
    },
    dkim: {
      type: dkimType,
      description: `The SKIM scan results for the domain.`,
    },
  }),
  interfaces: [nodeInterface],
  description: `Results of DKIM, DMARC, and SPF scans on the given domain.`,
})

export const nsRecordType = new GraphQLObjectType({
  name: 'NSRecord',
  fields: () => ({
    hostnames: {
      type: new GraphQLList(GraphQLString),
      description: `Hostnames for the nameservers for the domain.`,
    },
    warnings: {
      type: new GraphQLList(GraphQLString),
      description: `Additional warning info about the NS record.`,
    },
    error: {
      type: GraphQLString,
      description: `Error message if the NS record could not be retrieved.`,
    },
  }),
})
