import { t } from '@lingui/macro'
import { GraphQLError } from 'graphql'
import jwt from 'jsonwebtoken'

const { AUTHENTICATED_KEY } = process.env

export const verifyToken =
  ({ i18n }) =>
  ({ token, secret = String(AUTHENTICATED_KEY) }) => {
    let decoded
    try {
      decoded = jwt.verify(token, secret)
    } catch (err) {
      console.warn('JWT was attempted to be verified but secret was incorrect.')
      throw new GraphQLError(i18n._(t`Invalid token, please sign in.`), { extensions: { code: 'UNAUTHENTICATED' } })
    }
    return decoded.parameters
  }
