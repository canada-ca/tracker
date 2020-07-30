const { GraphQLNonNull, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { EmailAddress } = require('../../scalars')

const sendPasswordResetLink = new mutationWithClientMutationId({
  name: 'SendPasswordResetLink',
  description:
    'This mutation allows a user to provide their username and request that a password reset email be sent to their account with a reset token in a url.',
  inputFields: () => ({
    userName: {
      type: GraphQLNonNull(EmailAddress),
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
      request,
      query,
      tokenize,
      functions: { cleanseInput },
      loaders: { userLoaderByUserName },
      notify: { sendPasswordResetEmail },
    },
  ) => {
    // Cleanse Input
    const userName = cleanseInput(args.userName).toLowerCase()

    const user = await userLoaderByUserName.load({
      userNames: [userName],
      query,
    })

    if (typeof user !== 'undefined') {
      let templateId
      // Check users preferred lang
      if (user.preferredLang === 'french') {
        templateId = '11aef4a3-b1a3-42b9-8246-7a0aa2bfe805'
      } else {
        templateId = '8c3d96cc-3cbe-4043-b157-4f4a2bbb57b1'
      }

      const token = tokenize({
        parameters: { user_id: user._key, current_password: user.password },
      })
      const resetUrl = `${request.protocol}://${request.get(
        'host',
      )}/reset-password/${token}`

      await sendPasswordResetEmail({ templateId, user, resetUrl })

      console.info(
        `User: ${user._key} successfully sent a password reset email.`,
      )
    } else {
      console.warn(
        `A user attempted to send a password reset email for ${userName} but no account is affiliated with this user name.`,
      )
    }

    return {
      status:
        'If an account with this username is found, a password reset link will be found in your inbox.',
    }
  },
})

module.exports = {
  sendPasswordResetLink,
}
