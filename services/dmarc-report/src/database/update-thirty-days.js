const updateThirtyDays = (
  calculatePercentages,
  createSummary,
  createSummaryEdge,
  loadSummaryByDate,
  removeSummaryEdge,
  removeSummary,
) => async ({ domain, domainId }) => {
  // Remove summary edge
  const thirtyDayEdge = await removeSummaryEdge({
    domainId,
    monthToRemove: 'thirtyDays',
  })

  // Remove summary
  await removeSummary({ summaryId: thirtyDayEdge._to })

  const currentSummary = await loadSummaryByDate({
    domain,
    startDate: 'thirty_days',
  })

  const { totalMessages, percentages } = calculatePercentages(
    currentSummary.categoryTotals,
  )
  
  currentSummary.totalMessages = totalMessages
  currentSummary.categoryPercentages = percentages

  const summaryDBInfo = await createSummary({ currentSummary })

  await createSummaryEdge({
    domainId,
    summaryId: summaryDBInfo._id,
    startDate: 'thirtyDays',
  })
}

module.exports = {
  updateThirtyDays,
}
