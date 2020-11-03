const database = require('./database')
const loaders = require('./loaders')

module.exports = {
  ...database,
  ...loaders,
}
