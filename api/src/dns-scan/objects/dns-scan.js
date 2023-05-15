import { GraphQLBoolean, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql'
import { globalIdField } from 'graphql-relay'
import { GraphQLDateTime } from 'graphql-scalars'

import { nodeInterface } from '../../node'
import { dmarcType } from './dmarc'
import { spfType } from './spf'
import { dkimType } from './dkim'

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
      type: GraphQLList(GraphQLList(GraphQLString)),
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

export const mxHostType = new GraphQLObjectType({
  name: 'MXHost',
  fields: () => ({
    preference: {
      type: GraphQLInt,
      description: `The preference (or priority) of the host.`,
    },
    hostname: {
      type: GraphQLString,
      description: `The hostname of the given host.`,
    },
    addresses: {
      type: GraphQLList(GraphQLString),
      description: `The IP addresses for the given host.`,
    },
  }),
  description: `Hosts listed in the domain's MX record.`,
})

export const mxRecordType = new GraphQLObjectType({
  name: 'MXRecord',
  fields: () => ({
    hosts: {
      type: GraphQLList(mxHostType),
      description: `Hosts listed in the domain's MX record.`,
    },
    warnings: {
      type: GraphQLList(GraphQLString),
      description: `Additional warning info about the MX record.`,
    },
  }),
})

export const nsRecordType = new GraphQLObjectType({
  name: 'NSRecord',
  fields: () => ({
    hostnames: {
      type: GraphQLList(GraphQLString),
      description: `Hostnames for the nameservers for the domain.`,
    },
    warnings: {
      type: GraphQLList(GraphQLString),
      description: `Additional warning info about the NS record.`,
    },
  }),
})
