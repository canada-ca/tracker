const { GraphQLID, GraphQLNonNull } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { Slug, Url, Selectors } = require('../../scalars')
const { domainType } = require('../../types')

const updateDomain = new mutationWithClientMutationId({
  name: 'UpdateDomain',
  description:
    'Mutation allows the modification of domains if domain is updated through out its life-cycle',
  inputFields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLID),
      description: 'The global id of the domain that is being updated.',
    },
    orgSlug: {
      type: Slug,
      description:
        'The organiztaion slug that the domain is being reassigned to.',
    },
    url: {
      type: Url,
      description: 'The new url of the of the old domain.',
    },
    selectors: {
      type: Selectors,
      description:
        'The updated DKIM selector strings corresponding to this domain.',
    },
  }),
  outputFields: () => ({
    domain: {
      type: domainType,
      description: 'The updated domain.',
      resolve: async () => {},
    },
  }),
  mutateAndGetPayload: async () => {},
})

module.exports = {
  updateDomain,
}
