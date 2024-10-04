import faker from 'faker'

export const getStringOfDomains = (min, max) => {
  let domains = ''
  const numberOfDomains = faker.datatype.number({ min, max })
  for (let i = 0; i < numberOfDomains; i++) {
    // comma-separate domains
    if (i > 0) domains = domains + ','

    domains = domains + faker.internet.domainName()
  }

  return domains
}
