const dmarcReportLoaders = require('./dmarc-report')
const domainLoaders = require('./domains')
const orgLoaders = require('./organizations')
const userLoaders = require('./user')

module.exports = {
  // Dmarc Report Loaders
  ...dmarcReportLoaders,
  // Domain loaders
  ...domainLoaders,
  // Org Loaders
  ...orgLoaders,
  // User Loaders
  ...userLoaders,
}
