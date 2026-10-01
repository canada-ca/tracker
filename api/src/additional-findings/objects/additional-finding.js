import { GraphQLInt, GraphQLObjectType, GraphQLString } from 'graphql'
import { GraphQLJSONObject } from 'graphql-scalars'

import { domainType } from '../../domain/objects'

export const additionalFinding = new GraphQLObjectType({
  name: 'AdditionalFinding',
  description: 'Out-of-policy security finding emitted by additional scanners.',
  fields: () => ({
    domain: {
      type: domainType,
      description: 'The domain the finding is attributed to.',
      resolve: async ({ domainKey }, _args, { dataSources: { domain: domainDataSource } }) => {
        return await domainDataSource.byKey.load(domainKey)
      },
    },
    source: {
      type: GraphQLString,
      description: 'Scanner that emitted the finding.',
    },
    findingType: {
      type: GraphQLString,
      description: 'Specific vulnerability found by scanner.',
    },
    subject: {
      type: GraphQLString,
      description: 'Domain/entity (e.g. hostname) the finding was observed on, as reported by the scanner.',
    },
    confidence: {
      type: GraphQLString,
      description: 'Confidence level of finding being a true positive/exploitable.',
    },
    severity: {
      type: GraphQLString,
      description: 'The level of risk associated with the vulnerability.',
    },
    reasonCode: {
      type: GraphQLString,
      description: 'Scanner-generated string used to identify reason for emitting the finding.',
    },
    firstSeen: {
      type: GraphQLString,
      description: 'Date/time when finding was first detected.',
    },
    lastSeen: {
      type: GraphQLString,
      description: 'Most recent date/time when finding was detected.',
    },
    evidence: {
      type: GraphQLJSONObject,
      description: 'Map of values used to determine confidence level of vulnerability.',
    },
    attributes: {
      type: GraphQLJSONObject,
      description: 'Additional notable information about the detected vulnerability and/or affiliated resource.',
    },
    occurrenceCount: {
      type: GraphQLInt,
      description: 'Amount of times the vulnerability has been detected.',
    },
    raw: {
      type: GraphQLJSONObject,
      description: 'Raw JSON of emitted finding event.',
    },
    status: {
      type: GraphQLString,
      description: 'Enum value to show if a finding is ongoing, resolved, or dismissed.',
    },
  }),
})
