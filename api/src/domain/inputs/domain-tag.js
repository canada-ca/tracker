import { GraphQLInputObjectType, GraphQLString } from 'graphql'

export const inputTag = new GraphQLInputObjectType({
  name: 'InputTag',
  description:
    'User-generated tag assigned to domains for labeling and management.',
  fields: () => ({
    label: {
      description: 'label that helps describe the domain.',
      type: new GraphQLInputObjectType({
        name: 'InputTagLabel',
        description: 'English and French label for tag.',
        fields: () => ({
          en: {
            type: GraphQLString,
            description: 'The English translation of the label.',
          },
          fr: {
            type: GraphQLString,
            description: 'The French translation of the label.',
          },
        }),
      }),
    },
  }),
})
