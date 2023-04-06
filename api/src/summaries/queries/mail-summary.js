import {categorizedSummaryType} from '../objects'
import {t} from '@lingui/macro'

export const mailSummary = {
  type: categorizedSummaryType,
  description: 'Email summary computed values, used to build summary cards.',
  resolve: async (_, __, {i18n, loaders: {loadChartSummaryByKey}}) => {
    const summary = await loadChartSummaryByKey.load('mail')

    if (typeof summary === 'undefined') {
      console.warn(`User could not retrieve mail summary.`)
      throw new Error(i18n._(t`Unable to load mail summary. Please try again.`))
    }

    const categories = [
      {
        name: 'pass',
        count: summary.pass,
        percentage: Number(((summary.pass / summary.total) * 100).toFixed(1)),
      },
      {
        name: 'fail',
        count: summary.fail,
        percentage: Number(((summary.fail / summary.total) * 100).toFixed(1)),
      },
    ]

    return {
      categories,
      total: summary.total,
    }
  },
}
