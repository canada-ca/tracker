import { GraphQLObjectType, GraphQLString } from 'graphql'

export const leaveOrganizationResultType = new GraphQLObjectType({
  name: 'LeaveOrganizationResult',
  description:
    'This object is used to inform the user that they successful left a given organization.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description: 'Status message confirming the user left the org.',
      resolve: ({ status }) => status,
    },
  }),
})
