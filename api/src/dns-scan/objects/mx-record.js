import { GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql'
import { GraphQLDateTime } from 'graphql-scalars'
import { globalIdField } from 'graphql-relay'

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
  }),
})

export const mxRecordDiffType = new GraphQLObjectType({
  name: 'MXRecordDiff',
  fields: () => ({
    id: globalIdField('dns'),
    timestamp: {
      type: GraphQLDateTime,
      description: `The time when the scan was initiated.`,
      resolve: ({ timestamp }) => new Date(timestamp),
    },
    mxRecords: {
      type: mxRecordType,
      description: `The MX records for the domain (if they exist).`,
      resolve: ({ mxRecords }) => mxRecords,
    },
  }),
})
