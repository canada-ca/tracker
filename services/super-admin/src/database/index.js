const { checkForSuperAdminAccount } = require('./check-for-super-admin-account')
const {
  checkForSuperAdminAffiliation,
} = require('./check-for-super-admin-affiliation')
const { checkForSuperAdminOrg } = require('./check-for-super-admin-org')
const { createSuperAdminAccount } = require('./create-super-admin-account')
const {
  createSuperAdminAffiliation,
} = require('./create-super-admin-affiliation')
const { createSuperAdminOrg } = require('./create-super-admin-org')
const { removeSuperAdminAffiliation } = require('./remove-super-admin-affiliation')

module.exports = {
  checkForSuperAdminAccount,
  checkForSuperAdminAffiliation,
  checkForSuperAdminOrg,
  createSuperAdminAccount,
  createSuperAdminAffiliation,
  createSuperAdminOrg,
  removeSuperAdminAffiliation
}
