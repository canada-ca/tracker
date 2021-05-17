import faker from 'faker'

const locations = [
  {
    city: 'Ottawa',
    province: 'Ontario',
  },
  { city: 'Gatineau', province: 'Quebec' },

  { city: 'Halifax', province: 'Nova Scotia' },
  { city: 'Moncton', province: 'New Brunswick' },
]

export const getCanadianLocation = () => {
  return faker.helpers.randomize(locations)
}
