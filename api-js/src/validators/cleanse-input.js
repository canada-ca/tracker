import validator from 'validator'

export const cleanseInput = (input) => {
  if (typeof input !== 'string' && typeof input !== 'number') {
    return ''
  }
  input = validator.trim(input)
  input = validator.stripLow(input)
  input = validator.escape(input)
  return input
}
