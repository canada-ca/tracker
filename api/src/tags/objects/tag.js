import { GraphQLBoolean, GraphQLObjectType, GraphQLString } from 'graphql'

export const tagType = new GraphQLObjectType({
  name: 'Tag',
  fields: () => ({
    tagId: {
      type: GraphQLString,
      description: '',
      resolve: ({ tagId }) => tagId,
    },
    label: {
      type: GraphQLString,
      description: '',
      resolve: ({ label }) => label,
    },
    description: {
      type: GraphQLString,
      description: '',
      resolve: ({ description }) => description,
    },
    isVisible: {
      type: GraphQLBoolean,
      description: '',
      resolve: ({ visible }) => visible,
    },
  }),
})
