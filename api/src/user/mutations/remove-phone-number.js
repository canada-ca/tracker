import { t } from '@lingui/macro'
import { mutationWithClientMutationId } from 'graphql-relay'

import { removePhoneNumberUnion } from '../unions'

export const removePhoneNumber = new mutationWithClientMutationId({
  name: 'RemovePhoneNumber',
  description: 'This mutation allows for users to remove a phone number from their account.',
  outputFields: () => ({
    result: {
      type: removePhoneNumberUnion,
      description:
        '`RemovePhoneNumberUnion` returning either a `RemovePhoneNumberResult`, or `RemovePhoneNumberError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (_args, { i18n, collections, query, transaction, auth: { userRequired } }) => {
    // Get requesting user
    const user = await userRequired()

    // Set TFA method to backup incase user gets logged out, so they're not locked out of their account
    let tfaSendMethod = 'none'
    if (user.emailValidated && user.tfaSendMethod !== 'none') {
      tfaSendMethod = 'email'
    }

    // Setup Transaction
    const trx = await transaction(collections)

    try {
      await trx.step(
        () => query`
        WITH users
        UPSERT { _key: ${user._key} }
          INSERT {
            phoneDetails: null,
            phoneValidated: false,
            tfaSendMethod: ${tfaSendMethod}
          }
          UPDATE {
            phoneDetails: null,
            phoneValidated: false,
            tfaSendMethod: ${tfaSendMethod}
          }
          IN users
      `,
      )
    } catch (err) {
      console.error(`Trx step error occurred well removing phone number for user: ${user._key}: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to remove phone number. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred well removing phone number for user: ${user._key}: ${err}`)
      await trx.abort()
      throw new Error(i18n._(t`Unable to remove phone number. Please try again.`))
    }

    console.info(`User: ${user._key} successfully removed their phone number.`)
    return {
      _type: 'result',
      status: i18n._(t`Phone number has been successfully removed.`),
    }
  },
})
