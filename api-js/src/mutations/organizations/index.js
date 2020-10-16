const { createOrganization } = require('./create-organization')
const { removeOrganization } = require('./remove-organization')
const { updateOrganization } = require('./update-organization')

module.exports = {
  createOrganization,
  removeOrganization,
  updateOrganization,
}
