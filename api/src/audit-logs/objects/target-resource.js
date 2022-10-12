import { GraphQLObjectType, GraphQLString, GraphQLList } from 'graphql'
import { globalIdField } from 'graphql-relay'

export const targetResourceType = new GraphQLObjectType({
  name: 'TargetResource',
  description: '',
  fields: () => ({
    resource: {
      type: GraphQLString,
      description: 'Domain that scans will be ran on.',
      resolve: ({ resource }) => resource,
    },
    organization: {
      type: new GraphQLObjectType({
        name: 'TargetOrganization',
        description: '',
        fields: () => ({
          name: {
            type: GraphQLString,
            description: 'Domain that scans will be ran on.',
            resolve: ({ name }) => name,
          },
          id: globalIdField('organization'),
        }),
      }),
      description: 'Domain that scans will be ran on.',
      resolve: ({ organization }) => organization,
    },
    resourceType: {
      type: GraphQLString,
      description: 'Domain that scans will be ran on.',
      resolve: ({ resourceType }) => resourceType,
    },
    updatedProperties: {
      type: new GraphQLList(
        new GraphQLObjectType({
          name: 'UpdatedProperties',
          description: '',
          fields: () => ({
            name: {
              type: GraphQLString,
              description: 'Domain that scans will be ran on.',
              resolve: ({ name }) => name,
            },
            oldValue: {
              type: GraphQLString,
              description: 'Domain that scans will be ran on.',
              resolve: ({ oldValue }) => oldValue,
            },
            newValue: {
              type: GraphQLString,
              description: 'Domain that scans will be ran on.',
              resolve: ({ newValue }) => newValue,
            },
          }),
        }),
      ),
      description: 'Domain that scans will be ran on.',
      resolve: ({ updatedProperties }) => updatedProperties,
    },
  }),
})
