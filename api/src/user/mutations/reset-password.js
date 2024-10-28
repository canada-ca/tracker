import { GraphQLNonNull, GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { resetPasswordUnion } from '../unions'

const { AUTHENTICATED_KEY } = process.env

export const resetPassword = new mutationWithClientMutationId({
  name: 'ResetPassword',
  description: 'This mutation allows the user to take the token they received in their email to reset their password.',
  inputFields: () => ({
    password: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The users new password.',
    },
    confirmPassword: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'A confirmation password to confirm the new password.',
    },
    resetToken: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The JWT found in the url, redirected from the email they received.',
    },
  }),
  outputFields: () => ({
    result: {
      type: resetPasswordUnion,
      description: '`ResetPasswordUnion` returning either a `ResetPasswordResult`, or `ResetPasswordError` object.',
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
      auth: { verifyToken, bcrypt },
      loaders: { loadUserByKey },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse input
    const password = cleanseInput(args.password)
    const confirmPassword = cleanseInput(args.confirmPassword)
    const resetToken = cleanseInput(args.resetToken)

    // Check if reset token is valid
    const tokenParameters = verifyToken({ token: resetToken, secret: String(AUTHENTICATED_KEY) })

    // Check to see if user id exists in token params !!!
    if (tokenParameters.userKey === 'undefined' || typeof tokenParameters.userKey === 'undefined') {
      console.warn(
        `When resetting password user attempted to verify account, but userKey is not located in the token parameters.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Incorrect token value. Please request a new email.`),
      }
    }

    // Check if user exists
    const user = await loadUserByKey.load(tokenParameters.userKey)

    // Replace with userRequired()
    if (typeof user === 'undefined') {
      console.warn(
        `A user attempted to reset the password for ${tokenParameters.userKey}, however there is no associated account.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to reset password. Please try again.`),
      }
    }

    // Check to see if newly submitted passwords match
    if (password !== confirmPassword) {
      console.warn(
        `User: ${user._key} attempted to reset their password, however the submitted passwords do not match.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`New passwords do not match.`),
      }
    }

    // Check to see if password meets GoC requirements
    if (password.length < 12) {
      console.warn(
        `User: ${user._key} attempted to reset their password, however the submitted password is not long enough.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Password does not meet requirements.`),
      }
    }

    // Update users password in db
    const hashedPassword = bcrypt.hashSync(password, 10)

    // Setup Transaction
    const trx = await transaction(collections)

    try {
      await trx.step(
        () => query`
          WITH users
          FOR user IN users
            UPDATE ${user._key}
            WITH {
              password: ${hashedPassword},
              failedLoginAttempts: 0
            } IN users
        `,
      )
    } catch (err) {
      console.error(`Trx step error occurred when user: ${user._key} attempted to reset their password: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to reset password. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred while user: ${user._key} attempted to authenticate: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to reset password. Please try again.`))
    }

    console.info(`User: ${user._key} successfully reset their password.`)

    return {
      _type: 'regular',
      status: i18n._(t`Password was successfully reset.`),
    }
  },
})
