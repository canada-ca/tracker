import { GraphQLBoolean, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql'

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
      type: GraphQLList(GraphQLString),
      description: `The IP addresses for the given host.`,
    },
  }),
  description: `Hosts listed in the domain's MX record.`,
})

export const mxRecordType = new GraphQLObjectType({
  name: 'MXRecord',
  fields: () => ({
    hosts: {
      type: GraphQLList(mxHostType),
      description: `Hosts listed in the domain's MX record.`,
    },
    warnings: {
      type: GraphQLList(GraphQLString),
      description: `Additional warning info about the MX record.`,
    },
    diff: {
      type: GraphQLBoolean,
      description: `Whether or not the MX record is different from the previous scan.`,
    },
  }),
})
