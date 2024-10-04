import {GraphQLObjectType, GraphQLString} from 'graphql'

export const inviteUserToOrgResultType = new GraphQLObjectType({
  name: 'InviteUserToOrgResult',
  description:
    'This object is used to inform the user of the invitation status.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Informs the user if the invite or invite email was successfully sent.',
      resolve: ({status}) => status,
    },
  }),
})
