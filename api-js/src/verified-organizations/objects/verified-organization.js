import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import {
  connectionArgs,
  connectionDefinitions,
  globalIdField,
} from 'graphql-relay'

import { verifiedDomainConnection } from '../../verified-domains/objects'
import { organizationSummaryType } from '../../organization/objects'
import { Acronym, Slug } from '../../scalars'
import { nodeInterface } from '../../node'

export const verifiedOrganizationType = new GraphQLObjectType({
  name: 'VerifiedOrganization',
  fields: () => ({
    id: globalIdField('verifiedOrganizations'),
    acronym: {
      type: Acronym,
      description: 'The organizations acronym.',
      resolve: ({ acronym }) => acronym,
    },
    name: {
      type: GraphQLString,
      description: 'The full name of the organization.',
      resolve: ({ name }) => name,
    },
    slug: {
      type: Slug,
      description: 'Slugified name of the organization.',
      resolve: ({ slug }) => slug,
    },
    zone: {
      type: GraphQLString,
      description: 'The zone which the organization belongs to.',
      resolve: ({ zone }) => zone,
    },
    sector: {
      type: GraphQLString,
      description: 'The sector which the organization belongs to.',
      resolve: ({ sector }) => sector,
    },
    country: {
      type: GraphQLString,
      description: 'The country in which the organization resides.',
      resolve: ({ country }) => country,
    },
    province: {
      type: GraphQLString,
      description: 'The province in which the organization resides.',
      resolve: ({ province }) => province,
    },
    city: {
      type: GraphQLString,
      description: 'The city in which the organization resides.',
      resolve: ({ city }) => city,
    },
    verified: {
      type: GraphQLBoolean,
      description: 'Wether the organization is a verified organization.',
      resolve: ({ verified }) => verified,
    },
    summaries: {
      type: organizationSummaryType,
      description:
        'Summaries based on scan types that are preformed on the given organizations domains.',
      resolve: ({ summaries }) => summaries,
    },
    domainCount: {
      type: GraphQLInt,
      description: 'The number of domains associated with this organization.',
      resolve: ({ domainCount }) => domainCount,
    },
    domains: {
      type: verifiedDomainConnection.connectionType,
      description: 'The domains which are associated with this organization.',
      args: connectionArgs,
      resolve: async (
        { _id },
        args,
        { loaders: { verifiedDomainLoaderConnectionsByOrgId } },
      ) => {
        const domains = await verifiedDomainLoaderConnectionsByOrgId({
          orgId: _id,
          ...args,
        })
        return domains
      },
    },
  }),
  interfaces: [nodeInterface],
  description:
    'Verified Organization object containing information for a given Organization.',
})

export const verifiedOrganizationConnection = connectionDefinitions({
  name: 'VerifiedOrganization',
  nodeType: verifiedOrganizationType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of verified organizations.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
