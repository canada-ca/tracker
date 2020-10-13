const { GraphQLNonNull, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { GraphQLPhoneNumber } = require('graphql-scalars')
const { t } = require('@lingui/macro')

const sendPhoneCode = new mutationWithClientMutationId({
  name: 'sendPhoneCode',
  description:
    'This mutation is used for sending a text message with a random six digit code used to verify the user.',
  inputFields: () => ({
    phoneNumber: {
      type: GraphQLNonNull(GraphQLPhoneNumber),
      description: 'The phone number that the text message will be sent to.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Informs the user if the text message was successfully sent.',
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
      userId,
      loaders: { userLoaderByKey },
      validators: { cleanseInput },
      notify: { sendTfaTextMsg },
    },
  ) => {
    // Cleanse input
    const phoneNumber = cleanseInput(args.phoneNumber)

    // Check to see if user Id exists
    if (typeof userId === 'undefined') {
      console.warn(
        `User attempted to send TFA text message, however the userId does not exist.`,
      )
      throw new Error(i18n._(t`Authentication error, please sign in again.`))
    }

    // Get User From Db
    let user = await userLoaderByKey.load(userId)

    if (typeof user === 'undefined') {
      console.warn(
        `User attempted to send TFA text message, however no account is associated with ${userId}.`,
      )
      throw new Error(i18n._(t`Unable to send TFA code, please try again.`))
    }

    // Generate TFA code
    const tfaCode = Math.floor(100000 + Math.random() * 900000)

    // Insert TFA code into DB
    try {
      await query`
        UPSERT { _key: ${user._key} }
          INSERT { tfaCode: ${tfaCode} }
          UPDATE { tfaCode: ${tfaCode} }
          IN users
      `
    } catch (err) {
      console.error(
        `Database error occurred when inserting ${user._key} TFA code: ${err}`,
      )
      throw new Error(i18n._(t`Unable to send TFA code, please try again.`))
    }

    try {
      await query`
        UPSERT { _key: ${user._key} }
          INSERT { phoneNumber: ${phoneNumber} }
          UPDATE { phoneNumber: ${phoneNumber} }
          IN users
      `
    } catch (err) {
      console.error(
        `Database error occurred when inserting ${user._key} phone number: ${err}`,
      )
      throw new Error(i18n._(t`Unable to send TFA code, please try again.`))
    }

    // Get newly updated user
    await userLoaderByKey.clear(user._key)
    user = await userLoaderByKey.load(user._key)

    let templateId
    if (user.preferredLang === 'french') {
      templateId = 'de8433ce-4a0b-48b8-a99f-4fe085127af5'
    } else {
      templateId = 'd6846e21-cae7-46e9-9e36-8a3f735c90ee'
    }

    await sendTfaTextMsg({ templateId, phoneNumber, user })

    console.info(`User: ${user._key} successfully sent tfa code.`)
    return {
      status: i18n._(
        t`Two factor code has been successfully sent, you will receive a text message shortly.`,
      ),
    }
  },
})

module.exports = {
  sendPhoneCode,
}
