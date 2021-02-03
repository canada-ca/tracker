const database = require('./database')
const loaders = require('./loaders')
const { arrayEquals } = require('./array-equals')
const { calculatePercentages } = require('./calculate-percentages')

module.exports = {
  ...database,
  ...loaders,
  arrayEquals,
  calculatePercentages,
}
