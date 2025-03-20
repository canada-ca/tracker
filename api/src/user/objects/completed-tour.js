import { GraphQLObjectType, GraphQLString } from 'graphql'
import { GraphQLDateTime } from 'graphql-scalars'

export const completedTour = new GraphQLObjectType({
  name: 'CompletedTour',
  description: 'This object is used for returning a tour that has been completed.',
  fields: () => ({
    tourId: {
      type: GraphQLString,
      description: 'The ID of the tour that was completed.',
      resolve: ({ tourId }) => tourId,
    },
    completedAt: {
      type: GraphQLDateTime,
      description: 'The time the tour was completed.',
      resolve: ({ completedAt }) => completedAt,
    },
  }),
})
