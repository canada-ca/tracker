const { GraphQLString, GraphQLNonNull, GraphQLID } = require('graphql')
const { mutationWithClientMutationId, globalIdField } = require('graphql-relay')
const { Acronym } = require('../../scalars')
const { organizationType } = require('../../types')

const updateOrganization = new mutationWithClientMutationId({
  name: 'UpdateOrganization',
  description:
    'Mutation allows the modification of organizations if any changes to the organization may occur.',
  inputFields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLID),
      description: 'The global id of the organization to be updated.',
    },
    acronymEN: {
      type: Acronym,
      description: 'The English acronym of the organization.',
    },
    acronymFR: {
      type: Acronym,
      description: 'The French acronym of the organization.',
    },
    nameEN: {
      type: GraphQLString,
      description: 'The English name of the organization.',
    },
    nameFR: {
      type: GraphQLString,
      description: 'The French name of the organization.',
    },
    zoneEN: {
      type: GraphQLString,
      description:
        'The English translation of the zone the organization belongs to.',
    },
    zoneFR: {
      type: GraphQLString,
      description:
        'The English translation of the zone the organization belongs to.',
    },
    sectorEN: {
      type: GraphQLString,
      description:
        'The English translation of the sector the organization belongs to.',
    },
    sectorFR: {
      type: GraphQLString,
      description:
        'The French translation of the sector the organization belongs to.',
    },
    countryEN: {
      type: GraphQLString,
      description:
        'The English translation of the country the organization resides in.',
    },
    countryFR: {
      type: GraphQLString,
      description:
        'The French translation of the country the organization resides in.',
    },
    provinceEN: {
      type: GraphQLString,
      description:
        'The English translation of the province the organization resides in.',
    },
    provinceFR: {
      type: GraphQLString,
      description:
        'The French translation of the province the organization resides in.',
    },
    cityEN: {
      type: GraphQLString,
      description:
        'The English translation of the city the organization resides in.',
    },
    cityFR: {
      type: GraphQLString,
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
  updateOrganization,
}
