import { GraphQLObjectType, GraphQLString } from 'graphql'

export const sendPhoneCodeResultType = new GraphQLObjectType({
  name: 'SendPhoneCodeResult',
  description:
    'This object is used to inform the user that no errors were encountered while sending their phone code.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Informs the user if their phone code was successfully sent.',
      resolve: ({ status }) => status,
    },
  }),
})
