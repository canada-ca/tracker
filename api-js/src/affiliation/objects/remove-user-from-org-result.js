import { GraphQLObjectType, GraphQLString } from 'graphql'

export const removeUserFromOrgResultType = new GraphQLObjectType({
  name: 'RemoveUserFromOrgResult',
  description: 'This object is used to inform the user of the removal status.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description: 'Informs the user if the user was successfully removed.',
      resolve: ({ status }) => status,
    },
  }),
})
