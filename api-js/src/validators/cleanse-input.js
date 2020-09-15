const validator = require('validator')

const cleanseInput = (input) => {
  if (typeof input !== 'string' && typeof input !== 'number') {
    return ''
  }
  input = validator.trim(input)
  input = validator.stripLow(input)
  input = validator.escape(input)
  return input
}

module.exports = {
  cleanseInput,
}
