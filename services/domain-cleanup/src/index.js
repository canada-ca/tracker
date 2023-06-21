const { domainCleanupService } = require('./domain-cleanup-service')
const { unclaimedCleanupService } = require('./unclaimed-cleanup-service')

module.exports = {
  domainCleanupService,
  unclaimedCleanupService,
}
