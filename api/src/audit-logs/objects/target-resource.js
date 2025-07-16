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
      resolve: async ({ resource, resourceType }, _, { language }) => {
        if (resourceType === 'organization') {
          return resource[`${language}`]
        }
        return resource
      },
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
      description: 'Type of resource that was modified: user, domain, or organization.',
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
              resolve: ({ name, oldValue }) => {
                if (name === 'selectors' || name === 'tags') {
                  return JSON.stringify(oldValue)
                }
                return oldValue
              },
            },
            newValue: {
              type: GraphQLString,
              description: 'New value of updated property.',
              resolve: ({ name, newValue }) => {
                if (name === 'selectors' || name === 'tags') {
                  return JSON.stringify(newValue)
                }
                return newValue
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
