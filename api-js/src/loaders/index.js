const dmarcReportLoaders = require('./dmarc-report')
const domainLoaders = require('./domains')
const emailScanLoaders = require('./email-scan')
const orgLoaders = require('./organizations')
const userLoaders = require('./user')
const webScanLoaders = require('./web-scan')

module.exports = {
  // Dmarc Report Loaders
  ...dmarcReportLoaders,
  // Domain loaders
  ...domainLoaders,
  // Email Scan Loaders
  ...emailScanLoaders,
  // Org Loaders
  ...orgLoaders,
  // User Loaders
  ...userLoaders,
  // Web Scan Loaders
  ...webScanLoaders,
}
