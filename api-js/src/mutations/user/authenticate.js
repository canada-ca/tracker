const { GraphQLNonNull, GraphQLString, GraphQLInt } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { authResultType } = require('../../types')

const { SIGN_IN_KEY } = process.env

const authenticate = new mutationWithClientMutationId({
  name: 'Authenticate',
  description:
    'This mutation allows users to give their credentials and retrieve a token that gives them access to restricted content.',
  inputFields: () => ({
    authenticationCode: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'Security code found in text msg, or email inbox.',
    },
    authenticateToken: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The JWT that is retrieved from the sign in mutation.',
    },
  }),
  outputFields: () => ({
    authResult: {
      type: authResultType,
      description: 'The authenticated users information, and JWT.',
      resolve: async (payload) => {
        return payload.authResult
      },
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      query,
      auth: { tokenize, verifyToken },
      loaders: { userLoaderById },
      functions: { cleanseInput },
    },
  ) => {
    // Cleanse Inputs
    const authenticationCode = args.authenticationCode
    const authenticationToken = cleanseInput(args.authenticateToken)

    // Gather token parameters
    const tokenParameters = verifyToken({ token: authenticationToken, secret: String(SIGN_IN_KEY) })

    if (tokenParameters.userId === 'undefined' || typeof tokenParameters.userId === 'undefined') {
      console.warn(`Authentication token does not contain the userId`)
      throw new Error('Unable to authenticate. Please try again.')
    }

    // Gather sign in user
    const user = await userLoaderById.load(tokenParameters.userId)

    if (typeof user === 'undefined') {
      console.warn(
        `User: ${tokenParameters.userId} attempted to authenticate, no account is associated with this id.`,
      )
      throw new Error('Unable to authenticate. Please try again.')
    }

    // Check to see if security token matches the user submitted one
    if (authenticationCode === user.tfaCode) {
      const token = tokenize({ parameters: { userId: user._key } })

      // Reset Failed Login attempts
      try {
        await query`
                FOR u IN users
                  UPDATE ${user._key} WITH { tfaCode: null } IN users
              `
      } catch (err) {
        console.error(
          `Database error ocurred when resetting failed attempts for user: ${user._key} during authentication: ${err}`,
        )
        throw new Error('Unable to authenticate. Please try again.')
      }

      console.info(
        `User: ${user._key} successfully authenticated their account.`,
      )
      user.id = user._key

      return {
        authResult: {
          token,
          user,
        },
      }
    } else {
      console.warn(`User: ${user._key} attempted to authenticate their account, however the tfaCodes did not match.`)
      throw new Error('Unable to authenticate. Please try again.')
    }
  },
})

module.exports = {
  authenticate,
}
