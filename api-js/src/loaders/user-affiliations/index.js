const {
  affiliationLoaderByUserId,
} = require('./load-user-affiliations-by-user-id')
const {
  affiliationLoaderByOrgId,
} = require('./load-user-affiliations-by-org-id')
const { affiliationLoaderByKey } = require('./load-user-affiliations-by-key')

module.exports = {
  affiliationLoaderByUserId,
  affiliationLoaderByOrgId,
  affiliationLoaderByKey,
}
