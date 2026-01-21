import { GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql'

export const mxHostType = new GraphQLObjectType({
  name: 'MXHost',
  fields: () => ({
    preference: {
      type: GraphQLInt,
      description: `The preference (or priority) of the host.`,
    },
    hostname: {
      type: GraphQLString,
      description: `The hostname of the given host.`,
    },
    addresses: {
      type: new GraphQLList(GraphQLString),
      description: `The IP addresses for the given host.`,
    },
  }),
  description: `Hosts listed in the domain's MX record.`,
})

export const mxRecordType = new GraphQLObjectType({
  name: 'MXRecord',
  fields: () => ({
    hosts: {
      type: new GraphQLList(mxHostType),
      description: `Hosts listed in the domain's MX record.`,
    },
    warnings: {
      type: new GraphQLList(GraphQLString),
      description: `Additional warning info about the MX record.`,
    },
    error: {
      type: GraphQLString,
      description: `Error message if the MX record could not be retrieved.`,
    },
  }),
})
