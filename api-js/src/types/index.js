const baseTypes = require('./base')
const verifiedTypes = require('./base/verified-objects')
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
  // Verified Types
  ...verifiedTypes,
}
