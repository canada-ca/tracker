const updateCurrentSummaries = (
  arrayEquals,
  loadCurrentDates,
  updateThirtyDays,
  updateMonthSummary,
) => async ({ domain, domainId, dates }) => {
  console.info(`\tUpdating thirty days, and current month data for: ${domain}`)

  // Update thirty days month
  await updateThirtyDays({ domain, domainId })

  // Get current start dates in db
  const dbStartDates = await loadCurrentDates()
  
  const dateArrEqual = arrayEquals(dates, dbStartDates)

  if (dateArrEqual) {
    // Update Current Month
    await updateMonthSummary({
      dateToRemove: dates[dates.length - 1].startDate,
      dateToAdd: dates[dates.length - 1].startDate,
      domain,
      domainId,
    })
  } else {
    // Remove first month, and create new month
    await updateMonthSummary({
      dateToRemove: dbStartDates[0].startDate,
      dateToAdd: dates[dates.length - 1].startDate,
      domain,
      domainId,
    })
  }
}

module.exports = {
  updateCurrentSummaries,
}
