import {GraphQLBoolean, GraphQLList, GraphQLObjectType, GraphQLString} from 'graphql'
import {globalIdField} from 'graphql-relay'
import {GraphQLDate, GraphQLJSONObject} from 'graphql-scalars'

import {domainType} from '../../domain/objects'
import {nodeInterface} from "../../node";

export const dnsScanType = new GraphQLObjectType({
  name: 'DNSScan',
  fields: () => ({
    id: globalIdField('dns'),
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({domainId}, _, {loaders: {loadDomainByKey}}) => {
        const domain = await loadDomainByKey.load(domainId)
        domain.id = domain._key
        return domain
      },
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
      description: `Whether or not there are DNS records for the domain scanned.`
    },
    resolveChain: {
      type: GraphQLList(GraphQLList(GraphQLString)),
      description: `The chain CNAME/IP addresses for the domain.`
    },
    cnameRecord: {
      type: GraphQLString,
      description: `The CNAME for the domain (if it exists).`
    },
    mxRecords: {
      type: GraphQLJSONObject,
      description: `The MX records for the domain (if they exist).`
    },
    nsRecords: {
      type: GraphQLJSONObject,
      description: `The NS records for the domain.`
    },
    dmarc: {
      type: GraphQLJSONObject,
      description: `The DMARC scan results for the domain.`
    },
    spf: {
      type: GraphQLJSONObject,
      description: `The SPF scan results for the domain.`
    },
    dkim: {
      type: GraphQLJSONObject,
      description: `The SKIM scan results for the domain.`
    }
  }),
  interfaces: [nodeInterface],
  description: `Results of DKIM, DMARC, and SPF scans on the given domain.`,
})
