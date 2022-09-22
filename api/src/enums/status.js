import {GraphQLEnumType} from 'graphql'

export const StatusEnum = new GraphQLEnumType({
  name: 'StatusEnum',
  values: {
    PASS: {
      value: 'pass',
      description: 'If the given check meets the passing requirements.',
    },
    INFO: {
      value: 'info',
      description:
        "If the given check has flagged something that can provide information on the domain that aren't scan related.",
    },
    FAIL: {
      value: 'fail',
      description: 'If the given check does not meet the passing requirements',
    },
  },
  description:
    'Enum used to inform front end if there are any issues, info, or the domain passes a given check.',
})
