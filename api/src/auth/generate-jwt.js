import jwt from 'jsonwebtoken'

const {AUTHENTICATED_KEY} = process.env

const now = () => Math.floor(new Date().getTime() / 1000)

const future = (expPeriod) =>
  Math.floor(new Date((now() + expPeriod * 3600) * 1000) / 1000)

export const tokenize = ({
                           parameters = {},
                           expPeriod = 1,
                           iat = now(),
                           exp = future(expPeriod),
                           secret = String(AUTHENTICATED_KEY),
                         }) =>
  jwt.sign(
    {
      exp,
      iat,
      parameters,
    },
    secret,
    {algorithm: 'HS256'},
  )
