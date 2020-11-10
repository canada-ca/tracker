const { createOrganization } = require('./create-organization')
const { removeOrganization } = require('./remove-organization')
const { updateOrganization } = require('./update-organization')
const { verifyOrganization } = require('./verify-organization')

module.exports = {
  createOrganization,
  removeOrganization,
  updateOrganization,
  verifyOrganization,
}
