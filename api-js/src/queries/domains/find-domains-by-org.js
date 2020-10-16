const { GraphQLNonNull } = require('graphql')
const { connectionArgs } = require('graphql-relay')
const { Slug } = require('../../scalars')
const { domainConnection } = require('../../types')

const findDomainsByOrg = {
  type: domainConnection.connectionType,
  description: 'Select domains belonging to a given organization.',
  args: {
    orgSlug: {
      type: GraphQLNonNull(Slug),
      description:
        'The slugified name of the organization you wish to retrieve data for.',
    },
    ...connectionArgs,
  },
  resolve: async () => {},
}

module.exports = {
  findDomainsByOrg,
}
