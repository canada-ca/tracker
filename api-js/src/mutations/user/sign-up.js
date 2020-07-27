const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { GraphQLNonNull, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { LanguageEnums } = require('../../enums')
const { EmailAddress } = require('../../scalars')
const { authResultType } = require('../../types')

const signUp = new mutationWithClientMutationId({
  name: 'SignUp',
  description:
    'This mutation allows for new users to sign up for our sites services.',
  inputFields: () => ({
    displayName: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The name that will be displayed to other users.',
    },
    userName: {
      type: GraphQLNonNull(EmailAddress),
      description: 'Email address that the user will use to authenticate with.',
    },
    password: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The password the user will authenticate with.',
    },
    confirmPassword: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'A secondary password field used to confirm the user entered the correct password.',
    },
    preferredLang: {
      type: GraphQLNonNull(LanguageEnums),
      description: 'The users preferred language.',
    },
    signUpToken: {
      type: GraphQLString,
      description:
        'A token sent by email, that will assign a user to an organization with a pre-determined role.',
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
  mutateAndGetPayload: async (args, { query, functions: { cleanseInput } }) => {
    // Cleanse Inputs
    let displayName = cleanseInput(args.displayName)
    let userName = cleanseInput(args.userName).toLowerCase()
    let password = cleanseInput(args.password)
    let confirmPassword = cleanseInput(args.confirmPassword)
    let preferredLang = cleanseInput(args.preferredLang)

    // Check to make sure password meets length requirement
    if (password.length < 8) {
      console.warn(
        `User: ${userName} tried to sign up but did not meet requirements.`,
      )
      throw new Error('Error, password is too short.')
    }

    // Check that password and password confirmation match
    if (password !== confirmPassword) {
      console.warn(
        `User: ${userName} tried to sign up but passwords do not match.`,
      )
      throw new Error('Error, passwords do not match.')
    }

    // Check to see if user already exists
    let checkCursor
    try {
      checkCursor = await query`
        FOR user IN users
          FILTER user.userName == ${userName}
          RETURN user
      `
    } catch (err) {
      console.error(
        `Database error when check for existing users during signUp: ${err}`,
      )
      throw new Error('Error, unable to sign up. Please try again.')
    }

    let checkUsers
    try {
      checkUsers = await checkCursor.all()
    } catch (err) {
      console.error(`Cursor error when gathering signUp check users: ${err}`)
      throw new Error('Error, unable to sign up. Please try again.')
    }

    if (checkUsers.length > 0) {
      console.warn(
        `User: ${userName} tried to sign up, however there is already an account in use with that username.`,
      )
      throw new Error('Error, username already in use.')
    }

    // Hash Users Password
    const hashedPassword = bcrypt.hashSync(password, 10)

    // Create User Structure for insert
    const user = {
      displayName: displayName,
      userName: userName,
      password: hashedPassword,
      preferredLang: preferredLang,
      tfaValidated: false,
      emailValidated: false,
    }

    let insertedCursor = (insertedUser = null)
    try {
      insertedCursor = await query`
        INSERT ${user} INTO users RETURN NEW
      `
      console.log(`User: ${userName} successfully created a new account.`)
    } catch (err) {
      console.error(
        `Database error occurred when ${userName} tried to sign up: ${err}`,
      )
      throw new Error('Error, unable to sign up. Please try again.')
    }

    try {
      insertedUser = await insertedCursor.all()
    } catch (err) {
      console.error(`Cursor error occurred when trying to get new user: ${err}`)
      throw new Error('Error, unable to sign up. Please try again.')
    }

    // Remove password from user object
    delete insertedUser[0].password

    // Assign global id
    insertedUser[0].id = insertedUser[0]._key

    // Generate JWT
    const token = jwt.sign(
      { userId: insertedUser[0]._key },
      'secretKeyGoesHere',
    )

    return {
      authResult: {
        token,
        user: insertedUser[0],
      },
    }
  },
})

module.exports = {
  signUp,
}
