const { calculatePercentages } = require('../calculate-percentages')

describe('given the calculatePercentages', () => {
  describe('values are greater then zero', () => {
    const categoryTotals = {
      pass: 2,
      fail: 3,
      passDkimOnly: 4,
      passSpfOnly: 5,
    }
    describe('pass is greater then zero', () => {
      it('returns percentage', () => {
        const percentages = calculatePercentages(categoryTotals)

        expect(percentages.pass).toEqual(14.3)
      })
    })
    describe('fail is greater then zero', () => {
      it('returns percentage', () => {
        const percentages = calculatePercentages(categoryTotals)

        expect(percentages.fail).toEqual(21.4)
      })
    })
    describe('passDkimOnly is greater then zero', () => {
      it('returns percentage', () => {
        const percentages = calculatePercentages(categoryTotals)

        expect(percentages.passDkimOnly).toEqual(28.6)
      })
    })
    describe('passSpfOnly is greater then zero', () => {
      it('returns percentage', () => {
        const percentages = calculatePercentages(categoryTotals)

        expect(percentages.passSpfOnly).toEqual(35.7)
      })
    })
  })
  describe('values are less then zero', () => {
    const categoryTotals = {
      pass: 0,
      fail: 0,
      passDkimOnly: 0,
      passSpfOnly: 0,
    }
    describe('pass is less then zero', () => {
      it('returns 0', () => {
        const percentages = calculatePercentages(categoryTotals)

        expect(percentages.pass).toEqual(0)
      })
    })
    describe('fail is less then zero', () => {
      it('returns 0', () => {
        const percentages = calculatePercentages(categoryTotals)

        expect(percentages.fail).toEqual(0)
      })
    })
    describe('passDkimOnly is less then zero', () => {
      it('returns 0', () => {
        const percentages = calculatePercentages(categoryTotals)

        expect(percentages.passDkimOnly).toEqual(0)
      })
    })
    describe('passSpfOnly is less then zero', () => {
      it('returns 0', () => {
        const percentages = calculatePercentages(categoryTotals)

        expect(percentages.passSpfOnly).toEqual(0)
      })
    })
  })
})
