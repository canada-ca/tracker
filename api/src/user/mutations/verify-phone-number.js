import { GraphQLNonNull, GraphQLInt } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { verifyPhoneNumberUnion } from '../unions'

export const verifyPhoneNumber = new mutationWithClientMutationId({
  name: 'verifyPhoneNumber',
  description: 'This mutation allows the user to two factor authenticate.',
  inputFields: () => ({
    twoFactorCode: {
      type: new GraphQLNonNull(GraphQLInt),
      description: 'The two factor code that was received via text message.',
    },
  }),
  outputFields: () => ({
    result: {
      type: verifyPhoneNumberUnion,
      description:
        '`VerifyPhoneNumberUnion` returning either a `VerifyPhoneNumberResult`, or `VerifyPhoneNumberError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    { i18n, userKey, query, collections, transaction, auth: { userRequired }, loaders: { loadUserByKey } },
  ) => {
    // Cleanse Input
    const twoFactorCode = args.twoFactorCode

    // Get User From DB
    const user = await userRequired()

    if (twoFactorCode.toString().length !== 6) {
      console.warn(
        `User: ${user._key} attempted to two factor authenticate, however the code they submitted does not have 6 digits.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Two factor code length is incorrect. Please try again.`),
      }
    }

    // Check that TFA codes match
    if (twoFactorCode !== user.tfaCode) {
      console.warn(`User: ${user._key} attempted to two factor authenticate, however the tfa codes do not match.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Two factor code is incorrect. Please try again.`),
      }
    }

    // Setup Transaction
    const trx = await transaction(collections)

    // Update phoneValidated to be true
    try {
      await trx.step(
        () => query`
          WITH users
          UPSERT { _key: ${user._key} }
            INSERT { phoneValidated: true }
            UPDATE { phoneValidated: true }
            IN users
        `,
      )
    } catch (err) {
      console.error(`Trx step error occurred when upserting the tfaValidate field for ${user._key}: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to two factor authenticate. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred when upserting the tfaValidate field for ${user._key}: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to two factor authenticate. Please try again.`))
    }

    await loadUserByKey.clear(userKey)
    const updatedUser = await loadUserByKey.load(userKey)

    console.info(`User: ${user._key} successfully two factor authenticated their account.`)

    return {
      _type: 'success',
      user: updatedUser,
      status: i18n._(t`Successfully verified phone number, and set TFA send method to text.`),
    }
  },
})
