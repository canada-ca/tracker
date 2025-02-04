import { GraphQLObjectType, GraphQLString } from 'graphql'
import { GraphQLDateTime } from 'graphql-scalars'

export const dismissedMessage = new GraphQLObjectType({
  name: 'DismissedMessage',
  description: 'This object is used for returning a message that has been dismissed.',
  fields: () => ({
    messageId: {
      type: GraphQLString,
      description: 'The ID of the message that was dismissed.',
      resolve: ({ messageId }) => messageId,
    },
    dismissedAt: {
      type: GraphQLDateTime,
      description: 'The time the message was dismissed.',
      resolve: ({ dismissedAt }) => dismissedAt,
    },
  }),
})
