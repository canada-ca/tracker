import { GraphQLNonNull, GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { GraphQLEmailAddress } from 'graphql-scalars'
import { t } from '@lingui/macro'

import { signInUnion } from '../../user'

const { SIGN_IN_KEY } = process.env

export const signIn = new mutationWithClientMutationId({
  name: 'SignIn',
  description:
    'This mutation allows users to give their credentials and be taken to the authentication page to verify their account',
  inputFields: () => ({
    userName: {
      type: GraphQLNonNull(GraphQLEmailAddress),
      description: 'The email the user signed up with.',
    },
    password: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The password the user signed up with',
    },
  }),
  outputFields: () => ({
    result: {
      type: signInUnion,
      description: '',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      query,
      auth: { tokenize, bcrypt },
      loaders: { userLoaderByUserName },
      validators: { cleanseInput },
      notify: { sendAuthEmail, sendAuthTextMsg },
    },
  ) => {
    // Cleanse input
    const userName = cleanseInput(args.userName).toLowerCase()
    const password = cleanseInput(args.password)

    // Gather user who just signed in
    let user = await userLoaderByUserName.load(userName)

    if (typeof user === 'undefined') {
      console.warn(
        `User: ${userName} attempted to sign in, no account is associated with this email.`,
      )
      throw new Error(i18n._(t`Unable to sign in, please try again.`))
    }

    // Check against failed attempt info
    if (user.failedLoginAttempts >= 10) {
      console.warn(
        `User: ${user._key} tried to sign in, but has too many login attempts.`,
      )
      throw new Error(
        i18n._(
          t`Too many failed login attempts, please reset your password, and try again.`,
        ),
      )
    } else {
      // Check to see if passwords match
      if (bcrypt.compareSync(password, user.password)) {
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
          throw new Error(i18n._(t`Unable to sign in, please try again.`))
        }

        if (user.tfaSendMethod !== 'none') {
          // Generate TFA code
          const tfaCode = Math.floor(100000 + Math.random() * 900000)

          // Insert TFA code into DB
          try {
            await query`
                UPSERT { _key: ${user._key} }
                  INSERT { tfaCode: ${tfaCode} }
                  UPDATE { tfaCode: ${tfaCode} }
                  IN users
              `
          } catch (err) {
            console.error(
              `Database error occurred when inserting ${user._key} TFA code: ${err}`,
            )
            throw new Error(i18n._(t`Unable to sign in, please try again.`))
          }

          // Get newly updated user
          await userLoaderByUserName.clear(userName)
          user = await userLoaderByUserName.load(userName)

          // Check to see if user has phone validated
          let sendMethod
          if (user.tfaSendMethod === 'phone') {
            await sendAuthTextMsg({ user })
            sendMethod = 'text'
          } else {
            await sendAuthEmail({ user })
            sendMethod = 'email'
          }

          console.info(
            `User: ${user._key} successfully signed in, and sent auth msg.`,
          )

          const authenticateToken = tokenize({
            parameters: { userKey: user._key },
            secret: String(SIGN_IN_KEY),
          })

          return {
            sendMethod,
            authenticateToken,
          }
        } else {
          console.info(
            `User: ${user._key} successfully signed in, and sent auth msg.`,
          )

          const token = tokenize({
            parameters: { userKey: user._key },
          })

          return {
            authResult: {
              token,
              user,
            },
          }
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
          throw new Error(i18n._(t`Unable to sign in, please try again.`))
        }
        console.warn(
          `User attempted to authenticate: ${user._key} with invalid credentials.`,
        )
        throw new Error(i18n._(t`Unable to sign in, please try again.`))
      }
    }
  },
})
