import faker from 'faker'

export const getDmarcTableResults = () => {
  return faker.helpers.randomize(['pass', 'fail', 'none', ''])
}
