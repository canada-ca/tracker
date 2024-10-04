import {GraphQLObjectType, GraphQLString} from 'graphql'

export const transferOrgOwnershipResult = new GraphQLObjectType({
  name: 'TransferOrgOwnershipResult',
  description:
    'This object is used to inform the user that they successful transferred ownership of a given organization.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Status message confirming the user transferred ownership of the org.',
      resolve: ({status}) => status,
    },
  }),
})
