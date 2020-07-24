const { GraphQLNonNull, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { EmailAddress } = require('../../scalars')
const { authResultType } = require('../../types')

const authenticate = new mutationWithClientMutationId({
  name: 'Authenticate',
  description:
    'This mutation allows users to give their credentials and retrieve a token that gives them access to restricted content.',
  inputFields: () => ({
    userName: {
      type: GraphQLNonNull(EmailAddress),
      description: 'The email the user signed up with.',
    },
    password: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The password the user signed up with.',
    },
  }),
  outputFields: () => ({
    authResult: {
      type: authResultType,
      description: 'The authenticated users information, and JWT.',
      resolve: async () => {},
    },
  }),
  mutateAndGetPayload: async () => {},
})

module.exports = {
  authenticate,
}
