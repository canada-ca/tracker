const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { GraphQLNonNull, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { EmailAddress } = require('../../scalars')
const { authResultType } = require('../../types')

const authenticate = new mutationWithClientMutationId({
  name: 'Authenticate',
  description:
    'This mutation allows users to give their credentials and retrieve a token that gives them access to restricted content.',
  inputFields: () => ({
    userName: {
      type: GraphQLNonNull(EmailAddress),
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
      resolve: async ({ authResult }) => {
        return authResult
      },
    },
  }),
  mutateAndGetPayload: async (args, { query, functions: { cleanseInput }}) => {
    // Cleanse Inputs
    let userName = cleanseInput(args.userName)
    let password = cleanseInput(args.password)

    // Gather sign in user
    let userCursor
    try {
      userCursor = await query`
        FOR user IN users
          FILTER user.userName == ${userName}
          RETURN user
      `
    } catch (err) {
      console.error(`Database error occurred when ${userName} attempted to authenticate: ${err}`)
      throw new Error('Unable to authenticate, please try again.')
    }

    if (userCursor.count === 0) {
      console.error(`User: ${userName} attempted to authenticate, no account is associated with this email.`)
      throw new Error('Unable to authenticate, please try again.')
    }

    // Get users from cursor
    let users
    try {
      users = await userCursor.all()
    } catch (err) {
      console.error(`Cursor error occurred when user was authenticated.`)
      throw new Error('Unable to authenticate, please try again.')
    }

    // Get user from cursor
    const user = users.next()

    if (bcrypt.compareSync(password, user.password)) {
      if (user.failedLoginAttempts > 5 && (user.failedLoginAttemptTime + 1800) <= Math.floor(new Date().getTime() / 1000)) {
        
      }
    }
  },
})

module.exports = {
  authenticate,
}
