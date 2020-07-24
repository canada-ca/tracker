const { GraphQLString, GraphQLNonNull } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')

const updateUserPassword = new mutationWithClientMutationId({
  name: 'UpdateUserPassword',
  description:
    'This mutation allows the user to update their account password.',
  inputFields: () => ({
    currentPassword: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The users current password to verify it is the current user.',
    },
    updatedPassword: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The new password the user wishes to change to.',
    },
    updatedPasswordConfirm: {
      type: GraphQLNonNull(GraphQLString),
      description: 'A password confirmation of their new password.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description: 'The status if the user profile update was successful.',
      resolve: async () => {},
    },
  }),
  mutateAndGetPayload: async () => {},
})

module.exports = {
  updateUserPassword,
}
