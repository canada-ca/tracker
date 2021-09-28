import { categorizedSummaryType } from '../objects'
import { t } from '@lingui/macro'

export const dmarcPhaseSummary = {
  type: categorizedSummaryType,
  description:
    'DMARC phase summary computed values, used to build summary cards.',
  resolve: async (_, __, { i18n, loaders: { loadChartSummaryByKey } }) => {
    const summary = await loadChartSummaryByKey.load('dmarc_phase')

    if (typeof summary === 'undefined') {
      console.warn(`User could not retrieve DMARC phase summary.`)
      throw new Error(
        i18n._(t`Unable to load DMARC phase summary. Please try again.`),
      )
    }

    const categories = [
      {
        name: 'not implemented',
        count: summary.not_implemented,
        percentage: Number(
          ((summary.not_implemented / summary.total) * 100).toFixed(1),
        ),
      },
      {
        name: 'assess',
        count: summary.assess,
        percentage: Number(((summary.assess / summary.total) * 100).toFixed(1)),
      },
      {
        name: 'deploy',
        count: summary.deploy,
        percentage: Number(((summary.deploy / summary.total) * 100).toFixed(1)),
      },
      {
        name: 'enforce',
        count: summary.enforce,
        percentage: Number(
          ((summary.enforce / summary.total) * 100).toFixed(1),
        ),
      },
      {
        name: 'maintain',
        count: summary.maintain,
        percentage: Number(
          ((summary.maintain / summary.total) * 100).toFixed(1),
        ),
      },
    ]

    return {
      categories,
      total: summary.total,
    }
  },
}
