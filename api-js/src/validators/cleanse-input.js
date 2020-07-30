const validator = require('validator')

const cleanseInput = (input) => {
  if (typeof input === 'undefined') {
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
