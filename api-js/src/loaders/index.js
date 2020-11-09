const dmarcReportLoaders = require('./dmarc-report')
const domainLoaders = require('./domains')
const emailScanLoaders = require('./email-scan')
const guidanceLoaders = require('./guidance-tags')
const orgLoaders = require('./organizations')
const userLoaders = require('./user')
const webScanLoaders = require('./web-scan')
const userAffiliationLoaders = require('./user-affiliations')

module.exports = {
  // Dmarc Report Loaders
  ...dmarcReportLoaders,
  // Domain loaders
  ...domainLoaders,
  // Email Scan Loaders
  ...emailScanLoaders,
  // Guidance Tag Loaders
  ...guidanceLoaders,
  // Org Loaders
  ...orgLoaders,
  // User Loaders
  ...userLoaders,
  // Web Scan Loaders
  ...webScanLoaders,
  // User Affiliation Loaders
  ...userAffiliationLoaders,
}
