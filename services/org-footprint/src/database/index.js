const { getOrgAdmins } = require('./get-org-admins')
const { getAllOrgKeys } = require('./get-all-org-keys')
const { getNewAuditLogs } = require('./get-new-audit-logs')
const { getBilingualOrgNames } = require('./get-bilingual-org-names')

module.exports = { getOrgAdmins, getAllOrgKeys, getNewAuditLogs, getBilingualOrgNames }
