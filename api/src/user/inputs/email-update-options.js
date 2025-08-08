import { GraphQLBoolean, GraphQLInputObjectType } from 'graphql'

export const emailUpdatesInput = new GraphQLInputObjectType({
  name: 'emailUpdatesInput',
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
    detectDecay: {
      type: GraphQLBoolean,
      description:
        "Value used to determine if user wants to receive possibly daily email updates on recent changes to their compliance statuses.",
    },
  }),
})
