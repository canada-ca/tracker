const { GraphQLNonNull } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { Slug, Url, Selectors } = require('../../scalars')
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
      type: GraphQLNonNull(Url),
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
      resolve: async (payload) => {
        return payload.domain
      },
    },
  }),
  mutateAndGetPayload: async () => {},
})

module.exports = {
  createDomain,
}
