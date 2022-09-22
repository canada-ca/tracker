import {GraphQLBoolean, GraphQLList, GraphQLObjectType, GraphQLString} from 'graphql'
import {globalIdField} from 'graphql-relay'
import {GraphQLDate, GraphQLJSONObject} from 'graphql-scalars'

import {nodeInterface} from "../../node"
import {dmarcType} from "./dmarc"
import {spfType} from "./spf"
import {dkimType} from "./dkim"

export const dnsScanType = new GraphQLObjectType({
  name: 'DNSScan',
  fields: () => ({
    id: globalIdField('dns'),
    domain: {
      type: GraphQLString,
      description: `The domain the scan was ran on.`,
      resolve: async ({domain}) => domain,
    },
    timestamp: {
      type: GraphQLDate,
      description: `The time when the scan was initiated.`,
      resolve: ({timestamp}) => new Date(timestamp),
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
      type: GraphQLJSONObject,
      description: `The MX records for the domain (if they exist).`,
    },
    nsRecords: {
      type: GraphQLJSONObject,
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
