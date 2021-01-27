const removeSummary = (query) => async ({ summaryId }) => {
  try {
    await query`
    FOR summary IN dmarcSummaries
      FILTER summary._id == ${summaryId}
      REMOVE summary._key IN dmarcSummaries
  `
  } catch (err) {
    throw new Error(err)
  }
}

module.exports = {
  removeSummary,
}
