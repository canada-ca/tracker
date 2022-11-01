import { GraphQLInputObjectType, GraphQLList } from 'graphql'
import { ResourceTypeEnums } from '../../enums/resource-type'
import { UserActionEnums } from '../../enums/user-action'

export const logFilters = new GraphQLInputObjectType({
  name: 'LogFilters',
  description: 'Filtering options for audit logs.',
  fields: () => ({
    resource: {
      type: new GraphQLList(ResourceTypeEnums),
      description: 'List of resource types to include when returning logs.',
    },
    action: {
      type: new GraphQLList(UserActionEnums),
      description: 'List of user actions to include when returning logs.',
    },
  }),
})
