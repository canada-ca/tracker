const { GraphQLNonNull } = require('graphql')
const { Slug } = require('../../scalars')
const { organizationType } = require('../../types')

const findOrganizationBySlug = {
  type: organizationType,
  description:
    'Select all information on a selected organization that a user has access to.',
  args: {
    orgSlug: {
      type: GraphQLNonNull(Slug),
      description:
        'The slugified organization name you want to retrieve data for.',
    },
  },
  resolve: async () => {},
}

module.exports = {
  findOrganizationBySlug,
}
