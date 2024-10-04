import {GraphQLObjectType, GraphQLString} from 'graphql'

export const verifyAccountResultType = new GraphQLObjectType({
  name: 'VerifyAccountResult',
  description:
    'This object is used to inform the user that no errors were encountered while verifying their account.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Informs the user if their account was successfully verified.',
      resolve: ({status}) => status,
    },
  }),
})
