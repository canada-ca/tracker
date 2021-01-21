const createSummaryEdge = (collections) => async ({
  domainId,
  summaryId,
  startDate,
  thirtyDays,
}) => {
  try {
    await collections.domainsToDmarcSummaries.save({
      _from: domainId,
      _to: summaryId,
      startDate: startDate,
      thirtyDays: thirtyDays,
    })
  } catch (err) {
    throw new Error(err)
  }
}

module.exports = {
  createSummaryEdge,
}
