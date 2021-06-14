import { t } from '@lingui/macro'

export const rawSummaryListData = {
  dmarcReportSummaryList: [
    {
      month: 'August',
      year: 2020,
      categoryTotals: {
        fullPass: 0,
        passSpfOnly: 0,
        passDkimOnly: 0,
        fail: 0,
        total: 0,
      },
    },
    {
      month: 'July',
      year: 2020,
      categoryTotals: {
        fullPass: 0,
        passSpfOnly: 0,
        passDkimOnly: 4,
        fail: 0,
        total: 4,
      },
    },
    {
      month: 'June',
      year: 2020,
      categoryTotals: {
        fullPass: 0,
        passSpfOnly: 0,
        passDkimOnly: 2,
        fail: 0,
        total: 2,
      },
    },
    {
      month: 'May',
      year: 2020,
      categoryTotals: {
        fullPass: 0,
        passSpfOnly: 0,
        passDkimOnly: 0,
        fail: 0,
        total: 0,
      },
    },
    {
      month: 'April',
      year: 2020,
      categoryTotals: {
        fullPass: 0,
        passSpfOnly: 0,
        passDkimOnly: 0,
        fail: 2,
        total: 2,
      },
    },
    {
      month: 'March',
      year: 2020,
      categoryTotals: {
        fullPass: 0,
        passSpfOnly: 0,
        passDkimOnly: 0,
        fail: 0,
        total: 0,
      },
    },
    {
      month: 'February',
      year: 2020,
      categoryTotals: {
        fullPass: 0,
        passSpfOnly: 0,
        passDkimOnly: 0,
        fail: 0,
        total: 0,
      },
    },
    {
      month: 'January',
      year: 2020,
      categoryTotals: {
        fullPass: 0,
        passSpfOnly: 0,
        passDkimOnly: 0,
        fail: 0,
        total: 0,
      },
    },
    {
      month: 'December',
      year: 2019,
      categoryTotals: {
        fullPass: 0,
        passSpfOnly: 0,
        passDkimOnly: 0,
        fail: 0,
        total: 0,
      },
    },
    {
      month: 'November',
      year: 2019,
      categoryTotals: {
        fullPass: 0,
        passSpfOnly: 0,
        passDkimOnly: 0,
        fail: 0,
        total: 0,
      },
    },
    {
      month: 'October',
      year: 2019,
      categoryTotals: {
        fullPass: 0,
        passSpfOnly: 0,
        passDkimOnly: 0,
        fail: 0,
        total: 0,
      },
    },
    {
      month: 'September',
      year: 2019,
      categoryTotals: {
        fullPass: 0,
        passSpfOnly: 0,
        passDkimOnly: 0,
        fail: 0,
        total: 0,
      },
    },
    {
      month: 'August',
      year: 2019,
      categoryTotals: {
        fullPass: 0,
        passSpfOnly: 0,
        passDkimOnly: 0,
        fail: 0,
        total: 0,
      },
    },
  ],
}

const strengths = {
  strong: [
    {
      name: 'fullPass',
      displayName: t`Pass`,
    },
  ],
  moderate: [
    {
      name: 'failDkim',
      displayName: t`Fail DKIM`,
    },
    {
      name: 'failSpf',
      displayName: t`Fail SPF`,
    },
  ],
  weak: [
    {
      name: 'fail',
      displayName: t`Fail`,
    },
  ],
}

export const formattedBarData = {
  periods: rawSummaryListData.dmarcReportSummaryList.map((entry) => {
    return { month: entry.month, year: entry.year, ...entry.categoryTotals }
  }),
}
formattedBarData.strengths = strengths
