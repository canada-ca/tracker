import { GraphQLNonNull, GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { verifyAccountUnion } from '../unions'

export const verifyAccount = new mutationWithClientMutationId({
  name: 'VerifyAccount',
  description:
    'This mutation allows the user to switch usernames/verify their account through a token sent in an email.',
  inputFields: () => ({
    verifyTokenString: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Token sent via email, and located in url.',
    },
  }),
  outputFields: () => ({
    result: {
      type: verifyAccountUnion,
      description: '`VerifyAccountUnion` returning either a `VerifyAccountResult`, or `VerifyAccountError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      query,
      collections,
      transaction,
      auth: { verifyToken },
      loaders: { loadUserByKey, loadUserByUserName },
      notify: { sendUpdatedUserNameEmail },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse Input
    const verifyTokenString = cleanseInput(args.verifyTokenString)

    // Get info from token
    const tokenParameters = verifyToken({ token: verifyTokenString })

    // Check to see if userKey exists in tokenParameters
    if (!tokenParameters?.userKey) {
      console.warn(
        `When validating account, user attempted to verify account, but userKey is not located in the token parameters.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to verify account. Please request a new email.`),
      }
    }

    // Check to see if userName exists in tokenParameters
    if (!tokenParameters?.userName) {
      console.warn(
        `When validating account, user attempted to verify account, but userName is not located in the token parameters.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to verify account. Please request a new email.`),
      }
    }

    // Auth shouldn't be needed with this
    // Check if user exists
    const { userKey, userName: newUserName } = tokenParameters
    const user = await loadUserByKey.load(userKey)

    if (typeof user === 'undefined') {
      console.warn(`User: ${userKey} attempted to verify account, however no account is associated with this id.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to verify account. Please request a new email.`),
      }
    }

    // Ensure newUserName is still not already in use
    const checkUser = await loadUserByUserName.load(newUserName)
    if (typeof checkUser !== 'undefined') {
      console.warn(`User: ${userKey} attempted to update their username, but the username is already in use.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Username not available, please try another.`),
      }
    }

    // Send email to current email address
    try {
      await sendUpdatedUserNameEmail({
        previousUserName: user.userName,
        newUserName,
        displayName: user.displayName,
        userKey,
      })
    } catch (err) {
      console.error(`Error occurred when sending updated username email for ${userKey}: ${err}`)
      throw new Error(i18n._(t`Unable to send updated username email. Please try again.`))
    }

    // Setup Transaction
    const trx = await transaction(collections)

    // Verify users account
    try {
      await trx.step(
        () => query`
          WITH users
          UPSERT { _key: ${user._key} }
            INSERT {
              emailValidated: true,
              userName: ${newUserName},
            }
            UPDATE {
              emailValidated: true,
              userName: ${newUserName},
            }
            IN users
        `,
      )
    } catch (err) {
      console.error(`Trx step error occurred when upserting email validation for user: ${user._key}: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to verify account. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred when upserting email validation for user: ${user._key}: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to verify account. Please try again.`))
    }

    console.info(`User: ${user._key} successfully email validated their account.`)

    return {
      _type: 'success',
      status: i18n._(t`Successfully email verified account.`),
    }
  },
})
