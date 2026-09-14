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
  mutateAndGetPayload: async (_args, { i18n, auth: { userRequired }, dataSources: { user: userDataSource } }) => {
    // Get requesting user
    const user = await userRequired()

    // Set TFA method to backup incase user gets logged out, so they're not locked out of their account
    let tfaSendMethod = 'none'
    if (user.emailValidated && user.tfaSendMethod !== 'none') {
      tfaSendMethod = 'email'
    }

    await userDataSource.removePhoneNumber({ userKey: user._key, tfaSendMethod })

    console.info(`User: ${user._key} successfully removed their phone number.`)
    return {
      _type: 'result',
      status: i18n._(t`Phone number has been successfully removed.`),
    }
  },
})
