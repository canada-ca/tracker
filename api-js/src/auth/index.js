const { checkDomainOwnership } = require('./check-domain-ownership')
const { checkDomainPermission } = require('./check-domain-permission')
const { checkPermission } = require('./check-permission')
const { tokenize } = require('./generate-jwt')
const { userRequired } = require('./user-required')
const { verifyToken } = require('./verify-jwt')

module.exports = {
  checkDomainOwnership,
  checkDomainPermission,
  checkPermission,
  tokenize,
  userRequired,
  verifyToken,
}
