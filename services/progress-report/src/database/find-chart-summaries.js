const findChartSummaries = async ({ log, query, startDate, endDate }) => {
  let cursor
  try {
    cursor = await query`
        FOR cs in chartSummaries
          FILTER DATE_FORMAT(cs.date, '%yyyy-%mm-%dd') >= DATE_FORMAT(${startDate}, '%yyyy-%mm-%dd')
          FILTER DATE_FORMAT(cs.date, '%yyyy-%mm-%dd') <= DATE_FORMAT(${endDate}, '%yyyy-%mm-%dd')
          RETURN cs
    `
  } catch (err) {
    throw new Error(`Database error occurred while trying to find chart summaries: ${err}`)
  }

  let chartSummaries
  try {
    chartSummaries = await cursor.all()
  } catch (err) {
    throw new Error(`Cursor error occurred while trying to find chart summaries: ${err}`)
  }

  log('Successfully found chart summaries')
  return { startSummary: chartSummaries[0], endSummary: chartSummaries[chartSummaries.length - 1] }
}

module.exports = {
  findChartSummaries,
}
