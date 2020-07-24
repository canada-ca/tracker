const { GraphQLString, GraphQLNonNull } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { EmailAddress } = require('../../scalars')

const sendEmailVerification = new mutationWithClientMutationId({
  name: 'SendEmailVerification',
  description:
    'This mutation is used for re-sending a verification email if it failed during user creation.',
  inputFields: () => ({
    userName: {
      type: GraphQLNonNull(EmailAddress),
      description:
        'The users email address used for sending the verification email.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description: 'Informs the user if the email was sent successfully.',
      resolve: async () => {},
    },
  }),
  mutateAndGetPayload: async () => {},
})

module.exports = {
  sendEmailVerification,
}
