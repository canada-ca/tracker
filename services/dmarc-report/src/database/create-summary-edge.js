const createSummaryEdge = (collections) => async ({
  domainId,
  summaryId,
  startDate,
}) => {
  try {
    await collections.domainsToDmarcSummaries.save({
      _from: domainId,
      _to: summaryId,
      startDate: startDate,
    })
  } catch (err) {
    throw new Error(err)
  }
}

module.exports = {
  createSummaryEdge,
}
