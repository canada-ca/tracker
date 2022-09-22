import {GraphQLObjectType, GraphQLString} from 'graphql'

import {userSharedType} from '../../user/objects'

export const removeUserFromOrgResultType = new GraphQLObjectType({
  name: 'RemoveUserFromOrgResult',
  description: 'This object is used to inform the user of the removal status.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description: 'Informs the user if the user was successfully removed.',
      resolve: ({status}) => status,
    },
    user: {
      type: userSharedType,
      description: 'The user that was just removed.',
      resolve: ({user}) => user,
    },
  }),
})
