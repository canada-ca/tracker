const { checkClaim } = require('./check-claim')
const { checkDomain } = require('./check-domain')
const { checkOrganization } = require('./check-organization')
const { createClaim } = require('./create-claim')
const { createDomain } = require('./create-domain')
const { createOrganization } = require('./create-organization')
const { removeEdges } = require('./remove-edges')
const { saltedHash } = require('./salted-hash')
const slugify = require('./slugify')

module.exports = {
  checkClaim,
  checkDomain,
  checkOrganization,
  createClaim,
  createDomain,
  createOrganization,
  removeEdges,
  saltedHash,
  ...slugify,
}
