const { affiliationLoaderByKey } = require('./load-user-affiliations-by-key')
const {
  affiliationLoaderByUserId,
} = require('./load-user-affiliations-by-user-id')
const {
  affiliationLoaderByOrgId,
} = require('./load-user-affiliations-by-org-id')

module.exports = {
  affiliationLoaderByKey,
  affiliationLoaderByUserId,
  affiliationLoaderByOrgId,
}
