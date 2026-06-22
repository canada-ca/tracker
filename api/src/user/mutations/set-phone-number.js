import crypto from 'crypto'
import { GraphQLNonNull } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { GraphQLPhoneNumber } from 'graphql-scalars'
import { t } from '@lingui/macro'

import { setPhoneNumberUnion } from '../unions'

const { CIPHER_KEY } = process.env

export const setPhoneNumber = new mutationWithClientMutationId({
  name: 'SetPhoneNumber',
  description:
    'This mutation is used for setting a new phone number for a user, and sending a code for verifying the new number.',
  inputFields: () => ({
    phoneNumber: {
      type: new GraphQLNonNull(GraphQLPhoneNumber),
      description: 'The phone number that the text message will be sent to.',
    },
  }),
  outputFields: () => ({
    result: {
      type: setPhoneNumberUnion,
      description: '`SetPhoneNumberUnion` returning either a `SetPhoneNumberResult`, or `SetPhoneNumberError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      auth: { userRequired },
      dataSources: { user: userDataSource },
      validators: { cleanseInput },
      notify: { sendAuthTextMsg },
    },
  ) => {
    // Cleanse input
    const phoneNumber = cleanseInput(args.phoneNumber)

    // Get User From Db
    let user = await userRequired()

    // Generate TFA code
    const tfaCode = Math.floor(100000 + Math.random() * 900000)

    // Generate Phone Details
    const phoneDetails = {
      iv: crypto.randomBytes(12).toString('hex'),
    }

    const cipher = crypto.createCipheriv('aes-256-ccm', String(CIPHER_KEY), Buffer.from(phoneDetails.iv, 'hex'), {
      authTagLength: 16,
    })
    let encrypted = cipher.update(phoneNumber, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    phoneDetails.phoneNumber = encrypted
    phoneDetails.tag = cipher.getAuthTag().toString('hex')

    // Set TFA method to backup incase user gets logged out, so they're not locked out of their account
    let tfaSendMethod = 'none'
    if (user.emailValidated && user.tfaSendMethod !== 'none') {
      tfaSendMethod = 'email'
    }

    await userDataSource.setPhoneNumber({ userKey: user._key, tfaCode, phoneDetails, tfaSendMethod })

    // Get newly updated user
    await userDataSource.byKey.clear(user._key)
    user = await userDataSource.byKey.load(user._key)

    await sendAuthTextMsg({ user })

    console.info(`User: ${user._key} successfully set phone number.`)
    return {
      _type: 'regular',
      user: user,
      status: i18n._(t`Phone number has been successfully set, you will receive a verification text message shortly.`),
    }
  },
})
