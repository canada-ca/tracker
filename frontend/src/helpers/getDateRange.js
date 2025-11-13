// Helper to get start/end dates for the selected range
export const getRangeDates = (range) => {
  const now = new Date()
  const year = now.getFullYear()
  let startDate, endDate
  switch (range) {
    case 'last30days':
      endDate = now.toISOString().slice(0, 10)
      startDate = new Date(now.setDate(now.getDate() - 30)).toISOString().slice(0, 10)
      break
    case 'lastyear':
      endDate = now.toISOString().slice(0, 10)
      startDate = new Date(now.setFullYear(year - 1)).toISOString().slice(0, 10)
      break
    case 'ytd':
      endDate = now.toISOString().slice(0, 10)
      startDate = `${year}-01-01`
      break
    default:
      endDate = now.toISOString().slice(0, 10)
      startDate = new Date(now.setDate(now.getDate() - 30)).toISOString().slice(0, 10)
  }
  return { startDate, endDate }
}
