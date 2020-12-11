const { CIPHER_KEY } = process.env
const crypto = require('crypto')
const { GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { GraphQLEmailAddress, GraphQLPhoneNumber } = require('graphql-scalars')
const { t } = require('@lingui/macro')
const { LanguageEnums } = require('../../enums')

const updateUserProfile = new mutationWithClientMutationId({
  name: 'UpdateUserProfile',
  description:
    'This mutation allows the user to update their user profile to change various details of their current profile.',
  inputFields: () => ({
    displayName: {
      type: GraphQLString,
      description: 'The updated display name the user wishes to change to.',
    },
    userName: {
      type: GraphQLEmailAddress,
      description: 'The updated user name the user wishes to change to.',
    },
    preferredLang: {
      type: LanguageEnums,
      description:
        'The updated preferred language the user wishes to change to.',
    },
    phoneNumber: {
      type: GraphQLPhoneNumber,
      description: 'The updated phone number the user wishes to change to.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description: 'The status if the user profile update was successful.',
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
      loaders: { userLoaderByKey },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse Input
    const displayName = cleanseInput(args.displayName)
    const userName = cleanseInput(args.userName).toLowerCase()
    const preferredLang = cleanseInput(args.preferredLang)
    const phoneNumber = cleanseInput(args.phoneNumber)

    // Make sure userKey is not undefined
    if (typeof userKey === 'undefined') {
      console.warn(
        `User attempted to update their profile, but the user id is undefined.`,
      )
      throw new Error(i18n._(t`Authentication error, please sign in again.`))
    }

    // Get user info from DB
    const user = await userLoaderByKey.load(userKey)

    if (typeof user === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update their profile, but no account is associated with that id.`,
      )
      throw new Error(i18n._(t`Unable to update profile. Please try again.`))
    }

    let updatedPhoneDetails, phoneValidated
    if (user.phoneValidated && typeof phoneNumber !== 'undefined') {
      const { iv, tag, phoneNumber: encryptedData } = user.phoneDetails
      const decipher = crypto.createDecipheriv(
        'aes-256-ccm',
        String(CIPHER_KEY),
        Buffer.from(iv, 'hex'),
        { authTagLength: 16 },
      )
      decipher.setAuthTag(Buffer.from(tag, 'hex'))
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      if (decrypted !== phoneNumber) {
        updatedPhoneDetails = {
          iv: crypto.randomBytes(12).toString('hex'),
        }
        const cipher = crypto.createCipheriv(
          'aes-256-ccm',
          String(CIPHER_KEY),
          Buffer.from(updatedPhoneDetails.iv, 'hex'),
          { authTagLength: 16 },
        )
        let encrypted = cipher.update(phoneNumber, 'utf8', 'hex')
        encrypted += cipher.final('hex')

        updatedPhoneDetails.phoneNumber = encrypted
        updatedPhoneDetails.tag = cipher.getAuthTag().toString('hex')
      } else {
        phoneValidated = true
        updatedPhoneDetails = user.phoneDetails
      }
    }

    // Create object containing updated data
    const updatedUser = {
      displayName: displayName || user.displayName,
      userName: userName || user.userName,
      preferredLang: preferredLang || user.preferredLang,
      phoneDetails: updatedPhoneDetails,
      phoneValidated: phoneValidated || user.phoneValidated,
    }

    try {
      await query`
        UPSERT { _key: ${user._key} }
          INSERT ${updatedUser}
          UPDATE ${updatedUser} 
          IN users
      `
    } catch (err) {
      console.error(
        `Database error ocurred when user: ${user._key} attempted to update their profile: ${err}`,
      )
      throw new Error(i18n._(t`Unable to update profile. Please try again.`))
    }

    console.info(`User: ${user._key} successfully updated their profile.`)
    return {
      status: i18n._(t`Profile successfully updated.`),
    }
  },
})

module.exports = {
  updateUserProfile,
}
