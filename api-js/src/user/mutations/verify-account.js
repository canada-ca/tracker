import { GraphQLNonNull, GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { verifyAccountUnion } from '../unions'

export const verifyAccount = new mutationWithClientMutationId({
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
    result: {
      type: verifyAccountUnion,
      description:
        '`VerifyAccountUnion` returning either a `VerifyAccountResult`, or `VerifyAccountError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      query,
      auth: { verifyToken },
      loaders: { loadUserByKey },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse Input
    const verifyTokenString = cleanseInput(args.verifyTokenString)

    // Get info from token
    const tokenParameters = verifyToken({ token: verifyTokenString })

    // Check to see if userKey exists in tokenParameters
    if (
      tokenParameters.userKey === 'undefined' ||
      typeof tokenParameters.userKey === 'undefined'
    ) {
      console.warn(
        `When validating account, user attempted to verify account, but userKey is not located in the token parameters.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(
          t`Unable to verify account. Please request a new email.`,
        ),
      }
    }

    // Auth shouldn't be needed with this
    // Check if user exists
    const { userKey } = tokenParameters
    const user = await loadUserByKey.load(userKey)

    if (typeof user === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to verify account, however no account is associated with this id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(
          t`Unable to verify account. Please request a new email.`,
        ),
      }
    }

    // Make sure user ids match
    if (tokenParameters.userKey !== user._key) {
      console.warn(
        `User: ${user._key} attempted to verify their account, but the user id's do not match.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(
          t`Unable to verify account. Please request a new email.`,
        ),
      }
    }

    // Verify users account
    try {
      await query`
        WITH users
        UPSERT { _key: ${user._key} }
          INSERT { emailValidated: true }
          UPDATE { emailValidated: true }
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
      _type: 'success',
      status: i18n._(
        t`Successfully email verified account, and set TFA send method to email.`,
      ),
    }
  },
})
