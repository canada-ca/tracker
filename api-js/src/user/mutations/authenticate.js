import { GraphQLNonNull, GraphQLString, GraphQLInt } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { t } from '@lingui/macro'
import { authenticateUnion } from '../unions'

const { SIGN_IN_KEY } = process.env

export const authenticate = new mutationWithClientMutationId({
  name: 'Authenticate',
  description:
    'This mutation allows users to give their credentials and retrieve a token that gives them access to restricted content.',
  inputFields: () => ({
    authenticationCode: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'Security code found in text msg, or email inbox.',
    },
    authenticateToken: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The JWT that is retrieved from the sign in mutation.',
    },
  }),
  outputFields: () => ({
    result: {
      type: authenticateUnion,
      description:
        'Authenticate union returning either a `authResult` or `authenticateError` object.',
      resolve: (payload) => payload,
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      query,
      auth: { tokenize, verifyToken },
      loaders: { loadUserByKey },
      validators: { cleanseInput },
    },
  ) => {
    // Cleanse Inputs
    const authenticationCode = args.authenticationCode
    const authenticationToken = cleanseInput(args.authenticateToken)

    // Gather token parameters
    const tokenParameters = verifyToken({
      token: authenticationToken,
      secret: String(SIGN_IN_KEY),
    })

    if (
      tokenParameters.userKey === 'undefined' ||
      typeof tokenParameters.userKey === 'undefined'
    ) {
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
      console.warn(
        `User: ${tokenParameters.userKey} attempted to authenticate, no account is associated with this id.`,
      )
      return {
        _type: 'error',
        code: 400,
        description: i18n._(t`Unable to authenticate. Please try again.`),
      }
    }

    // Check to see if security token matches the user submitted one
    if (authenticationCode === user.tfaCode) {
      const token = tokenize({ parameters: { userKey: user._key } })

      // Reset Failed Login attempts
      try {
        await query`
          WITH users
          FOR u IN users
            UPDATE ${user._key} WITH { tfaCode: null } IN users
        `
      } catch (err) {
        console.error(
          `Database error ocurred when resetting failed attempts for user: ${user._key} during authentication: ${err}`,
        )
        throw new Error(i18n._(t`Unable to authenticate. Please try again.`))
      }

      console.info(
        `User: ${user._key} successfully authenticated their account.`,
      )
      user.id = user._key

      return {
        _type: 'authResult',
        token,
        user,
      }
    } else {
      console.warn(
        `User: ${user._key} attempted to authenticate their account, however the tfaCodes did not match.`,
      )
      throw new Error(i18n._(t`Incorrect TFA code. Please sign in again.`))
    }
  },
})
