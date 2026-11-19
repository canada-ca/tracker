/** Barrel file: re-exports the payload builders and recipient helper from this directory. */
const { buildOrgFootprintPayload, addServiceAccountToRecipients } = require('./org-footprint-changes')
const { buildNewEnrollmentEmailPayload } = require('./new-cvd-enrollments')
const { buildPendingUsersPayload } = require('./pending-users')

module.exports = {
  buildNewEnrollmentEmailPayload,
  buildOrgFootprintPayload,
  buildPendingUsersPayload,
  addServiceAccountToRecipients,
}
