const { calculatePercentages } = require('../calculate-percentages')

describe('given the calculatePercentages', () => {
  describe('values are greater then zero', () => {
    const categoryTotals = {
      pass: 1,
      fail: 3,
      passDkimOnly: 100,
      passSpfOnly: 50,
    }
    describe('pass is greater then zero', () => {
      it('returns percentage', () => {
        const { categoryPercentages } = calculatePercentages(categoryTotals)

        expect(categoryPercentages.pass).toEqual(0.6)
      })
    })
    describe('fail is greater then zero', () => {
      it('returns percentage', () => {
        const { categoryPercentages } = calculatePercentages(categoryTotals)

        expect(categoryPercentages.fail).toEqual(1.9)
      })
    })
    describe('passDkimOnly is greater then zero', () => {
      it('returns percentage', () => {
        const { categoryPercentages } = calculatePercentages(categoryTotals)

        expect(categoryPercentages.passDkimOnly).toEqual(64.9)
      })
    })
    describe('passSpfOnly is greater then zero', () => {
      it('returns percentage', () => {
        const { categoryPercentages } = calculatePercentages(categoryTotals)

        expect(categoryPercentages.passSpfOnly).toEqual(32.5)
      })
    })
    describe('total messages add up to totalMessages', () => {
      it('returns total messages', () => {
        const { totalMessages } = calculatePercentages(categoryTotals)

        expect(totalMessages).toEqual(154)
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
        const { categoryPercentages } = calculatePercentages(categoryTotals)

        expect(categoryPercentages.pass).toEqual(0)
      })
    })
    describe('fail is less then zero', () => {
      it('returns 0', () => {
        const { categoryPercentages } = calculatePercentages(categoryTotals)

        expect(categoryPercentages.fail).toEqual(0)
      })
    })
    describe('passDkimOnly is less then zero', () => {
      it('returns 0', () => {
        const { categoryPercentages } = calculatePercentages(categoryTotals)

        expect(categoryPercentages.passDkimOnly).toEqual(0)
      })
    })
    describe('passSpfOnly is less then zero', () => {
      it('returns 0', () => {
        const { categoryPercentages } = calculatePercentages(categoryTotals)

        expect(categoryPercentages.passSpfOnly).toEqual(0)
      })
    })
    describe('total messages add up to 0', () => {
      it('returns 0', () => {
        const { totalMessages } = calculatePercentages(categoryTotals)

        expect(totalMessages).toEqual(0)
      })
    })
  })
})
