import { GraphQLNonNull, GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { GraphQLEmailAddress } from 'graphql-scalars'
import { t } from '@lingui/macro'

export const sendPasswordResetLink = new mutationWithClientMutationId({
  name: 'SendPasswordResetLink',
  description:
    'This mutation allows a user to provide their username and request that a password reset email be sent to their account with a reset token in a url.',
  inputFields: () => ({
    userName: {
      type: GraphQLNonNull(GraphQLEmailAddress),
      description:
        'User name for the account you would like to receive a password reset link for.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Informs the user if the password reset email was sent successfully.',
      resolve: async (payload) => {
        return payload.status
      },
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      request,
      auth: { tokenize },
      validators: { cleanseInput },
      loaders: { loadUserByUserName },
      notify: { sendPasswordResetEmail },
    },
  ) => {
    // Cleanse Input
    const userName = cleanseInput(args.userName).toLowerCase()

    const user = await loadUserByUserName.load(userName)

    if (typeof user !== 'undefined') {
      const token = tokenize({
        parameters: { userKey: user._key, currentPassword: user.password },
      })
      const resetUrl = `${request.protocol}://${request.get(
        'host',
      )}/reset-password/${token}`

      await sendPasswordResetEmail({ user, resetUrl })

      console.info(
        `User: ${user._key} successfully sent a password reset email.`,
      )
    } else {
      console.warn(
        `A user attempted to send a password reset email for ${userName} but no account is affiliated with this user name.`,
      )
    }

    return {
      status: i18n._(
        t`If an account with this username is found, a password reset link will be found in your inbox.`,
      ),
    }
  },
})
