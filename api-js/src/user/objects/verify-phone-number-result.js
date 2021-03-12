import { GraphQLObjectType, GraphQLString } from 'graphql'

export const verifyPhoneNumberResultType = new GraphQLObjectType({
  name: 'VerifyPhoneNumberResult',
  description:
    'This object is used to inform the user that no errors were encountered while verifying their phone number.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Informs the user if their phone number was successfully verified.',
      resolve: ({ status }) => status,
    },
  }),
})
