import { GraphQLObjectType, GraphQLString, GraphQLList } from 'graphql'
import { globalIdField } from 'graphql-relay'
import { ResourceTypeEnums } from '../../enums/resource-type'

export const targetResourceType = new GraphQLObjectType({
  name: 'TargetResource',
  description: 'Resource that was the target of a specified action by a user.',
  fields: () => ({
    resource: {
      type: GraphQLString,
      description: 'Name of the targeted resource.',
      resolve: ({ resource }) => resource,
    },
    organization: {
      type: new GraphQLObjectType({
        name: 'TargetOrganization',
        description: 'Organization that the resource is affiliated with.',
        fields: () => ({
          id: globalIdField('organization'),
          name: {
            type: GraphQLString,
            description: 'Name of the affiliated organization.',
            resolve: async ({ id, name }, _, { loaders: { loadOrgByKey } }) => {
              const org = await loadOrgByKey.load(id)
              if (typeof org === 'undefined') {
                return name
              }
              return org.name
            },
          },
        }),
      }),
      description: 'Organization that the resource is affiliated with.',
      resolve: ({ organization }) => organization,
    },
    resourceType: {
      type: ResourceTypeEnums,
      description:
        'Type of resource that was modified: user, domain, or organization.',
      resolve: ({ resourceType }) => resourceType,
    },
    updatedProperties: {
      type: new GraphQLList(
        new GraphQLObjectType({
          name: 'UpdatedProperties',
          description: 'Object describing how a resource property was updated.',
          fields: () => ({
            name: {
              type: GraphQLString,
              description: 'Name of updated resource.',
              resolve: ({ name }) => name,
            },
            oldValue: {
              type: GraphQLString,
              description: 'Old value of updated property.',
              resolve: ({ oldValue }) => {
                if (Array.isArray(oldValue)) {
                  return JSON.stringify(oldValue)
                }
                return oldValue
              },
            },
            newValue: {
              type: GraphQLString,
              description: 'New value of updated property.',
              resolve: ({ newValue }) => {
                if (Array.isArray(newValue)) {
                  return JSON.stringify(newValue)
                } else return newValue
              },
            },
          }),
        }),
      ),
      description: 'List of resource properties that were modified.',
      resolve: ({ updatedProperties }) => updatedProperties,
    },
  }),
})
