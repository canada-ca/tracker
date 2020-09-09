const { cleanseInput } = require('../validators')

describe('given an input validate it', () => {
  describe('string contains symbols', () => {
    it('returns parsed string', () => {
      const testString = '!@#$%^&*()_+-=|{}\\[]<>?,./`:;\'"'
      expect(cleanseInput(testString)).toEqual(
        '!@#$%^&amp;*()_+-=|{}&#x5C;[]&lt;&gt;?,.&#x2F;&#96;:;&#x27;&quot;',
      )
    })
  })
  describe('input is not given a string', () => {
    describe('input is undefined', () => {
      it('returns an empty string', () => {
        const testString = undefined
        expect(cleanseInput(testString)).toEqual('')
      })
    })
    describe('input is null', () => {
      it('returns an empty string', () => {
        const testString = null
        expect(cleanseInput(testString)).toEqual('')
      })
    })
  })
})
