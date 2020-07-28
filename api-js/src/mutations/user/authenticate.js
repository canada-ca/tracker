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
      resolve: async (payload) => {
        return payload.authResult
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

    // Get user from cursor
    const user = await userCursor.next()

    // Check against failed attempt info
    if (user.failedLoginAttempts >= 10) {
      console.warn(`User: ${user._key} tried to authenticate, but has too many login attempts.`)
      throw new Error('Too many failed login attempts, please reset your password, and try again.')
    } else {
      // Reset Failed Login attempts after cooldown
      let resetCursor
      try{
        resetCursor = await query`
          FOR u IN users
            UPDATE ${user._key} WITH { failedLoginAttempts: 0 } IN users
        `
      } catch (err) {
        console.error(`Database error ocurred when resetting failed attempts for user: ${user._key} during authentication.`)
        throw new Error('Unable to authenticate, please try again.')
      }
      // Check to see if passwords match
      if (bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ userId: user._key }, 'secretKeyGoesHere')
  
        console.info(`User: ${user._key} successfully authenticated their account.`)
        
        user.id = user._key
  
        return {
          authResult: {
            token,
            user
          }
        }
      } else {
        let failedAttemptCursor
        try {
          failedAttemptCursor = await query`
            FOR u IN users
              UPDATE ${user._key} WITH { failedLoginAttempts: ${user.failedLoginAttempts + 1} } IN users
          `
        } catch (err) {
          console.error(`Database error ocurred when incrementing user: ${user._key} failed login attempts: ${err}`)
          throw new Error('Unable to authenticate, please try again.')
        }
        console.warn(`User attempted to authenticate: ${user._key} with invalid credentials.`)
        throw new Error('Unable to authenticate, please try again.')
      }
    }
  },
})

module.exports = {
  authenticate,
}
