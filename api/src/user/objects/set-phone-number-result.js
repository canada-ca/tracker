import {GraphQLObjectType, GraphQLString} from 'graphql'
import {userPersonalType} from './user-personal'

export const setPhoneNumberResultType = new GraphQLObjectType({
  name: 'SetPhoneNumberResult',
  description:
    'This object is used to inform the user that no errors were encountered while setting a new phone number.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Informs the user if their phone code was successfully sent.',
      resolve: ({status}) => status,
    },
    user: {
      type: userPersonalType,
      description: 'The user who set their phone number.',
      resolve: ({user}) => user,
    },
  }),
})
