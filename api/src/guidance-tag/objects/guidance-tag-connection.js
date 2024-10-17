import { GraphQLInt, GraphQLObjectType, GraphQLList } from 'graphql'
import { guidanceTagType } from './guidance-tag'

export const guidanceTagConnection = new GraphQLObjectType({
  name: 'GuidanceTagConnection',
  fields: () => ({
    guidanceTags: {
      type: new GraphQLList(guidanceTagType),
      description: '',
      resolve: ({ guidanceTags }) => guidanceTags,
    },
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of guidance tags for a given scan type.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
