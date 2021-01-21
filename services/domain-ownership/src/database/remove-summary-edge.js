const removeSummaryEdge = (query) => async ({
  domainId,
  monthToRemove,
}) => {
  let monthToRemoveEdgeCursor
  try {
    monthToRemoveEdgeCursor = await query`
    LET edges = (
      FOR v, e IN 1..1 ANY ${domainId} domainsToDmarcSummaries
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

  return monthToRemoveEdge
}

module.exports = {
  removeSummaryEdge,
}
