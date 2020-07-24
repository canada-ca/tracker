const { GraphQLNonNull, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')

const resetPassword = new mutationWithClientMutationId({
  name: 'ResetPassword',
  description:
    'This mutation allows the user to take the token they recieved in their email to reset their password.',
  inputFields: () => ({
    password: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The users new password.',
    },
    confirmPassword: {
      type: GraphQLNonNull(GraphQLString),
      description: 'A confirmation password to confirm the new password.',
    },
    resetToken: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The JWT found in the url, redirected from the email they recieved.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Informs the user if the password reset was successful, and to redirect to sign in page.',
      resolve: async () => {},
    },
  }),
  mutateAndGetPayload: async () => {},
})

module.exports = {
  resetPassword,
}
