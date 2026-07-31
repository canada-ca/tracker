import { GraphQLEnumType } from 'graphql'

export const SummarySourceEnums = new GraphQLEnumType({
  name: 'SummarySourceEnums',
  values: {
    LIVE: {
      value: 'live',
      description: 'The production summaries collection produced by the daily summaries job.',
    },
    REBUILD: {
      value: 'rebuild',
      description: 'The scan-sourced backfill shadow collection. Restricted to super admins.',
    },
  },
  description: 'Selects which summaries collection to read from. Rebuild is restricted to super admins.',
})
