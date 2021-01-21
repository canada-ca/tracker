const createSummary = (query) => async ({ currentSummary }) => {
  let summaryCursor
  try {
    summaryCursor = await query`
      INSERT ${currentSummary} INTO dmarcSummaries OPTIONS { waitForSync: true } RETURN NEW
    `
  } catch (err) {
    throw new Error(err)
  }
  
  const summaryDBInfo = await summaryCursor.next()

  return summaryDBInfo
}

module.exports = {
  createSummary,
}
