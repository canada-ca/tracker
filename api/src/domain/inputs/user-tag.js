import { GraphQLInputObjectType, GraphQLString } from 'graphql'

export const inputTag = new GraphQLInputObjectType({
  name: 'TagInput',
  description:
    'User-generated tag assigned to domains for labeling and management.',
  fields: () => ({
    label: {
      description: 'label that helps describe the domain.',
      type: GraphQLString,
    },
  }),
})
