const { findDomainBySlug } = require('./find-domain-by-slug')
const { findDomainsByOrg } = require('./find-domains-by-org')
const { findMyDomains } = require('./find-my-domains')

module.exports = {
  findDomainBySlug,
  findDomainsByOrg,
  findMyDomains,
}
