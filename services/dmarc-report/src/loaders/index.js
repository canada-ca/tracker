const { loadArangoDates } = require('./load-arango-dates')
const { loadArangoThirtyDaysCount } = require('./load-arango-thirty-days-count')
const { loadCategoryTotals } = require('./load-category-totals')
const { loadCheckDomain } = require('./load-check-domain')
const { loadCheckOrg } = require('./load-check-org')
const { loadCosmosDates } = require('./load-cosmos-dates')
const { loadDkimFailureTable } = require('./load-dkim-failure-table')
const { loadDmarcFailureTable } = require('./load-dmarc-failure-table')
const { loadFullPassTable } = require('./load-full-pass-table')
const { loadOrgOwner } = require('./load-org-owner')
const { loadDomainOwnership } = require('./load-ownerships')
const { loadSpfFailureTable } = require('./load-spf-failure-table')

module.exports = {
  loadArangoDates,
  loadArangoThirtyDaysCount,
  loadCategoryTotals,
  loadCheckDomain,
  loadCheckOrg,
  loadCosmosDates,
  loadDkimFailureTable,
  loadDmarcFailureTable,
  loadFullPassTable,
  loadOrgOwner,
  loadDomainOwnership,
  loadSpfFailureTable,
}
