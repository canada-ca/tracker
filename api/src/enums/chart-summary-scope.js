import { GraphQLEnumType } from 'graphql'

export const ChartSummaryScopeEnums = new GraphQLEnumType({
  name: 'ChartSummaryScopeEnums',
  values: {
    ALL: {
      value: 'all',
      description: 'Summary covering all organizations holding an approved claim.',
    },
    VERIFIED: {
      value: 'verified',
      description: 'Summary covering verified organizations.',
    },
    PSD: {
      value: 'psd',
      description: 'Summary covering organizations subject to the Policy on Service and Digital.',
    },
    PGS: {
      value: 'pgs',
      description: 'Summary covering organizations subject to the Policy on Government Security.',
    },
  },
  description: 'An enum used to select which set of organizations a chart summary covers.',
})