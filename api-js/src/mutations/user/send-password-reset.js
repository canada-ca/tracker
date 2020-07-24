const { GraphQLNonNull, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { EmailAddress } = require('../../scalars')

const sendPasswordResetLink = new mutationWithClientMutationId({
  name: 'SendPasswordResetLink',
  description:
    'This mutation allows a user to provide their username and request that a password reset email be sent to their account with a reset token in a url.',
  inputFields: () => ({
    userName: {
      type: GraphQLNonNull(EmailAddress),
      description:
        'User name for the account you would like to receive a password reset link for.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Informs the user if the password reset email was sent successfully.',
      resolve: async () => {},
    },
  }),
  mutateAndGetPayload: async () => {},
})

module.exports = {
  sendPasswordResetLink,
}
