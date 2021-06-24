import { t } from '@lingui/macro'
import { GraphQLNonNull, GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'

import { refreshTokensUnion } from '../unions'

const { AUTHENTICATED_KEY, REFRESH_KEY } = process.env

export const refreshTokens = new mutationWithClientMutationId({
  name: 'RefreshTokens',
  description:
    'This mutation allows users to give their current auth token, and refresh token, and receive a freshly updated auth token.',
  inputFields: () => ({
    authToken: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The users current authentication token.',
    },
    refreshToken: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The users current refresh token.',
    },
  }),
  outputFields: () => ({
    result: {
      type: refreshTokensUnion,
      description:
        'Refresh tokens union returning either a `authResult` or `authenticateError` object.',
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
      jwt,
      auth: { tokenize },
      loaders: { loadUserByKey },
      validators: { cleanseInput },
    },
  ) => {
    // cleanse inputs
    const authToken = cleanseInput(args.authToken)
    const refreshToken = cleanseInput(args.refreshToken)

    // verify auth token ignoring expiration
    let decodedAuthToken
    try {
      decodedAuthToken = jwt.verify(authToken, AUTHENTICATED_KEY, {
        ignoreExpiration: true,
      })
    } catch (err) {
      console.warn(
        `User attempted to verify auth token to refresh it, however secret was incorrect: ${err}`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to refresh tokens, please sign in.`),
      }
    }

    // verify refresh token
    let decodedRefreshToken
    try {
      decodedRefreshToken = jwt.verify(refreshToken, REFRESH_KEY)
    } catch (err) {
      console.warn(
        `User attempted to verify refresh token, however it is invalid: ${err}`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to refresh tokens, please sign in.`),
      }
    }

    // get info from tokens
    const { userKey: authUserKey } = decodedAuthToken.parameters
    const { userKey: refreshUserKey, uuid: refreshId } =
      decodedRefreshToken.parameters

    // user keys do not match
    if (authUserKey !== refreshUserKey) {
      console.warn(
        `User attempted to refresh their tokens however there was a mismatch with user keys authUserKey: ${authUserKey} !== refreshUserKey: ${refreshUserKey}`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to refresh tokens, please sign in.`),
      }
    }

    const user = await loadUserByKey.load(authUserKey)

    // refresh token expired
    if (user.refreshId !== refreshId) {
      console.warn(
        `User: ${authUserKey} attempted to refresh tokens with an old refresh token.`,
      )
      return {
        type: '_error',
        code: 400,
        description: i18n._(t`Unable to refresh tokens, please sign in.`),
      }
    }

    const newRefreshId = uuidv4()

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
            INSERT { refreshId: ${newRefreshId} }
            UPDATE { refreshId: ${newRefreshId} }
            IN users
        `,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred when attempting to refresh tokens for user: ${authUserKey}: ${err}`,
      )
      throw new Error(i18n._(t`Unable to refresh tokens, please sign in.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Trx commit error occurred while user: ${user._key} attempted to refresh tokens: ${err}`,
      )
      throw new Error(i18n._(t`Unable to refresh tokens, please sign in.`))
    }

    const newAuthToken = tokenize({ parameters: { userKey: user._key } })
    const newRefreshToken = tokenize({
      parameters: { userKey: user._key, uuid: newRefreshId },
      expPeriod: 168,
      secret: String(REFRESH_KEY),
    })

    console.info(`User: ${user._key} successfully refreshed their tokens.`)

    return {
      _type: 'authResult',
      token: newAuthToken,
      refreshToken: newRefreshToken,
      user,
    }
  },
})
