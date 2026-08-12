import jwt from 'jsonwebtoken'

const { AUTHENTICATED_KEY } = process.env

export const tokenize = ({ expiresIn = '15m', parameters = {}, secret = String(AUTHENTICATED_KEY) }) =>
  jwt.sign(
    {
      parameters,
    },
    secret,
    { algorithm: 'HS256', expiresIn: expiresIn },
  )
