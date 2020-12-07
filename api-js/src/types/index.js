const baseTypes = require('./base')
const { authResultType } = require('./auth-result')
const { categorizedSummaryType } = require('./categorized-summary')
const { nodeField, nodeInterface } = require('./node')

module.exports = {
  // Node Types
  nodeField,
  nodeInterface,
  // Base Types
  authResultType,
  categorizedSummaryType,
  ...baseTypes,
}
