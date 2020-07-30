const jwt = require('jsonwebtoken')

const { JWT_KEY } = process.env

const verifyToken = (token) => {
  let decoded
  try {
    decoded = jwt.verify(token, String(JWT_KEY))
  } catch (err) {
    console.warn('JWT was attempted to be verified but secret was incorrect.')
    throw new Error('Invalid token, please sign in again.')
  }
  return decoded.parameters
}

module.exports = {
  verifyToken,
}
