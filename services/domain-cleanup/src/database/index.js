const { getNXDomains } = require('./get-nxdomains')
const { findDomainClaims } = require('./find-domain-claims')
const { findUnclaimedDomains } = require('./find-unclaimed-domains')
const { getNewDomains } = require('./get-new-domains')

module.exports = { getNXDomains, findDomainClaims, findUnclaimedDomains, getNewDomains }
