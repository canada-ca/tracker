const { arrayEquals } = require('../array-equals')

describe('given the arrayEquals function', () => {
  describe('arrays are equal', () => {
    it('returns true', () => {
      const arr1 = [{ startDate: '2020-12-01' }, { startDate: '2021-01-01' }]
      const arr2 = [{ startDate: '2020-12-01' }, { startDate: '2021-01-01' }]

      expect(arrayEquals(arr1, arr2)).toBeTruthy()
    })
  })
  describe('arrays are not equal', () => {
    it('returns false', () => {
      const arr1 = [{ startDate: '2020-12-01' }, { startDate: '2021-01-01' }]
      const arr2 = [{ startDate: '2021-01-01' }, { startDate: '2021-02-01' }]

      expect(arrayEquals(arr1, arr2)).toBeFalsy()
    })
  })
})
