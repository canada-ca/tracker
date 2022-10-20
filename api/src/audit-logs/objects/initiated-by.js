import { GraphQLObjectType, GraphQLString } from 'graphql'
import { globalIdField } from 'graphql-relay'

export const initiatedByType = new GraphQLObjectType({
  name: 'InitiatedBy',
  description: 'Information on the user that initiated the logged action',
  fields: () => ({
    id: globalIdField('user'),
    userName: {
      type: GraphQLString,
      description: 'Domain that scans will be ran on.',
      resolve: ({ userName }) => userName,
    },
    role: {
      type: GraphQLString,
      description: 'Domain that scans will be ran on.',
      resolve: ({ role }) => role,
    },
    organization: {
      type: GraphQLString,
      description: 'Domain that scans will be ran on.',
      resolve: ({ organization }) => organization,
    },
  }),
})
