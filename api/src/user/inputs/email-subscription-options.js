import { GraphQLBoolean, GraphQLInputObjectType } from 'graphql'

export const emailSubscriptionsInput = new GraphQLInputObjectType({
  name: 'EmailSubscriptionsInput',
  fields: () => ({
    orgFootprint: {
      type: GraphQLBoolean,
      description:
        "Value used to determine if user wants to receive possibly daily email updates about their organization's digital footprint.",
    },
    progressReport: {
      type: GraphQLBoolean,
      description:
        "Value used to determine if user wants to receive monthly email updates about their organization's compliance score progress.",
    },
  }),
})
