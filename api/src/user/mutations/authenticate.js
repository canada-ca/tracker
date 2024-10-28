import { GraphQLNonNull, GraphQLString, GraphQLInt } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'
import { authenticateUnion } from '../unions'
import { TfaSendMethodEnum } from '../../enums'
import ms from 'ms'

const { REFRESH_KEY, REFRESH_TOKEN_EXPIRY, AUTHENTICATED_KEY, SIGN_IN_KEY, AUTH_TOKEN_EXPIRY } = process.env

export const authenticate = new mutationWithClientMutationId({
  name: 'Authenticate',
  description:
    'This mutation allows users to give their credentials and retrieve a token that gives them access to restricted content.',
  inputFields: () => ({
    sendMethod: {
      type: new GraphQLNonNull(TfaSendMethodEnum),
      description: 'The method that the user wants to receive their authentication code by.',
    },
    authenticationCode: {
      type: new GraphQLNonNull(GraphQLInt),
      description: 'Security code found in text msg, or email inbox.',
    },
    authenticateToken: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The JWT that is retrieved from the sign in mutation.',
    },
  }),
  outputFields: () => ({
    result: {
      type: authenticateUnion,
      description: 'Authenticate union returning either a `authResult` or `authenticateError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      response,
      query,
      collections,
      transaction,
      uuidv4,
      jwt,
      auth: { tokenize, verifyToken },
      loaders: { loadUserByKey },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse Inputs
    const authenticationCode = args.authenticationCode
    const authenticationToken = cleanseInput(args.authenticateToken)
    const sendMethod = cleanseInput(args.sendMethod)

    // Gather token parameters
    const tokenParameters = verifyToken({
      token: authenticationToken,
      secret: String(SIGN_IN_KEY),
    })

    if (tokenParameters.userKey === 'undefined' || typeof tokenParameters.userKey === 'undefined') {
      console.warn(`Authentication token does not contain the userKey`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Token value incorrect, please sign in again.`),
      }
    }

    // Gather sign in user
    const user = await loadUserByKey.load(tokenParameters.userKey)

    // Replace with userRequired()
    if (typeof user === 'undefined') {
      console.warn(`User: ${tokenParameters.userKey} attempted to authenticate, no account is associated with this id.`)
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to authenticate. Please try again.`),
      }
    }

    // Check to see if security token matches the user submitted one
    if (authenticationCode === user.tfaCode) {
      const refreshId = uuidv4()
      const loginDate = new Date().toISOString()

      const refreshInfo = {
        refreshId,
        rememberMe: user.refreshInfo.rememberMe,
        expiresAt: new Date(new Date().getTime() + ms(REFRESH_TOKEN_EXPIRY)),
      }

      // Setup Transaction
      const trx = await transaction(collections)

      // Reset tfa code attempts, and set refresh code
      try {
        await trx.step(
          () => query`
            WITH users
            UPSERT { _key: ${user._key} }
              INSERT {
                tfaCode: null,
                refreshInfo: ${refreshInfo},
                lastLogin: ${loginDate}
              }
              UPDATE {
                tfaCode: null,
                refreshInfo: ${refreshInfo},
                lastLogin: ${loginDate}
              }
              IN users
          `,
        )
      } catch (err) {
        console.error(
          `Trx step error occurred when clearing tfa code and setting refresh id for user: ${user._key} during authentication: ${err}`,
        )
        await trx.abort()
        throw new Error(i18n._(t`Unable to authenticate. Please try again.`))
      }

      // verify user email
      if (sendMethod === 'email' && !user.emailValidated) {
        try {
          await trx.step(
            () => query`
              WITH users
              UPSERT { _key: ${user._key} }
                INSERT {
                  emailValidated: true,
                }
                UPDATE {
                  emailValidated: true,
                }
                IN users
            `,
          )
          user.emailValidated = true
        } catch (err) {
          console.error(
            `Trx step error occurred when setting email validated to true for user: ${user._key} during authentication: ${err}`,
          )
          await trx.abort()
          throw new Error(i18n._(t`Unable to authenticate. Please try again.`))
        }
      }

      try {
        await trx.commit()
      } catch (err) {
        console.error(`Trx commit error occurred while user: ${user._key} attempted to authenticate: ${err}`)
        await trx.abort()
        throw new Error(i18n._(t`Unable to authenticate. Please try again.`))
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
      if (user.refreshInfo.rememberMe) {
        const tokenMaxAgeSeconds = jwt.decode(refreshToken).exp - jwt.decode(refreshToken).iat
        cookieData = {
          maxAge: tokenMaxAgeSeconds * 1000,
          httpOnly: true,
          secure: true,
          sameSite: true,
        }
      }

      response.cookie('refresh_token', refreshToken, cookieData)

      console.info(`User: ${user._key} successfully authenticated their account.`)

      return {
        _type: 'authResult',
        token,
        user,
      }
    } else {
      console.warn(`User: ${user._key} attempted to authenticate their account, however the tfaCodes did not match.`)
      // reset tfa code
      const trx = await transaction(collections)
      try {
        await trx.step(
          () => query`
            WITH users
            UPSERT { _key: ${user._key} }
              INSERT {
                tfaCode: null,
              }
              UPDATE {
                tfaCode: null,
              }
              IN users
          `,
        )
      } catch (err) {
        console.error(
          `Trx step error occurred when clearing tfa code on attempt timeout for user: ${user._key} during authentication: ${err}`,
        )
        await trx.abort()
        throw new Error(i18n._(t`Incorrect TFA code. Please sign in again.`))
      }

      try {
        await trx.commit()
      } catch (err) {
        console.error(`Trx commit error occurred while user: ${user._key} attempted to authenticate: ${err}`)
        await trx.abort()
        throw new Error(i18n._(t`Incorrect TFA code. Please sign in again.`))
      }
      throw new Error(i18n._(t`Incorrect TFA code. Please sign in again.`))
    }
  },
})
