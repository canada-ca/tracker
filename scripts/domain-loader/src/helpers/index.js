const { addOrganizationsDomains } = require('../add-organizations-domains')
const { alignOrganizationsDomains } = require('../align-organizations-domains')
const { checkClaimCount } = require('./check-claim-count')
const { checkDomain } = require('./check-domain')
const { checkOrganization } = require('./check-organization')
const { createClaim } = require('./create-claim')
const { createDomain } = require('./create-domain')
const { createOrganization } = require('./create-organization')
const slugify = require('./slugify')

module.exports = {
  addOrganizationsDomains,
  alignOrganizationsDomains,
  checkClaimCount,
  checkDomain,
  checkOrganization,
  createClaim,
  createDomain,
  createOrganization,
  ...slugify,
}
