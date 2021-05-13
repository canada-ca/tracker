import faker from 'faker'

export const getDmarcTableResults = () => {
  const option = faker.datatype.number({ min: 0, max: 3 })

  switch (option) {
    case 0:
      return 'pass'
    case 1:
      return 'fail'
    case 2:
      return 'none'
    case 3:
      return ''
  }
}
