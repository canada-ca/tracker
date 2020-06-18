export const rawSummaryCardData = {
  dmarcReportSummary: {
    month: 'MAY',
    year: 2020,
    categoryTotals: {
      fullPass: 81205,
      partialPass: 62023,
      fail: 60283,
      total: 4774,
      __typename: 'CategoryTotals',
    },
    __typename: 'DmarcReportSummary',
  },
}

export const formattedSummaryCardData = rawSummaryCardData.dmarcReportSummary
formattedSummaryCardData.strengths = {
  strong: {
    types: ['fullPass'],
    name: 'Pass',
  },
  moderate: {
    types: ['partialPass'],
    name: 'Partial Pass',
  },
  weak: {
    types: ['fail'],
    name: 'Fail',
  },
}
