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
      resolve: async (payload) => {
        return payload.status
      },
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      query,
      userId,
      auth: { verifyToken },
      loaders: { userLoaderById },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse Input
    const verifyTokenString = cleanseInput(args.verifyTokenString)

    if (typeof userId === 'undefined') {
      console.warn(
        `User attempted to verify their account, but the userId is undefined.`,
      )
      throw new Error('Unable to verify account. Please try again.')
    }

    // Check if user exists
    const user = await userLoaderById.load(userId)

    if (typeof user === 'undefined') {
      console.warn(
        `User: ${userId} attempted to verify account, however no account is associated with this id.`,
      )
      throw new Error('Unable to verify account. Please try again.')
    }

    // Get info from token
    const tokenParameters = verifyToken({ token: verifyTokenString })

    // Check to see if userId exists in tokenParameters
    if (
      tokenParameters.userId === 'undefined' ||
      typeof tokenParameters.userId === 'undefined'
    ) {
      console.warn(
        `When validating account user: ${user._key} attempted to verify account, but userId is not located in the token parameters.`,
      )
      throw new Error('Unable to verify account. Please request a new email.')
    }

    // Make sure user ids match
    if (tokenParameters.userId !== user._key) {
      console.warn(
        `User: ${user._key} attempted to verify their account, but the user id's do not match.`,
      )
      throw new Error('Unable to verify account. Please request a new email.')
    }

    // Verify users account
    try {
      await query`
        UPSERT { _key: ${user._key} }
          INSERT { emailValidated: true }
          UPDATE { emailValidated: true }
          IN users
      `
    } catch (err) {
      console.error(
        `Database error occurred when upserting email validation for user: ${user._key}: ${err}`,
      )
      throw new Error('Unable to verify account. Please try again.')
    }

    console.info(
      `User: ${user._key} successfully email validated their account.`,
    )

    return {
      status: 'Successfully verified account.',
    }
  },
})

module.exports = {
  verifyAccount,
}
