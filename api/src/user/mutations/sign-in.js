import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { GraphQLEmailAddress } from 'graphql-scalars'
import { t } from '@lingui/macro'

import { signInUnion } from '../../user'
import ms from 'ms'

const { SIGN_IN_KEY, REFRESH_TOKEN_EXPIRY, REFRESH_KEY, AUTHENTICATED_KEY, AUTH_TOKEN_EXPIRY } = process.env

export const signIn = new mutationWithClientMutationId({
  name: 'SignIn',
  description:
    'This mutation allows users to give their credentials and either signed in, re-directed to the tfa auth page, or given an error.',
  inputFields: () => ({
    userName: {
      type: new GraphQLNonNull(GraphQLEmailAddress),
      description: 'The email the user signed up with.',
    },
    password: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The password the user signed up with',
    },
    rememberMe: {
      type: GraphQLBoolean,
      defaultValue: false,
      description: 'Whether or not the user wants to stay signed in after leaving the site.',
    },
  }),
  outputFields: () => ({
    result: {
      type: signInUnion,
      description:
        '`SignInUnion` returning either a `regularSignInResult`, `tfaSignInResult`, or `signInError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      query,
      collections,
      transaction,
      uuidv4,
      response,
      jwt,
      auth: { tokenize, bcrypt },
      loaders: { loadUserByUserName },
      validators: { cleanseInput },
      notify: { sendAuthEmail, sendAuthTextMsg },
    },
  ) => {
    // Cleanse input
    const userName = cleanseInput(args.userName).toLowerCase()
    const password = cleanseInput(args.password)
    const rememberMe = args.rememberMe

    // Gather user who just signed in
    let user = await loadUserByUserName.load(userName)

    // Replace with userRequired()
    if (typeof user === 'undefined') {
      console.warn(`User: ${userName} attempted to sign in, no account is associated with this email.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Incorrect username or password. Please try again.`),
      }
    }

    // Check against failed attempt info
    if (user.failedLoginAttempts >= 10) {
      console.warn(`User: ${user._key} tried to sign in, but has too many login attempts.`)
      return {
        _type: 'error',
        code: 401,
        description: i18n._(t`Too many failed login attempts, please reset your password, and try again.`),
      }
    } else {
      // Setup Transaction
      const trx = await transaction(collections)

      // Check to see if passwords match
      if (bcrypt.compareSync(password, user.password)) {
        // Reset Failed Login attempts
        try {
          await trx.step(
            () => query`
              WITH users
              FOR u IN users
                UPDATE ${user._key} WITH { failedLoginAttempts: 0 } IN users
            `,
          )
        } catch (err) {
          console.error(`Trx step error occurred when resetting failed login attempts for user: ${user._key}: ${err}`)
          await trx.abort()
          throw new Error(i18n._(t`Unable to sign in, please try again.`))
        }

        const refreshId = uuidv4()
        const refreshInfo = {
          refreshId,
          expiresAt: new Date(new Date().getTime() + ms(String(REFRESH_TOKEN_EXPIRY))),
          rememberMe,
        }

        if (user.tfaSendMethod !== 'none') {
          // Generate TFA code
          const tfaCode = Math.floor(100000 + Math.random() * 900000)

          // Insert TFA code into DB
          try {
            await trx.step(
              () => query`
                WITH users
                UPSERT { _key: ${user._key} }
                  INSERT {
                    tfaCode: ${tfaCode},
                    refreshInfo: ${refreshInfo}
                  }
                  UPDATE {
                    tfaCode: ${tfaCode},
                    refreshInfo: ${refreshInfo}
                  }
                  IN users
                `,
            )
          } catch (err) {
            console.error(`Trx step error occurred when inserting TFA code for user: ${user._key}: ${err}`)
            await trx.abort()
            throw new Error(i18n._(t`Unable to sign in, please try again.`))
          }

          try {
            await trx.commit()
          } catch (err) {
            console.error(`Trx commit error occurred while user: ${user._key} attempted to tfa sign in: ${err}`)
            await trx.abort()
            throw new Error(i18n._(t`Unable to sign in, please try again.`))
          }

          // Get newly updated user
          await loadUserByUserName.clear(userName)
          user = await loadUserByUserName.load(userName)

          // Check if user's last successful login was over 30 days ago
          let lastLogin
          if (user.lastLogin) {
            lastLogin = new Date(user.lastLogin)
          } else {
            lastLogin = new Date()
          }
          const currentDate = new Date()
          const timeDifference = currentDate - lastLogin
          const daysDifference = timeDifference / (1000 * 3600 * 24)

          // Check to see if user has phone validated
          let sendMethod
          if (user.tfaSendMethod === 'email' || daysDifference >= 30) {
            await sendAuthEmail({ user })
            sendMethod = 'email'
          } else {
            await sendAuthTextMsg({ user })
            sendMethod = 'text'
          }

          console.info(`User: ${user._key} successfully signed in, and sent auth msg.`)

          const authenticateToken = tokenize({
            expiresIn: AUTH_TOKEN_EXPIRY,
            parameters: { userKey: user._key },
            secret: String(SIGN_IN_KEY), // SIGN_IN_KEY is reserved for signing TFA tokens
          })

          return {
            _type: 'tfa',
            sendMethod,
            authenticateToken,
          }
        } else {
          const loginDate = new Date().toISOString()
          try {
            await trx.step(
              () => query`
                WITH users
                UPSERT { _key: ${user._key} }
                  INSERT { refreshInfo: ${refreshInfo}, lastLogin: ${loginDate} }
                  UPDATE { refreshInfo: ${refreshInfo}, lastLogin: ${loginDate} }
                  IN users
              `,
            )
          } catch (err) {
            console.error(
              `Trx step error occurred when attempting to setting refresh tokens for user: ${user._key} during sign in: ${err}`,
            )
            await trx.abort()
            throw new Error(i18n._(t`Unable to sign in, please try again.`))
          }

          try {
            await trx.commit()
          } catch (err) {
            console.error(`Trx commit error occurred while user: ${user._key} attempted a regular sign in: ${err}`)
            await trx.abort()
            throw new Error(i18n._(t`Unable to sign in, please try again.`))
          }

          const token = tokenize({
            expiresIn: AUTH_TOKEN_EXPIRY,
            parameters: { userKey: user._key },
            secret: String(AUTHENTICATED_KEY),
          })

          const refreshToken = tokenize({
            expiresIn: REFRESH_TOKEN_EXPIRY,
            parameters: { userKey: user._key, uuid: refreshId },
            secret: String(REFRESH_KEY),
          })

          // if the user does not want to stay logged in, create http session cookie
          let cookieData = {
            httpOnly: true,
            secure: true,
            sameSite: true,
            expires: 0,
          }

          // if user wants to stay logged in create normal http cookie
          if (rememberMe) {
            const tokenMaxAgeSeconds = jwt.decode(refreshToken).exp - jwt.decode(refreshToken).iat
            cookieData = {
              maxAge: tokenMaxAgeSeconds * 1000,
              httpOnly: true,
              secure: true,
              sameSite: true,
            }
          }

          response.cookie('refresh_token', refreshToken, cookieData)

          console.info(`User: ${user._key} successfully signed in, and sent auth msg.`)

          return {
            _type: 'regular',
            token,
            user,
          }
        }
      } else {
        // increment failed login attempts
        user.failedLoginAttempts += 1

        try {
          // Increase users failed login attempts
          await trx.step(
            () => query`
              WITH users
              FOR u IN users
                UPDATE ${user._key} WITH {
                  failedLoginAttempts: ${user.failedLoginAttempts}
                } IN users
            `,
          )
        } catch (err) {
          console.error(
            `Trx step error occurred when incrementing failed login attempts for user: ${user._key}: ${err}`,
          )
          await trx.abort()
          throw new Error(i18n._(t`Unable to sign in, please try again.`))
        }

        try {
          await trx.commit()
        } catch (err) {
          console.error(`Trx commit error occurred while user: ${user._key} failed to sign in: ${err}`)
          await trx.abort()
          throw new Error(i18n._(t`Unable to sign in, please try again.`))
        }

        console.warn(`User attempted to authenticate: ${user._key} with invalid credentials.`)
        return {
          _type: 'error',
          code: 400,
          description: i18n._(t`Incorrect username or password. Please try again.`),
        }
      }
    }
  },
})
