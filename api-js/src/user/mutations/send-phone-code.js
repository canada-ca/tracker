import crypto from 'crypto'
import { GraphQLNonNull } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { GraphQLPhoneNumber } from 'graphql-scalars'
import { t } from '@lingui/macro'

import { sendPhoneCodeUnion } from '../unions'

const { CIPHER_KEY } = process.env

export const sendPhoneCode = new mutationWithClientMutationId({
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
    result: {
      type: sendPhoneCodeUnion,
      description:
        '`SendPhoneCodeUnion` returning either a `SendPhoneCodeResult`, or `SendPhoneCodeError` object.',
      resolve: (payload) => payload,
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
      notify: { sendTfaTextMsg },
    },
  ) => {
    // Cleanse input
    const phoneNumber = cleanseInput(args.phoneNumber)

    // Check to see if user Id exists
    if (typeof userKey === 'undefined') {
      console.warn(
        `User attempted to send TFA text message, however the userKey does not exist.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Authentication error, please sign in again.`),
      }
    }

    // Get User From Db
    let user = await userLoaderByKey.load(userKey)

    if (typeof user === 'undefined') {
      console.warn(
        `User attempted to send TFA text message, however no account is associated with this key: ${userKey}.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to send TFA code, please try again.`),
      }
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

    const phoneDetails = {
      iv: crypto.randomBytes(12).toString('hex'),
    }

    const cipher = crypto.createCipheriv(
      'aes-256-ccm',
      String(CIPHER_KEY),
      Buffer.from(phoneDetails.iv, 'hex'),
      { authTagLength: 16 },
    )
    let encrypted = cipher.update(phoneNumber, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    phoneDetails.phoneNumber = encrypted
    phoneDetails.tag = cipher.getAuthTag().toString('hex')

    try {
      await query`
        UPSERT { _key: ${user._key} }
          INSERT { phoneDetails: ${phoneDetails} }
          UPDATE { phoneDetails: ${phoneDetails} }
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

    await sendTfaTextMsg({ phoneNumber, user })

    console.info(`User: ${user._key} successfully sent tfa code.`)
    return {
      _type: 'regular',
      status: i18n._(
        t`Two factor code has been successfully sent, you will receive a text message shortly.`,
      ),
    }
  },
})
