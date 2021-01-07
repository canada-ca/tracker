const { GraphQLNonNull, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { t } = require('@lingui/macro')

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
      i18n,
      query,
      userKey,
      auth: { verifyToken },
      loaders: { userLoaderByKey },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse Input
    const verifyTokenString = cleanseInput(args.verifyTokenString)

    if (typeof userKey === 'undefined') {
      console.warn(
        `User attempted to verify their account, but the userKey is undefined.`,
      )
      throw new Error(i18n._(t`Unable to verify account. Please try again.`))
    }

    // Check if user exists
    const user = await userLoaderByKey.load(userKey)

    if (typeof user === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to verify account, however no account is associated with this id.`,
      )
      throw new Error(i18n._(t`Unable to verify account. Please try again.`))
    }

    // Get info from token
    const tokenParameters = verifyToken({ token: verifyTokenString })

    // Check to see if userKey exists in tokenParameters
    if (
      tokenParameters.userKey === 'undefined' ||
      typeof tokenParameters.userKey === 'undefined'
    ) {
      console.warn(
        `When validating account user: ${user._key} attempted to verify account, but userKey is not located in the token parameters.`,
      )
      throw new Error(
        i18n._(t`Unable to verify account. Please request a new email.`),
      )
    }

    // Make sure user ids match
    if (tokenParameters.userKey !== user._key) {
      console.warn(
        `User: ${user._key} attempted to verify their account, but the user id's do not match.`,
      )
      throw new Error(
        i18n._(t`Unable to verify account. Please request a new email.`),
      )
    }

    // Verify users account
    try {
      await query`
        UPSERT { _key: ${user._key} }
          INSERT { emailValidated: true, tfaSendMethod: 'email' }
          UPDATE { emailValidated: true, tfaSendMethod: 'email' }
          IN users
      `
    } catch (err) {
      console.error(
        `Database error occurred when upserting email validation for user: ${user._key}: ${err}`,
      )
      throw new Error(i18n._(t`Unable to verify account. Please try again.`))
    }

    console.info(
      `User: ${user._key} successfully email validated their account.`,
    )

    return {
      status: i18n._(
        t`Successfully email verified account, and set TFA send method to email.`,
      ),
    }
  },
})

module.exports = {
  verifyAccount,
}
