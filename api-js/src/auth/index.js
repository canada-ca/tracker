const { tokenize } = require('./generate-jwt')
const { verifyToken } = require('./verify-jwt')

module.exports = {
  tokenize,
  verifyToken,
}
