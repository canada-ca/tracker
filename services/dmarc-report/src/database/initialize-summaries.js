const initializeSummaries = (
  createSummaryEdge,
  createSummary,
  loadSummaryByDate,
) => async ({ domain, domainId, dates }) => {
  console.info(`\tFirst time initialization of dmarc summaries for: ${domain}`)

  // Add thirty_days
  dates.push({ startDate: 'thirty_days' })

  for (const date of dates) {
    let startDate
    if (date.startDate === 'thirty_days') {
      startDate = 'thirtyDays'
    } else {
      startDate = date.startDate
    }

    const currentSummary = await loadSummaryByDate({ domain, startDate })

    const summaryDBInfo = await createSummary({ currentSummary })

    await createSummaryEdge({
      domainId,
      summaryId: summaryDBInfo._id,
      startDate,
    })
  }
}

module.exports = {
  initializeSummaries,
}
