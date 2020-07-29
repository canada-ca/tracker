const jwt = require('jsonwebtoken')

const { JWT_KEY } = process.env

const now = () => Math.floor(new Date().getTime() / 1000)
const future = (expPeriod) =>
  Math.floor(new Date((now() + expPeriod * 3600) * 1000) / 1000)

const tokenize = ({
  parameters = {},
  expPeriod = 1,
  iat = now(),
  exp = future(expPeriod),
  secret = String(JWT_KEY),
}) =>
  jwt.sign(
    {
      exp,
      iat,
      parameters,
    },
    secret,
    { algorithm: 'HS256' },
  )

module.exports = {
  tokenize,
}
