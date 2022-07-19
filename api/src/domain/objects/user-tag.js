import { GraphQLObjectType, GraphQLString } from 'graphql'

export const userTag = new GraphQLObjectType({
  name: 'UserTag',
  description:
    'User-generated tag assigned to domains for labeling and management.',
  fields: () => ({
    label: {
      description: 'label that helps describe the domain.',
      type: GraphQLString,
      resolve: ({ label }) => label,
    },
  }),
})
