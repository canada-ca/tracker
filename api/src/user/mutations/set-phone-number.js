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
      query,
      collections,
      transaction,
      auth: { userRequired },
      loaders: { loadUserByKey },
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

    // Setup Transaction
    const trx = await transaction(collections)

    // Insert TFA code into DB
    try {
      await trx.step(
        () => query`
          WITH users
          UPSERT { _key: ${user._key} }
            INSERT {
              tfaCode: ${tfaCode},
              phoneDetails: ${phoneDetails},
              phoneValidated: false,
              tfaSendMethod: ${tfaSendMethod}
            }
            UPDATE {
              tfaCode: ${tfaCode},
              phoneDetails: ${phoneDetails},
              phoneValidated: false,
              tfaSendMethod: ${tfaSendMethod}
            }
            IN users
        `,
      )
    } catch (err) {
      console.error(`Trx step error occurred for user: ${user._key} when upserting phone number information: ${err}`)
      throw new Error(i18n._(t`Unable to set phone number, please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred for user: ${user._key} when upserting phone number information: ${err}`)
      throw new Error(i18n._(t`Unable to set phone number, please try again.`))
    }

    // Get newly updated user
    await loadUserByKey.clear(user._key)
    user = await loadUserByKey.load(user._key)

    await sendAuthTextMsg({ user })

    console.info(`User: ${user._key} successfully set phone number.`)
    return {
      _type: 'regular',
      user: user,
      status: i18n._(t`Phone number has been successfully set, you will receive a verification text message shortly.`),
    }
  },
})
