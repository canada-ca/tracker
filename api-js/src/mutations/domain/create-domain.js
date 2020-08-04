const { GraphQLNonNull } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { GraphQLURL } = require('graphql-scalars')
const { Slug, Selectors } = require('../../scalars')
const { domainType } = require('../../types')

const createDomain = new mutationWithClientMutationId({
  name: 'CreateDomain',
  description: 'Mutation used to create a new domain for an organization.',
  inputFields: () => ({
    orgSlug: {
      type: GraphQLNonNull(Slug),
      description:
        'The slug of the organization you wish to assign this domain to.',
    },
    url: {
      type: GraphQLNonNull(GraphQLURL),
      description: 'Url that you would like to be added to the database.',
    },
    selectors: {
      type: Selectors,
      description: 'DKIM selector strings corresponding to this domain.',
    },
  }),
  outputFields: () => ({
    domain: {
      type: domainType,
      description: 'The newly created domain.',
      resolve: async () => {},
    },
  }),
  mutateAndGetPayload: async () => {},
})

module.exports = {
  createDomain,
}
