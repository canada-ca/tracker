import {GraphQLObjectType, GraphQLString} from 'graphql'

export const closeAccountResult = new GraphQLObjectType({
  name: 'CloseAccountResult',
  description:
    'This object is used to inform the user of the status of closing their account.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description: 'Status of closing the users account.',
      resolve: ({status}) => status,
    },
  }),
})
