import { t } from '@lingui/macro'

export const rawSummaryListData = {
  dmarcReportSummaryList: [
    {
      month: 'August',
      year: 2020,
      categoryTotals: {
        passSpfOnly: 4187,
        passDkimOnly: 100,
        fullPass: 4878,
        fail: 12,
        total: 0,
      },
    },
    {
      month: 'July',
      year: 2020,
      categoryTotals: {
        passSpfOnly: 5853,
        passDkimOnly: 5020,
        fullPass: 5994,
        fail: 1031,
        total: 4,
      },
    },
    {
      month: 'June',
      year: 2020,
      categoryTotals: {
        passSpfOnly: 5853,
        passDkimOnly: 5020,
        fullPass: 5994,
        fail: 1031,
        total: 4,
      },
    },
    {
      month: 'May',
      year: 2020,
      categoryTotals: {
        passSpfOnly: 762,
        passDkimOnly: 96,
        fullPass: 2211,
        fail: 32,
        total: 0,
      },
    },
    {
      month: 'April',
      year: 2020,
      categoryTotals: {
        passSpfOnly: 5853,
        passDkimOnly: 5020,
        fullPass: 5994,
        fail: 1031,
        total: 4,
      },
    },
    {
      month: 'March',
      year: 2020,
      categoryTotals: {
        passSpfOnly: 5853,
        passDkimOnly: 5020,
        fullPass: 5994,
        fail: 1031,
        total: 4,
      },
    },
    {
      month: 'February',
      year: 2020,
      categoryTotals: {
        passSpfOnly: 5853,
        passDkimOnly: 5020,
        fullPass: 5994,
        fail: 1031,
        total: 4,
      },
    },
    {
      month: 'January',
      year: 2020,
      categoryTotals: {
        passSpfOnly: 5853,
        passDkimOnly: 5020,
        fullPass: 5994,
        fail: 1031,
        total: 4,
      },
    },
    {
      month: 'December',
      year: 2019,
      categoryTotals: {
        passSpfOnly: 5853,
        passDkimOnly: 5020,
        fullPass: 5994,
        fail: 1031,
        total: 4,
      },
    },
    {
      month: 'November',
      year: 2019,
      categoryTotals: {
        passSpfOnly: 5853,
        passDkimOnly: 5020,
        fullPass: 5994,
        fail: 1031,
        total: 4,
      },
    },
    {
      month: 'October',
      year: 2019,
      categoryTotals: {
        passSpfOnly: 5853,
        passDkimOnly: 5020,
        fullPass: 5994,
        fail: 1031,
        total: 4,
      },
    },
    {
      month: 'September',
      year: 2019,
      categoryTotals: {
        passSpfOnly: 5853,
        passDkimOnly: 5020,
        fullPass: 5994,
        fail: 1031,
        total: 4,
      },
    },
    {
      month: 'August',
      year: 2019,
      categoryTotals: {
        passSpfOnly: 5853,
        passDkimOnly: 5020,
        fullPass: 5994,
        fail: 1031,
        total: 4,
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
