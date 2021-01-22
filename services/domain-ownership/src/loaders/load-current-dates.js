const loadCurrentDates = (query) => async () => {
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
  
  return dbStartDates
}

module.exports = {
  loadCurrentDates,
}
