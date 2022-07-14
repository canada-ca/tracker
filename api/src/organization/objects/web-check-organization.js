import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import { globalIdField } from 'graphql-relay'
import { domainTag } from '../../domain/objects'
import { Acronym, Domain, Slug } from '../../scalars'

export const tagType = new GraphQLObjectType({
  name: 'TagConnection',
  fields: () => ({
    edges: {
      type: new GraphQLList(domainTag),
      description: 'List of tags assigned to the domain.',
      resolve: ({ edges }) => edges,
    },
    totalCount: {
      type: GraphQLInt,
      description: 'Total number of tags assigned to domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})

export const webCheckType = new GraphQLObjectType({
  name: 'WebCheckOrg',
  fields: () => ({
    id: globalIdField('organization'),
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
    verified: {
      type: GraphQLBoolean,
      description: 'Whether the organization is a verified organization.',
      resolve: ({ verified }) => verified,
    },
    tags: {
      type: tagType,
      description: 'List of tags assigned to domains within the organization.',
      resolve: async (
        { _id },
        args,
        { loaders: { loadDomainTagsByOrgId } },
      ) => {
        const orgTags = await loadDomainTagsByOrgId({
          orgId: _id,
          ...args,
        })
        return orgTags
      },
    },
    domains: {
      type: new GraphQLObjectType({
        name: 'WebCheckDomainConnection',
        fields: () => ({
          edges: {
            type: new GraphQLList(
              new GraphQLObjectType({
                name: 'WebCheckDomain',
                fields: () => ({
                  id: globalIdField('domain'),
                  domain: {
                    type: Domain,
                    description: 'Domain that scans will be ran on.',
                    resolve: ({ domain }) => domain,
                  },
                  lastRan: {
                    type: GraphQLString,
                    description:
                      'The last time that a scan was ran on this domain.',
                    resolve: ({ lastRan }) => lastRan,
                  },
                  tags: {
                    type: tagType,
                    description:
                      'Vulnerabilities that the domain has tested positive for.',
                    resolve: async ({ tags }, _) => {
                      return {
                        edges: tags,
                        totalCount: tags.length,
                      }
                    },
                  },
                }),
              }),
            ),
          },
          totalCount: {
            type: GraphQLInt,
            description: 'The total amount of domains with vulnerability tags',
            resolve: ({ totalCount }) => totalCount,
          },
        }),
      }),
    },
  }),
})
