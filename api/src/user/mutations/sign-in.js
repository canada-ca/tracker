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
      uuidv4,
      response,
      jwt,
      auth: { tokenize, bcrypt },
      dataSources: { user: userDataSource },
      validators: { cleanseInput },
      notify: { sendAuthEmail, sendAuthTextMsg },
    },
  ) => {
    // Cleanse input
    const userName = cleanseInput(args.userName).toLowerCase()
    const password = cleanseInput(args.password)
    const rememberMe = args.rememberMe

    // Gather user who just signed in
    let user = await userDataSource.byUserName.load(userName)

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
      const trx = await userDataSource.createTransaction()

      // Check to see if passwords match
      if (bcrypt.compareSync(password, user.password)) {
        await userDataSource.signInResetFailedLoginAttempts({ userKey: user._key, trx })

        const refreshId = uuidv4()
        const refreshInfo = {
          refreshId,
          expiresAt: new Date(new Date().getTime() + ms(String(REFRESH_TOKEN_EXPIRY))),
          rememberMe,
        }

        if (user.tfaSendMethod !== 'none') {
          // Generate TFA code
          const tfaCode = Math.floor(100000 + Math.random() * 900000)

          await userDataSource.signInSetTfaCodeAndRefreshInfo({ userKey: user._key, tfaCode, refreshInfo, trx })
          await userDataSource.commitSignInTransaction({ trx, userKey: user._key, type: 'tfa' })

          // Get newly updated user
          await userDataSource.byUserName.clear(userName)
          user = await userDataSource.byUserName.load(userName)

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
          await userDataSource.signInSetRefreshInfoAndLastLogin({ userKey: user._key, refreshInfo, loginDate, trx })
          await userDataSource.commitSignInTransaction({ trx, userKey: user._key, type: 'regular' })

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
            cookieData = {
              maxAge: ms(String(REFRESH_TOKEN_EXPIRY)),
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

        await userDataSource.signInIncrementFailedLoginAttempts({
          userKey: user._key,
          failedLoginAttempts: user.failedLoginAttempts,
        })

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
