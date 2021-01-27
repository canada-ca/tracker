const moment = require('moment')

const createSummaries = (
  loadDates,
  loadSummaryCountByDomain,
  initializeSummaries,
  updateCurrentSummaries,
) => async ({ domain }) => {
  const { summaryCount, domainId } = await loadSummaryCountByDomain({ domain })

  if (typeof domainId === 'undefined') {
    return undefined
  }

  const startDate = moment()
    .startOf('month')
    .subtract(1, 'year')
    .format('YYYY-MM-DD')

  const dates = loadDates({ startDate })

  // Create all new summaries
  if (summaryCount !== 14) {
    await initializeSummaries({ domain, domainId, dates })
  } else {
    await updateCurrentSummaries({ domain, domainId, dates })
  }
}

module.exports = {
  createSummaries,
}
