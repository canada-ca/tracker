import faker from 'faker'

export const getDkimSelectors = () => {
  let selectors = ''
  const numberOfSelectors = faker.datatype.number({ min: 0, max: 2 })
  if (numberOfSelectors === 0) {
    // sometimes return 'none' in place of empty string when no selectors exist
    if (faker.datatype.number({ min: 0, max: 1 }) === 0) {
      selectors = 'none'
    }
    return selectors
  }

  for (let i = 0; i < numberOfSelectors; i++) {
    // comma-separate selectors
    if (i > 0) selectors = selectors + ','
    selectors =
      selectors + 'selector' + faker.datatype.number({ min: 0, max: 9 })
  }

  return selectors
}
