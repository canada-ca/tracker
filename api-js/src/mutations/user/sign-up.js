const jwt = require('jsonwebtoken')
const { GraphQLNonNull, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { LanguageEnums } = require('../../enums')
const { EmailAddress } = require('../../scalars')
const { authResultType } = require('../../types')

const signUp = new mutationWithClientMutationId({
  name: 'SignUp',
  description:
    'This mutation allows for new users to sign up for our sites services.',
  inputFields: () => ({
    displayName: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The name that will be displayed to other users.',
    },
    userName: {
      type: GraphQLNonNull(EmailAddress),
      description: 'Email address that the user will use to authenticate with.',
    },
    password: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The password the user will authenticate with.',
    },
    confirmPassword: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'A secondary password field used to confirm the user entered the correct password.',
    },
    preferredLang: {
      type: GraphQLNonNull(LanguageEnums),
      description: 'The users preferred language.',
    },
    signUpToken: {
      type: GraphQLString,
      description:
        'A token sent by email, that will assign a user to an organization with a pre-determined role.',
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
  signUp,
}
