const moment = require('moment')

const createSummaries = (
  arrayEquals,
  loadCurrentDates,
  loadDates,
  loadSummaryByDate,
  loadSummaryCountByDomain,
  createSummaryEdge,
  createSummary,
  removeSummaryEdge,
  removeSummary,
) => async ({ domain }) => {

  const { summaryCount, domainId } = await loadSummaryCountByDomain({ domain })

  if (typeof summaryCount === 'undefined') {
    return
  }

  const startDate = moment()
    .startOf('month')
    .subtract(1, 'year')
    .format('YYYY-MM-DD')

  const dates = loadDates({ startDate })

  // Create all new summaries
  if (summaryCount !== 14) {
    console.info(`First time initialization of dmarc summaries for: ${domain}`)

    // Add thirty_days
    dates.push({ startDate: 'thirty_days' })

    dates.forEach(async ({ startDate }) => {
      const currentSummary = await loadSummaryByDate({ domain, startDate })

      const summaryDBInfo = await createSummary({ currentSummary })

      if (startDate === 'thirty_days') {
        startDate = 'thirtyDays'
      }

      await createSummaryEdge({
        domainId,
        summaryId: summaryDBInfo._id,
        startDate: startDate,
      })
    })
  } else {
    console.info(`Updating thirty days, and current month data for: ${domain}`)
    // Remove summary edge
    const thirtyDayEdge = await removeSummaryEdge({
      domainId,
      monthToRemove: 'thirtyDays',
    })

    // Remove summary
    await removeSummary({ summaryId: thirtyDayEdge._to })

    const currentSummary = await loadSummaryByDate({
      domain,
      startDate: 'thirtyDays',
    })

    const summaryDBInfo = await createSummary({ currentSummary })

    await createSummaryEdge({
      domainId,
      summaryId: summaryDBInfo._id,
      startDate: 'thirtyDays',
    })

    // Get current start dates in db
    const dbStartDates = await loadCurrentDates()

    const dateArrEqual = arrayEquals(dates, dbStartDates)

    if (dateArrEqual) {
      // Update current month
      const { startDate: currentStartDate } = dates[12]

      // Remove summary edge
      const currentMonthEdge = await removeSummaryEdge({
        domainId,
        monthToRemove: currentStartDate,
      })

      // Remove summary
      await removeSummary({ summaryId: currentMonthEdge._to })

      const currentSummary = await loadSummaryByDate({
        domain,
        startDate: dates[12],
      })

      const summaryDBInfo = await createSummary({ currentSummary })

      await createSummaryEdge({
        domainId,
        summaryId: summaryDBInfo._id,
        startDate: currentStartDate,
      })
    } else {
      // Remove first month, and create new end month
      const { startDate: monthToRemove } = dbStartDates[0]

      // Remove summary edge
      const monthToRemoveEdge = await removeSummaryEdge({
        domainId,
        monthToRemove,
      })

      // Remove summary
      await removeSummary({ summaryId: monthToRemoveEdge._to })

      const { startDate: newMonth } = dates[12]

      const currentSummary = await loadSummaryByDate({
        domain,
        startDate: newMonth,
      })

      const summaryDBInfo = await createSummary({ currentSummary })

      await createSummaryEdge({
        domainId,
        summaryId: summaryDBInfo._id,
        startDate: newMonth,
      })
    }
  }
}

module.exports = {
  createSummaries,
}
