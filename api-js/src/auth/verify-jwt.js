const jwt = require('jsonwebtoken')

const { AUTHENTICATED_KEY } = process.env

const verifyToken = ({ token, secret = String(AUTHENTICATED_KEY) }) => {
  let decoded
  try {
    decoded = jwt.verify(token, secret)
  } catch (err) {
    console.warn('JWT was attempted to be verified but secret was incorrect.')
    throw new Error('Invalid token, please request a new one.')
  }
  return decoded.parameters
}

module.exports = {
  verifyToken,
}
