import { GraphQLInt, GraphQLObjectType } from 'graphql'
import {
  connectionArgs,
  connectionDefinitions,
  globalIdField,
} from 'graphql-relay'
import { GraphQLDateTime } from 'graphql-scalars'

import { domainStatus } from '../../domain'
import { Domain } from '../../scalars'
import { verifiedOrganizationConnection } from '../../verified-organizations'
import { nodeInterface } from '../../node'

export const verifiedDomainType = new GraphQLObjectType({
  name: 'VerifiedDomain',
  fields: () => ({
    id: globalIdField('verifiedDomains'),
    domain: {
      type: Domain,
      description: 'Domain that scans will be ran on.',
      resolve: ({ domain }) => domain,
    },
    lastRan: {
      type: GraphQLDateTime,
      description: 'The last time that a scan was ran on this domain.',
      resolve: ({ lastRan }) => lastRan,
    },
    status: {
      type: domainStatus,
      description: 'The domains scan status, based on the latest scan data.',
      resolve: ({ status }) => status,
    },
    organizations: {
      type: verifiedOrganizationConnection.connectionType,
      args: connectionArgs,
      description: 'The organization that this domain belongs to.',
      resolve: async (
        { _id },
        args,
        { loaders: { verifiedOrgLoaderConnectionsByDomainId } },
      ) => {
        const orgs = await verifiedOrgLoaderConnectionsByDomainId({
          domainId: _id,
          ...args,
        })
        return orgs
      },
    },
  }),
  interfaces: [nodeInterface],
  description: 'Domain object containing information for a given domain.',
})

export const verifiedDomainConnection = connectionDefinitions({
  name: 'VerifiedDomain',
  nodeType: verifiedDomainType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of verified domains.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
