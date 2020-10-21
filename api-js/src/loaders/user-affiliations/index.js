const {
  affiliationLoaderByUserId,
} = require('./load-user-affiliations-by-user-id')
const { affiliationLoaderByKey } = require('./load-user-affiliations-by-key')

module.exports = {
  affiliationLoaderByUserId,
  affiliationLoaderByKey,
}
