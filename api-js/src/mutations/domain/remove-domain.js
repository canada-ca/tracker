const { GraphQLNonNull, GraphQLID, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')

const removeDomain = new mutationWithClientMutationId({
  name: 'RemoveDomain',
  description: 'This mutation allows the removal of unused domains.',
  inputFields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLID),
      description: 'The global id of this domain.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Status string to inform the user is the domain was successfully removed.',
      resolve: async (payload) => {},
    },
  }),
  mutateAndGetPayload: async () => {},
})

module.exports = {
  removeDomain,
}
