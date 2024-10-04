import {GraphQLObjectType, GraphQLString} from 'graphql'

export const removePhoneNumberResultType = new GraphQLObjectType({
  name: 'RemovePhoneNumberResult',
  description:
    'This object is used to inform the user that no errors were encountered while removing their phone number.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Informs the user if the phone number removal was successful.',
      resolve: ({status}) => status,
    },
  }),
})
