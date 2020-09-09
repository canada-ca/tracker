const { categorizedSummaryType } = require('../../types')

const webSummary = {
  type: categorizedSummaryType,
  description: 'Web summary computed values, used to build summary cards.',
  resolve: async () => {},
}

const demoWebSummary = {
  type: categorizedSummaryType,
  description: 'Demo web summary computed values, used to build summary cards.',
  resolve: async () => {},
}

module.exports = {
  webSummary,
  demoWebSummary,
}
