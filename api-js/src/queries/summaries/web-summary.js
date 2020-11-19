const { categorizedSummaryType } = require('../../types')
const { t } = require('@lingui/macro')

const webSummary = {
  type: categorizedSummaryType,
  description: 'Web summary computed values, used to build summary cards.',
  resolve: async (_, __, { i18n, loaders: { chartSummaryLoaderByKey } }) => {
    const summary = await chartSummaryLoaderByKey.load('web')

    if (typeof summary === 'undefined') {
      console.warn(`User could not retrieve web summary.`)
      throw new Error(i18n._(t`Unable to load web summary. Please try again.`))
    }

    const categories = [
      {
        name: i18n._(t`pass`),
        count: summary.pass,
        percentage: Number(((summary.pass / summary.total) * 100).toFixed(1)),
      },
      {
        name: i18n._(t`fail`),
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

module.exports = {
  webSummary,
}
