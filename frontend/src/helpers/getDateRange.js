// Helper to get start/end dates for the selected range
export const getRangeDates = (range) => {
  const now = new Date()
  const year = now.getFullYear()
  let startDate
  let endDate = now.toISOString().slice(0, 10)
  switch (range) {
    case 'last30days':
      startDate = new Date(now.setDate(now.getDate() - 30)).toISOString().slice(0, 10)
      break
    case 'lastyear':
      startDate = new Date(now.setFullYear(year - 1)).toISOString().slice(0, 10)
      break
    case 'ytd':
      startDate = `${year}-01-01`
      break
    case 'all':
      startDate = null
      break
    default:
      startDate = new Date(now.setDate(now.getDate() - 30)).toISOString().slice(0, 10)
  }
  return { startDate, endDate }
}
