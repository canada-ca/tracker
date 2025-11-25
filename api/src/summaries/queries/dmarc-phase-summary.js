import { categorizedSummaryType } from '../objects'
import { t } from '@lingui/macro'

export const dmarcPhaseSummary = {
  type: categorizedSummaryType,
  description: 'DMARC phase summary computed values, used to build summary cards.',
  resolve: async (_, __, { i18n, loaders: { loadChartSummaryByKey } }) => {
    const summary = await loadChartSummaryByKey.load('dmarc_phase')

    if (typeof summary === 'undefined') {
      console.warn(`User could not retrieve DMARC phase summary.`)
      throw new Error(i18n._(t`Unable to load DMARC phase summary. Please try again.`))
    }
    const phaseNames = ['assess', 'deploy', 'enforce', 'maintain']
    const { total } = summary
    const categories = phaseNames.map((name) => ({
      name,
      count: summary[name],
      percentage: Number(((summary[name] / total) * 100).toFixed(1)),
    }))

    return {
      categories,
      total,
    }
  },
}
