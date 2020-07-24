const { GraphQLNonNull, GraphQLString } = require('graphql')
const { mutationWithClientMutationId } = require('graphql-relay')
const { Acronym } = require('../../scalars')
const { organizationType } = require('../../types')

const createOrganization = new mutationWithClientMutationId({
  name: 'CreateOrganization',
  description:
    'This mutation allows the creation of an organization inside the database.',
  inputFields: () => ({
    acronymEN: {
      type: GraphQLNonNull(Acronym),
      description: 'The English acronym of the organization.',
    },
    acronymFR: {
      type: GraphQLNonNull(Acronym),
      description: 'The French acronym of the organization.',
    },
    nameEN: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The English name of the organization.',
    },
    nameFR: {
      type: GraphQLNonNull(GraphQLString),
      description: 'The French name of the organization.',
    },
    zoneEN: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The English translation of the zone the organization belongs to.',
    },
    zoneFR: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The English translation of the zone the organization belongs to.',
    },
    sectorEN: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The English translation of the sector the organization belongs to.',
    },
    sectorFR: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The French translation of the sector the organization belongs to.',
    },
    countryEN: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The English translation of the country the organization resides in.',
    },
    countryFR: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The French translation of the country the organization resides in.',
    },
    provinceEN: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The English translation of the province the organization resides in.',
    },
    provinceFR: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The French translation of the province the organization resides in.',
    },
    cityEN: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The English translation of the city the organization resides in.',
    },
    cityFR: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The French translation of the city the organization resides in.',
    },
  }),
  outputFields: () => ({
    organization: {
      type: organizationType,
      description: 'The newly created organization.',
      resolve: async (payload) => {},
    },
  }),
  mutateAndGetPayload: async () => {},
})

module.exports = {
  createOrganization,
}
