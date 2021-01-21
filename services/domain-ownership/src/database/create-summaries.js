const moment = require('moment')

const createSummaries = async ({
  domain,
  query,
  collections,
  loadDates,
  loadSummaryByDate,
  createSummaryEdge,
}) => {
  const domainCursor = await query`
    FOR domain IN domains
      FILTER domain.domain == ${domain}
      RETURN { _id: domain._id }
  `

  const domainDBInfo = await domainCursor.next()

  if (typeof domainDBInfo === 'undefined') {
    console.warn(`Could not find domain in DB: ${domain}`)
    return
  }

  const summaryEdgeCursor = await query`
    FOR v, e IN 1..1 ANY ${domainDBInfo._id} domainsToDmarcSummaries
      RETURN e
  `

  const startDate = moment()
    .startOf('month')
    .subtract(1, 'year')
    .format('YYYY-MM-DD')

  const dates = loadDates({ startDate })

  // Create all new summaries
  if (summaryEdgeCursor.count !== 14) {
    console.info(
      `First time initialization of dmarc summaries for: ${domain} ...`,
    )

    // Add thirty_days
    dates.push({ startDate: 'thirty_days' })

    dates.forEach(async ({ startDate }) => {
      let currentSummary
      try {
        currentSummary = await loadSummaryByDate({ domain, startDate })
      } catch (err) {
        throw new Error(err)
      }

      let summaryCursor
      try {
        summaryCursor = await query`
          INSERT ${currentSummary} INTO dmarcSummaries OPTIONS { waitForSync: true } RETURN NEW
        `
      } catch (err) {
        throw new Error(err)
      }

      const summaryDBInfo = await summaryCursor.next()

      let thirtyDays = false
      if (startDate === 'thirty_days') {
        thirtyDays = true
        startDate = 'thirtyDays'
      }

      await createSummaryEdge({
        domainId: domainDBInfo._id,
        summaryId: summaryDBInfo._id,
        startDate: startDate,
        thirtyDays: thirtyDays,
      })
    })
  } else {
    console.info(
      `Updating thirty days, and current month data for: ${domain} ...`,
    )
    // Replace thirty days
    let thirtyDayCursor

    try {
      thirtyDayCursor = await query`
        LET edges = (
          FOR v, e IN 1..1 ANY ${domainDBInfo._id} domainsToDmarcSummaries
            FILTER e.thirtyDays == true
            RETURN e
        )

        FOR edge IN edges REMOVE edge._key IN domainsToDmarcSummaries OPTIONS { waitForSync: true }
          RETURN OLD
      `
    } catch (err) {
      throw new Error(err)
    }

    const thirtyDayEdge = await thirtyDayCursor.next()

    // Remove summary
    try {
      await query`
        FOR summary IN dmarcSummaries
          FILTER summary._id == ${thirtyDayEdge._to}
          REMOVE summary._key IN dmarcSummaries
          RETURN OLD
      `
    } catch (err) {
      throw new Error(err)
    }

    const currentSummary = await loadSummaryByDate({
      domain,
      startDate: 'thirty_days',
    })

    let summaryCursor
    try {
      summaryCursor = await query`
        INSERT ${currentSummary} INTO dmarcSummaries OPTIONS { waitForSync: true } RETURN NEW
      `
    } catch (err) {
      throw new Error(err)
    }

    const summaryDBInfo = await summaryCursor.next()

    await createSummaryEdge({
      domainId: domainDBInfo._id,
      summaryId: summaryDBInfo._id,
      startDate: startDate,
      thirtyDays: true,
    })

    // Get current start dates in db
    let dbStartDatesCursor
    try {
      dbStartDatesCursor = await query`
        RETURN SORTED(UNIQUE(
            FOR edge IN domainsToDmarcSummaries
                FILTER edge.thirtyDays == false
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

      let currentMonthEdgeCursor
      try {
        currentMonthEdgeCursor = await query`
          LET edges = (
            FOR v, e IN 1..1 ANY ${domainDBInfo._id} domainsToDmarcSummaries
              FILTER e.startDate == ${currentStartDate}
              RETURN e
          )
  
          FOR edge IN edges REMOVE edge._key IN domainsToDmarcSummaries OPTIONS { waitForSync: true }
            RETURN OLD
        `
      } catch (err) {
        throw new Error(err)
      }

      const currentMonthEdge = await currentMonthEdgeCursor.next()

      // Remove summary
      try {
        await query`
        FOR summary IN dmarcSummaries
          FILTER summary._id == ${currentMonthEdge._to}
          REMOVE summary._key IN dmarcSummaries
      `
      } catch (err) {
        throw new Error(err)
      }

      const currentSummary = await loadSummaryByDate({
        domain,
        startDate: dates[12],
      })

      let summaryCursor
      try {
        summaryCursor = await query`
          INSERT ${currentSummary} INTO dmarcSummaries OPTIONS { waitForSync: true } RETURN NEW
        `
      } catch (err) {
        throw new Error(err)
      }

      const summaryDBInfo = await summaryCursor.next()

      await createSummaryEdge({
        domainId: domainDBInfo._id,
        summaryId: summaryDBInfo._id,
        startDate: currentStartDate,
        thirtyDays: false,
      })
    } else {
      // Remove first month, and create new end month
      const { startDate: monthToRemove } = dbStartDates[0]

      let monthToRemoveEdgeCursor
      try {
        monthToRemoveEdgeCursor = await query`
          LET edges = (
            FOR v, e IN 1..1 ANY ${domainDBInfo._id} domainsToDmarcSummaries
              FILTER e.startDate == ${monthToRemove}
              RETURN e
          )
  
          FOR edge IN edges REMOVE edge._key IN domainsToDmarcSummaries OPTIONS { waitForSync: true }
            RETURN OLD
        `
      } catch (err) {
        throw new Error(err)
      }

      const monthToRemoveEdge = await monthToRemoveEdgeCursor.next()

      // Remove summary
      try {
        await query`
          FOR summary IN dmarcSummaries
            FILTER summary._id == ${monthToRemoveEdge._to}
            REMOVE summary._key IN dmarcSummaries
        `
      } catch (err) {
        throw new Error(err)
      }

      const { startDate: newMonth } = dates[12]

      const currentSummary = await loadSummaryByDate({
        domain,
        startDate: newMonth,
      })

      let summaryCursor
      try {
        summaryCursor = await query`
          INSERT ${currentSummary} INTO dmarcSummaries OPTIONS { waitForSync: true } RETURN NEW
        `
      } catch (err) {
        throw new Error(err)
      }

      const summaryDBInfo = await summaryCursor.next()

      await createSummaryEdge({
        domainId: domainDBInfo._id,
        summaryId: summaryDBInfo._id,
        startDate: newMonth,
        thirtyDays: false,
      })
    }
  }
}

const arrayEquals = (a, b) => {
  return JSON.stringify(a) === JSON.stringify(b)
}

module.exports = {
  createSummaries,
}
