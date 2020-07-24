const { GraphQLNonNull, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')

const verifyAccount = new mutationWithClientMutationId({
  name: 'VerifyAccount',
  description:
    'This mutation allows the user to verify their account through a token sent in an email.',
  inputFields: () => ({
    verifyTokenString: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Token sent via email, and located in url.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description: 'Informs user if account was successfully verified.',
      resolve: async () => {},
    },
  }),
  mutateAndGetPayload: async () => {},
})

module.exports = {
  verifyAccount,
}
