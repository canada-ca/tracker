const { userLoaderByUserName } = require('./load-user-by-username')
const { userLoaderById } = require('./load-users-by-id')

module.exports = {
  userLoaderByUserName,
  userLoaderById,
}
