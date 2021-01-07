const { GraphQLNonNull, GraphQLInt, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { t } = require('@lingui/macro')

const verifyPhoneNumber = new mutationWithClientMutationId({
  name: 'verifyPhoneNumber',
  description: 'This mutation allows the user to two factor authenticate.',
  inputFields: () => ({
    twoFactorCode: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The two factor code that was received via text message.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description: 'The status of verifying the two factor authentication.',
      resolve: async (payload) => {
        return payload.status
      },
    },
  }),
  mutateAndGetPayload: async (
    args,
    { i18n, query, userKey, loaders: { userLoaderByKey } },
  ) => {
    // Cleanse Input
    const twoFactorCode = args.twoFactorCode

    if (typeof userKey === 'undefined') {
      console.warn(
        `User attempted to two factor authenticate, however the userKey is undefined.`,
      )
      throw new Error(i18n._(t`Authentication error, please sign in again.`))
    }

    // Get User From DB
    const user = await userLoaderByKey.load(userKey)

    if (typeof user === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to two factor authenticate, however no account is associated with that id.`,
      )
      throw new Error(
        i18n._(t`Unable to two factor authenticate. Please try again.`),
      )
    }

    if (twoFactorCode.toString().length !== 6) {
      console.warn(
        `User: ${user._key} attempted to two factor authenticate, however the code they submitted does not have 6 digits.`,
      )
      throw new Error(
        i18n._(t`Unable to two factor authenticate. Please try again.`),
      )
    }

    // Check that TFA codes match
    if (twoFactorCode !== user.tfaCode) {
      console.warn(
        `User: ${user._key} attempted to two factor authenticate, however the tfa codes do not match.`,
      )
      throw new Error(
        i18n._(t`Unable to two factor authenticate. Please try again.`),
      )
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
      status: i18n._(t`Successfully verified phone number, and set TFA send method to text.`),
    }
  },
})

module.exports = {
  verifyPhoneNumber,
}
