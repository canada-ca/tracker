import { t } from '@lingui/macro'
import { mutationWithClientMutationId } from 'graphql-relay'

import { refreshTokensUnion } from '../unions'

const { REFRESH_TOKEN_EXPIRY, REFRESH_KEY } = process.env

export const refreshTokens = new mutationWithClientMutationId({
  name: 'RefreshTokens',
  description:
    'This mutation allows users to give their current auth token, and refresh token, and receive a freshly updated auth token.',
  outputFields: () => ({
    result: {
      type: refreshTokensUnion,
      description:
        'Refresh tokens union returning either a `authResult` or `authenticateError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    _,
    {
      i18n,
      response,
      request,
      query,
      collections,
      transaction,
      uuidv4,
      jwt,
      moment,
      auth: { tokenize },
      loaders: { loadUserByKey },
    },
  ) => {
    // check uuid matches
    let refreshToken
    if ('refresh_token' in request.cookies) {
      refreshToken = request.cookies.refresh_token
    }

    if (typeof refreshToken === 'undefined') {
      console.warn(
        `User attempted to refresh tokens without refresh_token set.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to refresh tokens, please sign in.`),
      }
    }

    let decodedRefreshToken
    try {
      decodedRefreshToken = jwt.verify(refreshToken, REFRESH_KEY)
    } catch (err) {
      console.warn(
        `User attempted to verify refresh token, however the token is invalid: ${err}`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to refresh tokens, please sign in.`),
      }
    }

    const { userKey, uuid } = decodedRefreshToken.parameters

    const user = await loadUserByKey.load(userKey)

    if (typeof user === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to refresh tokens with an invalid user id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to refresh tokens, please sign in.`),
      }
    }

    // check to see if refresh token is expired
    const currentTime = moment().format()
    const expiryTime = moment(user.refreshInfo.expiresAt).format()

    if (moment(currentTime).isAfter(expiryTime)) {
      console.warn(
        `User: ${userKey} attempted to refresh tokens with an expired uuid.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to refresh tokens, please sign in.`),
      }
    }

    // check to see if token ids match
    if (user.refreshInfo.refreshId !== uuid) {
      console.warn(
        `User: ${userKey} attempted to refresh tokens with non matching uuids.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to refresh tokens, please sign in.`),
      }
    }

    const newRefreshId = uuidv4()

    const refreshInfo = {
      refreshId: newRefreshId,
      rememberMe: user.refreshInfo.rememberMe,
      expiresAt: new Date(
        new Date().getTime() + REFRESH_TOKEN_EXPIRY * 60 * 24 * 60 * 1000,
      ),
    }

    // Generate list of collections names
    const collectionStrings = []
    for (const property in collections) {
      collectionStrings.push(property.toString())
    }

    // Setup Transaction
    const trx = await transaction(collectionStrings)

    try {
      await trx.step(
        () => query`
          WITH users
          UPSERT { _key: ${user._key} }
            INSERT { refreshInfo: ${refreshInfo} }
            UPDATE { refreshInfo: ${refreshInfo} }
            IN users
        `,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred when attempting to refresh tokens for user: ${userKey}: ${err}`,
      )
      throw new Error(i18n._(t`Unable to refresh tokens, please sign in.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Trx commit error occurred while user: ${userKey} attempted to refresh tokens: ${err}`,
      )
      throw new Error(i18n._(t`Unable to refresh tokens, please sign in.`))
    }

    const newAuthToken = tokenize({ parameters: { userKey } })

    console.info(`User: ${userKey} successfully refreshed their tokens.`)

    const newRefreshToken = tokenize({
      parameters: { userKey: user._key, uuid: newRefreshId },
      expPeriod: 168,
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
      cookieData = {
        maxAge: REFRESH_TOKEN_EXPIRY * 60 * 24 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: true,
      }
    }

    response.cookie('refresh_token', newRefreshToken, cookieData)

    return {
      _type: 'authResult',
      token: newAuthToken,
      user,
    }
  },
})
