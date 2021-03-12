import { GraphQLNonNull, GraphQLInt } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'

import { verifyPhoneNumberUnion } from '../unions'

export const verifyPhoneNumber = new mutationWithClientMutationId({
  name: 'verifyPhoneNumber',
  description: 'This mutation allows the user to two factor authenticate.',
  inputFields: () => ({
    twoFactorCode: {
      type: GraphQLNonNull(GraphQLInt),
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
    { i18n, query, userKey, loaders: { userLoaderByKey } },
  ) => {
    // Cleanse Input
    const twoFactorCode = args.twoFactorCode

    // Replace with userRequired()
    if (typeof userKey === 'undefined') {
      console.warn(
        `User attempted to two factor authenticate, however the userKey is undefined.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Authentication error, please sign in again.`),
      }
    }

    // Get User From DB
    const user = await userLoaderByKey.load(userKey)

    if (typeof user === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to two factor authenticate, however no account is associated with that id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Authentication error, please sign in again.`),
      }
    }

    if (twoFactorCode.toString().length !== 6) {
      console.warn(
        `User: ${user._key} attempted to two factor authenticate, however the code they submitted does not have 6 digits.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(
          t`Two factor code length is incorrect. Please try again.`,
        ),
      }
    }

    // Check that TFA codes match
    if (twoFactorCode !== user.tfaCode) {
      console.warn(
        `User: ${user._key} attempted to two factor authenticate, however the tfa codes do not match.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Two factor code is incorrect. Please try again.`),
      }
    }

    // Update phoneValidated to be true
    try {
      await query`
        UPSERT { _key: ${user._key} }
          INSERT { phoneValidated: true, tfaSendMethod: 'phone' }
          UPDATE { phoneValidated: true, tfaSendMethod: 'phone' }
          IN users
      `
    } catch (err) {
      console.error(
        `Database error occurred when upserting the tfaValidate field for ${user._key}: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to two factor authenticate. Please try again.`),
      )
    }

    console.info(
      `User: ${user._key} successfully two factor authenticated their account.`,
    )

    return {
      _type: 'success',
      status: i18n._(
        t`Successfully verified phone number, and set TFA send method to text.`,
      ),
    }
  },
})
