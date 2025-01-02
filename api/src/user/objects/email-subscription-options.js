import { GraphQLBoolean, GraphQLObjectType } from 'graphql'

export const emailSubscriptionOptionsType = new GraphQLObjectType({
  name: 'EmailSubscriptionOptions',
  fields: () => ({
    orgFootprint: {
      type: GraphQLBoolean,
      description:
        "Value used to determine if user wants to receive possibly daily email updates about their organization's digital footprint.",
      resolve: ({ orgFootprint }) => orgFootprint,
    },
    progressReport: {
      type: GraphQLBoolean,
      description:
        "Value used to determine if user wants to receive monthly email updates about their organization's compliance score progress.",
      resolve: ({ progressReport }) => progressReport,
    },
  }),
})
