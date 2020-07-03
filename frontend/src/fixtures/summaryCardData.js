export const rawSummaryCardData = {
  categories: [
    {
      name: 'fullPass',
      value: 33,
      percentage: 33,
    },
    {
      name: 'partialPass',
      value: 33,
      percentage: 33,
    },
    {
      name: 'fail',
      value: 33,
      percentage: 33,
    },
  ],
  total: 100,
}

export const formattedSummaryCardData = { ...rawSummaryCardData }
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
