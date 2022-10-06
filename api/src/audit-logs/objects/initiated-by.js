import { GraphQLObjectType, GraphQLString } from 'graphql'
import { globalIdField } from 'graphql-relay'

export const initiatedByType = new GraphQLObjectType({
  name: 'InitiatedBy',
  description: '',
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
      resolve: ({ userName }) => userName,
    },
    organization: {
      type: GraphQLString,
      description: 'Domain that scans will be ran on.',
      resolve: ({ userName }) => userName,
    },
  }),
})
