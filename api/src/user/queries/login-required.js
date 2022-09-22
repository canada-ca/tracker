import {GraphQLBoolean} from 'graphql'

export const loginRequired = {
  type: GraphQLBoolean,
  description: 'Checks if user must be logged in to access data.',
  resolve: async (_, __, {auth: {loginRequiredBool}}) => {
    return loginRequiredBool
  },
}
