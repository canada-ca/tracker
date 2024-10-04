import {GraphQLObjectType, GraphQLString} from 'graphql'

export const updateUserPasswordResultType = new GraphQLObjectType({
  name: 'UpdateUserPasswordResultType',
  description:
    'This object is used to inform the user that no errors were encountered while updating their password.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Informs the user if their password was successfully updated.',
      resolve: ({status}) => status,
    },
  }),
})
