import { GraphQLObjectType, GraphQLString } from 'graphql'

import { userPersonalType } from './user-personal'

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
    user: {
      type: userPersonalType,
      description: 'The user who verified their phone number.',
      resolve: ({ user }) => user,
    },
  }),
})
