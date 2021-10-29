import validator from 'validator'

export const cleanseInput = (input) => {
  if (typeof input !== 'string' && typeof input !== 'number') {
    return ''
  }
  input = validator.trim(input)
  input = validator.stripLow(input)
  input = customEscape(input)
  return input
}

const customEscape = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, 'ʼ')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#96;')
}
