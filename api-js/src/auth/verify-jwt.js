const jwt = require('jsonwebtoken')

const { JWT_KEY } = process.env

const verifyToken = (token) => {
  const decoded = jwt.verify(token, String(JWT_KEY))
  return decoded.parameters
}

module.exports = {
  verifyToken,
}
