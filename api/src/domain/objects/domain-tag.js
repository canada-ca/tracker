import { GraphQLObjectType, GraphQLString } from 'graphql'

export const domainTag = new GraphQLObjectType({
  name: 'DomainTag',
  description:
    'User-generated tag assigned to domains for labeling and management.',
  fields: () => ({
    label: {
      description: 'label that helps describe the domain.',
      type: new GraphQLObjectType({
        name: 'TagLabel',
        description: 'English and French label for tag.',
        fields: () => ({
          en: {
            type: GraphQLString,
            description: 'The English translation of the label.',
            resolve: ({ en }) => en,
          },
          fr: {
            type: GraphQLString,
            description: 'The French translation of the label.',
            resolve: ({ fr }) => fr,
          },
        }),
      }),
      resolve: ({ label }) => label,
    },
  }),
})
