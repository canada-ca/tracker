const loadDates = (moment) => ({ startDate }) => {
  // Check to see if startDate is a string
  if (typeof startDate !== 'string') {
    console.warn(
      `Error: startDate for dateRange must be of type string, instead: startDate: ${typeof startDate}`,
    )
    throw new Error('Start date is not a valid string. Please try again.')
  }

  // Check to see if startDate matches the following regex
  const DATE_REGEX = /\d\d\d\d-\d\d-\d\d/
  if (!DATE_REGEX.test(startDate)) {
    console.warn(
      `Error: startDate for dateRange must conform to format: YYYY-MM-DD, instead: startDate: ${startDate}`,
    )
    throw new Error(
      'Start date is not a valid format, please conform to YYYY-MM-DD. Please try again.',
    )
  }

  let start = moment(startDate)
  const dates = []

  for (let i = 1; i <= 13; i++) {
    dates.push({
      startDate: start.startOf('month').format('YYYY-MM-DD'),
    })
    start = start.add(1, 'month')
  }

  return dates
}

module.exports = {
  loadDates,
}
