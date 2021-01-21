const moment = require('moment')

const loadDates = ({ startDate }) => {
  let start = moment(startDate)
  const dates = []

  for (let i=1; i <= 13; i++) {
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