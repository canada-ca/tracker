import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'
import { DomainTagLabel } from '../../enums'

export const inputTag = new GraphQLInputObjectType({
  name: 'InputTag',
  description:
    'User-generated tag assigned to domains for labeling and management.',
  fields: () => ({
    en: {
      type: GraphQLNonNull(DomainTagLabel),
      description: 'The English translation of the label.',
    },
    fr: {
      type: GraphQLNonNull(DomainTagLabel),
      description: 'The French translation of the label.',
    },
  }),
})
