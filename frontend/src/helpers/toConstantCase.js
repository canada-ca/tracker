export const toConstantCase = (str) => {
  // ex.  toConstantCase('fullPassPercentage') === 'FULL_PASS_PERCENTAGE'
  // ex.  toConstantCase('full Pass Percentage') === 'FULL_PASS_PERCENTAGE'
  // ex.  toConstantCase('full pass percentage') === 'FULL_PASS_PERCENTAGE'
  return str
    .replace(/([A-Z]|\s([a-z]))/g, '_$1')
    .replace(/\s+/g, '')
    .toUpperCase()
}
