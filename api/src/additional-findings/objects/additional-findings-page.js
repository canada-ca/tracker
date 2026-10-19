import { GraphQLInt, GraphQLList, GraphQLBoolean, GraphQLObjectType } from 'graphql'
import { additionalFinding } from './additional-finding'

export const additionalFindingsPage = new GraphQLObjectType({
  name: 'AdditionalFindingsPage',
  description: 'A page of additional findings for a domain, with offset pagination information.',
  fields: () => ({
    nodes: {
      type: new GraphQLList(additionalFinding),
      description: 'The additional findings on the current page.',
    },
    totalCount: {
      type: GraphQLInt,
      description: 'The total number of additional findings for the domain, regardless of the current page.',
    },
    hasNextPage: {
      type: GraphQLBoolean,
      description: 'Whether there are more additional findings after the current page.',
    },
    hasPreviousPage: {
      type: GraphQLBoolean,
      description: 'Whether there are additional findings before the current page.',
    },
  }),
})
