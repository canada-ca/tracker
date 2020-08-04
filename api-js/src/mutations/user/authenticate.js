const bcrypt = require('bcrypt')
const { GraphQLNonNull, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { GraphQLEmailAddress } = require('graphql-scalars')
const { authResultType } = require('../../types')

const authenticate = new mutationWithClientMutationId({
  name: 'Authenticate',
  description:
    'This mutation allows users to give their credentials and retrieve a token that gives them access to restricted content.',
  inputFields: () => ({
    userName: {
      type: GraphQLNonNull(GraphQLEmailAddress),
      description: 'The email the user signed up with.',
    },
    password: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The password the user signed up with.',
    },
  }),
  outputFields: () => ({
    authResult: {
      type: authResultType,
      description: 'The authenticated users information, and JWT.',
      resolve: async (payload) => {
        return payload.authResult
      },
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      query,
      auth: { tokenize },
      loaders: { userLoaderByUserName },
      functions: { cleanseInput },
    },
  ) => {
    // Cleanse Inputs
    const userName = cleanseInput(args.userName).toLowerCase()
    const password = cleanseInput(args.password)

    // Gather sign in user
    const user = await userLoaderByUserName.load(userName)

    if (typeof user === 'undefined') {
      console.warn(
        `User: ${userName} attempted to authenticate, no account is associated with this email.`,
      )
      throw new Error('Unable to authenticate, please try again.')
    }

    // Check against failed attempt info
    if (user.failedLoginAttempts >= 10) {
      console.warn(
        `User: ${user._key} tried to authenticate, but has too many login attempts.`,
      )
      throw new Error(
        'Too many failed login attempts, please reset your password, and try again.',
      )
    } else {
      // Check to see if passwords match
      if (bcrypt.compareSync(password, user.password)) {
        const token = tokenize({ parameters: { userId: user._key } })

        // Reset Failed Login attempts
        try {
          await query`
                  FOR u IN users
                    UPDATE ${user._key} WITH { failedLoginAttempts: 0 } IN users
                `
        } catch (err) {
          console.error(
            `Database error ocurred when resetting failed attempts for user: ${user._key} during authentication: ${err}`,
          )
          throw new Error('Unable to authenticate, please try again.')
        }

        console.info(
          `User: ${user._key} successfully authenticated their account.`,
        )
        user.id = user._key

        return {
          authResult: {
            token,
            user,
          },
        }
      } else {
        try {
          // Increase users failed login attempts
          await query`
            FOR u IN users
              UPDATE ${user._key} WITH { failedLoginAttempts: ${
            user.failedLoginAttempts + 1
          } } IN users
          `
        } catch (err) {
          console.error(
            `Database error ocurred when incrementing user: ${user._key} failed login attempts: ${err}`,
          )
          throw new Error('Unable to authenticate, please try again.')
        }
        console.warn(
          `User attempted to authenticate: ${user._key} with invalid credentials.`,
        )
        throw new Error('Unable to authenticate, please try again.')
      }
    }
  },
})

module.exports = {
  authenticate,
}
