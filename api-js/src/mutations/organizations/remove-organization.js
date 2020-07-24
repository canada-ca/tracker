const { GraphQLNonNull, GraphQLID, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')

const removeOrganization = new mutationWithClientMutationId({
  name: 'RemoveOrganization',
  description: 'This mutation allows the removal of unused organizations.',
  inputFields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLID),
      description: 'The gloabl id of the organization you wish you remove.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'Status string to inform the user if the organization was successfully removed.',
      resolve: async () => {},
    },
  }),
  mutateAndGetPayload: async () => {},
})

module.exports = {
  removeOrganization,
}
