const { GraphQLNonNull, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { GraphQLEmailAddress } = require('graphql-scalars')

const generateOtpUrl = new mutationWithClientMutationId({
  name: 'GenerateOtpUrl',
  inputFields: () => ({
    userName: {
      type: GraphQLNonNull(GraphQLEmailAddress),
      description: 'The users username who is requesting an otp url.',
    },
  }),
  outputFields: () => ({
    otpUrl: {
      type: GraphQLString,
      description: 'The generated OTP url.',
      resolve: async () => {},
    },
  }),
  description: 'A mutation used to generate an OTP URL used for tfa.',
  mutateAndGetPayload: async () => {},
})

module.exports = {
  generateOtpUrl,
}
