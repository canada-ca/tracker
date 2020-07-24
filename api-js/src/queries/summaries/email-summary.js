const { categorizedSummaryType } = require('../../types')

const emailSummary = {
  type: categorizedSummaryType,
  description: 'Email summary computed values, used to build summary cards.',
  resolve: async () => {},
}

const demoEmailSummary = {
  type: categorizedSummaryType,
  description:
    'Demo email summary computed values, used to build summary cards.',
  resolve: async () => {},
}

module.exports = {
  emailSummary,
  demoEmailSummary,
}
