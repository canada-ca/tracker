const moment = require('moment')

const createSummaries = (
  query,
  arrayEquals,
  loadDates,
  loadSummaryByDate,
  createSummaryEdge,
  createSummary,
  removeSummaryEdge,
  removeSummary,
) => async ({ domain }) => {
  let domainCursor
  try {
    domainCursor = await query`
      FOR domain IN domains
        FILTER domain.domain == ${domain}
        RETURN { _id: domain._id }
    `
  } catch (err) {
    throw new Error(err)
  }

  let domainDBInfo
  try {
    domainDBInfo = await domainCursor.next()
  } catch (err) {
    throw new Error(err)
  }

  if (typeof domainDBInfo === 'undefined') {
    console.warn(`Could not find domain in DB: ${domain}`)
    return
  }

  let summaryEdgeCursor
  try {
    summaryEdgeCursor = await query`
      FOR v, e IN 1..1 ANY ${domainDBInfo._id} domainsToDmarcSummaries
        RETURN e
    `
  } catch (err) {
    throw new Error(err)
  }

  const startDate = moment()
    .startOf('month')
    .subtract(1, 'year')
    .format('YYYY-MM-DD')

  const dates = loadDates({ startDate })

  // Create all new summaries
  if (summaryEdgeCursor.count !== 14) {
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
        domainId: domainDBInfo._id,
        summaryId: summaryDBInfo._id,
        startDate: startDate,
      })
    })
  } else {
    console.info(`Updating thirty days, and current month data for: ${domain}`)
    // Remove summary edge
    const thirtyDayEdge = await removeSummaryEdge({
      domainId: domainDBInfo._id,
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
      domainId: domainDBInfo._id,
      summaryId: summaryDBInfo._id,
      startDate: 'thirtyDays',
    })

    // Get current start dates in db
    let dbStartDatesCursor
    try {
      dbStartDatesCursor = await query`
        RETURN SORTED(UNIQUE(
            FOR edge IN domainsToDmarcSummaries
                FILTER edge.startDate != "thirtyDays"
                RETURN { startDate: edge.startDate }
        ))
      `
    } catch (err) {
      throw new Error(err)
    }

    const dbStartDates = await dbStartDatesCursor.next()

    const dateArrEqual = arrayEquals(dates, dbStartDates)

    if (dateArrEqual) {
      // Update current month
      const { startDate: currentStartDate } = dates[12]

      // Remove summary edge
      const currentMonthEdge = await removeSummaryEdge({
        domainId: domainDBInfo._id,
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
        domainId: domainDBInfo._id,
        summaryId: summaryDBInfo._id,
        startDate: currentStartDate,
      })
    } else {
      // Remove first month, and create new end month
      const { startDate: monthToRemove } = dbStartDates[0]

      // Remove summary edge
      const monthToRemoveEdge = await removeSummaryEdge({
        domainId: domainDBInfo._id,
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
        domainId: domainDBInfo._id,
        summaryId: summaryDBInfo._id,
        startDate: newMonth,
      })
    }
  }
}

module.exports = {
  createSummaries,
}
