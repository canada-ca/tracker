const { GraphQLString, GraphQLNonNull } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { GraphQLEmailAddress } = require('graphql-scalars')

const sendEmailVerification = new mutationWithClientMutationId({
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
      request,
      auth: { tokenize },
      validators: { cleanseInput },
      loaders: { userLoaderByUserName },
      notify: { sendVerificationEmail },
    },
  ) => {
    // Cleanse Input
    const userName = cleanseInput(args.userName).toLowerCase()

    // Get user from db
    const user = await userLoaderByUserName.load(userName)

    if (typeof user !== 'undefined') {
      // Choose template based on users preferred language
      let templateId
      if (user.preferredLang === 'french') {
        templateId = 'f2c9b64a-c754-4ffd-93e9-33fdb0b5ae0b'
      } else {
        templateId = '6e3368a7-0d75-47b1-b4b2-878234e554c9'
      }

      const token = tokenize({
        parameters: { userId: user._key },
      })

      const verifyUrl = `${request.protocol}://${request.get(
        'host',
      )}/validate/${token}`

      await sendVerificationEmail({ templateId, user, verifyUrl })

      console.info(`User: ${user._key} successfully sent a verification email.`)
    } else {
      console.warn(
        `A user attempted to send a verification email for ${userName} but no account is affiliated with this user name.`,
      )
    }

    return {
      status:
        'If an account with this username is found, an email verification link will be found in your inbox.',
    }
  },
})

module.exports = {
  sendEmailVerification,
}
