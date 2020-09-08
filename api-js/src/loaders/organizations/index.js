const { orgLoaderById } = require('./load-organization-by-id')
const { orgLoaderBySlug } = require('./load-organization-by-slug')
const { orgLoaderByConnectionArgs } = require('./load-organizations-by-connection-args')

module.exports = {
  orgLoaderById,
  orgLoaderBySlug,
  orgLoaderByConnectionArgs,
}
