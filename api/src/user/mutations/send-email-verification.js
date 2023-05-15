import {GraphQLString, GraphQLNonNull} from 'graphql'
import {mutationWithClientMutationId} from 'graphql-relay'
import {GraphQLEmailAddress} from 'graphql-scalars'
import {t} from '@lingui/macro'

export const sendEmailVerification = new mutationWithClientMutationId({
  name: 'SendEmailVerification',
  description:
    'This mutation is used for re-sending a verification email if it failed during user creation.',
  inputFields: () => ({
    userName: {
      type: GraphQLNonNull(GraphQLEmailAddress),
      description:
        'The users email address used for sending the verification email.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description: 'Informs the user if the email was sent successfully.',
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
      auth: {tokenize},
      validators: {cleanseInput},
      loaders: {loadUserByUserName},
      notify: {sendVerificationEmail},
    },
  ) => {
    // Cleanse Input
    const userName = cleanseInput(args.userName).toLowerCase()

    // Get user from db
    const user = await loadUserByUserName.load(userName)

    if (typeof user !== 'undefined') {
      const token = tokenize({
        parameters: {userKey: user._key},
      })

      const verifyUrl = `https://${request.get('host')}/validate/${token}`

      await sendVerificationEmail({user, verifyUrl})

      console.info(`User: ${user._key} successfully sent a verification email.`)
    } else {
      console.warn(
        `A user attempted to send a verification email for ${userName} but no account is affiliated with this user name.`,
      )
    }

    return {
      status: i18n._(
        t`If an account with this username is found, an email verification link will be found in your inbox.`,
      ),
    }
  },
})
