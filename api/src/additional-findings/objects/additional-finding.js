import { GraphQLObjectType, GraphQLInt, GraphQLString } from 'graphql'
import { GraphQLDateTime } from 'graphql-scalars'
import { globalIdField } from 'graphql-relay'

import { nodeInterface } from '../../node'

export const additionalFindingEvidence = new GraphQLObjectType({
  name: 'AdditionalFindingEvidence',
  description: 'Evidence supporting an additional finding.',
  fields: () => ({
    target: {
      type: GraphQLString,
      description: 'The target the finding was observed on.',
      resolve: ({ target }) => target,
    },
    recordType: {
      type: GraphQLString,
      description: 'The type of DNS record the finding was observed in.',
      resolve: ({ recordType }) => recordType,
    },
  }),
})

export const additionalFindingAttributes = new GraphQLObjectType({
  name: 'AdditionalFindingAttributes',
  description: 'Additional attributes describing a finding.',
  fields: () => ({
    provider: {
      type: GraphQLString,
      description: 'The provider associated with the finding.',
      resolve: ({ provider }) => provider,
    },
    lameType: {
      type: GraphQLString,
      description: 'The type of lame delegation detected.',
      resolve: ({ lameType }) => lameType,
    },
  }),
})

export const additionalFinding = new GraphQLObjectType({
  name: 'AdditionalFinding',
  fields: () => ({
    id: globalIdField('additionalFinding'),
    subject: {
      type: GraphQLString,
      description: 'The subject the finding is about.',
      resolve: ({ subject }) => subject,
    },
    source: {
      type: GraphQLString,
      description: 'The scanner source that produced the finding.',
      resolve: ({ source }) => source,
    },
    findingType: {
      type: GraphQLString,
      description: 'The type of finding.',
      resolve: ({ findingType }) => findingType,
    },
    confidence: {
      type: GraphQLString,
      description: 'Level of confidence that the finding is accurate.',
      resolve: ({ confidence }) => confidence,
    },
    reasonCode: {
      type: GraphQLString,
      description: 'Code describing why the finding was raised.',
      resolve: ({ reasonCode }) => reasonCode,
    },
    status: {
      type: GraphQLString,
      description: 'The status of the finding.',
      resolve: ({ status }) => status,
    },
    firstSeen: {
      type: GraphQLDateTime,
      description: 'The date the finding was first observed.',
      resolve: ({ firstSeen }) => (firstSeen ? new Date(firstSeen) : null),
    },
    lastSeen: {
      type: GraphQLDateTime,
      description: 'The date the finding was last observed.',
      resolve: ({ lastSeen }) => (lastSeen ? new Date(lastSeen) : null),
    },
    occurrenceCount: {
      type: GraphQLInt,
      description: 'The number of times the finding has been observed.',
      resolve: ({ occurrenceCount }) => occurrenceCount,
    },
    evidence: {
      type: additionalFindingEvidence,
      description: 'Evidence supporting the finding.',
      resolve: ({ evidence }) => evidence,
    },
    attributes: {
      type: additionalFindingAttributes,
      description: 'Additional attributes describing the finding.',
      resolve: ({ attributes }) => attributes,
    },
  }),
  interfaces: [nodeInterface],
  description: 'A finding produced by the findings processor for a domain.',
})
