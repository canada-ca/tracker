import { t } from '@lingui/macro'
import jwt from 'jsonwebtoken'

const { AUTHENTICATED_KEY } = process.env

export const verifyToken = ({ i18n }) => ({
  token,
  secret = String(AUTHENTICATED_KEY),
}) => {
  let decoded
  try {
    decoded = jwt.verify(token, secret)
  } catch (err) {
    console.warn('JWT was attempted to be verified but secret was incorrect.')
    throw new Error(i18n._(t`Invalid token, please sign in.`))
  }
  return decoded.parameters
}
