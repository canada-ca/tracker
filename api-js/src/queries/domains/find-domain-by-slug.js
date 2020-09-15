const { GraphQLNonNull } = require('graphql')
const { Slug } = require('../../scalars')
const { domainType } = require('../../types')

const findDomainBySlug = {
  type: domainType,
  description: 'Select information on a specific domain using a slug.',
  args: {
    urlSlug: {
      type: GraphQLNonNull(Slug),
      description: 'The slugified domain you want to retrieve data for.',
    },
  },
  resolve: async () => {},
}

module.exports = {
  findDomainBySlug,
}
