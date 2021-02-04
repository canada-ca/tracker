import { GraphQLEnumType } from 'graphql'

export const PeriodEnums = new GraphQLEnumType({
  name: 'PeriodEnums',
  values: {
    JANUARY: {
      value: 'january',
      description: 'The month of January.',
    },
    FEBRUARY: {
      value: 'february',
      description: 'The month of February.',
    },
    MARCH: {
      value: 'march',
      description: 'The month of March.',
    },
    APRIL: {
      value: 'april',
      description: 'The month of April.',
    },
    MAY: {
      value: 'may',
      description: 'The month of May.',
    },
    JUNE: {
      value: 'june',
      description: 'The month of June.',
    },
    JULY: {
      value: 'july',
      description: 'The month of July.',
    },
    AUGUST: {
      value: 'august',
      description: 'The month of August.',
    },
    SEPTEMBER: {
      value: 'september',
      description: 'The month of September.',
    },
    OCTOBER: {
      value: 'october',
      description: 'The month of October.',
    },
    NOVEMBER: {
      value: 'november',
      description: 'The month of November.',
    },
    DECEMBER: {
      value: 'december',
      description: 'The month of December.',
    },
    LAST30DAYS: {
      value: 'thirtyDays',
      description: 'The last 30 days.',
    },
  },
  description: 'An enum used to select information from the dmarc-report-api.',
})
