import { t } from '@lingui/macro'
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

import { affiliationConnection } from '../../affiliation/objects'
import { organizationSummaryType } from './organization-summary'
import { Acronym, Slug } from '../../scalars'
import { nodeInterface } from '../../node'
import { domainConnection } from '../../domain/objects'

export const organizationType = new GraphQLObjectType({
  name: 'Organization',
  fields: () => ({
    id: globalIdField('organizations'),
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
      type: domainConnection.connectionType,
      description: 'The domains which are associated with this organization.',
      args: {
        ownership: {
          type: GraphQLBoolean,
          description:
            'Limit domains to those that belong to an organization that has ownership.',
        },
        ...connectionArgs,
      },
      resolve: async (
        { _id },
        args,
        { loaders: { domainLoaderConnectionsByOrgId } },
      ) => {
        const connections = await domainLoaderConnectionsByOrgId({
          orgId: _id,
          ...args,
        })
        return connections
      },
    },
    affiliations: {
      type: affiliationConnection.connectionType,
      description: 'Organization affiliations to various users.',
      args: connectionArgs,
      resolve: async (
        { _id },
        args,
        {
          i18n,
          auth: { checkPermission },
          loaders: { affiliationLoaderByOrgId },
        },
      ) => {
        const permission = await checkPermission({ orgId: _id })
        if (permission === 'admin' || permission === 'super_admin') {
          const affiliations = await affiliationLoaderByOrgId({
            orgId: _id,
            ...args,
          })
          return affiliations
        }
        throw new Error(
          i18n._(
            t`Cannot query affiliations on organization without admin permission or higher.`,
          ),
        )
      },
    },
  }),
  interfaces: [nodeInterface],
  description:
    'Organization object containing information for a given Organization.',
})

export const organizationConnection = connectionDefinitions({
  name: 'Organization',
  nodeType: organizationType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of organizations the user has access to.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
