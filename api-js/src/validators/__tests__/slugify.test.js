const { stringify } = require('jest-matcher-utils')
const { slugify } = require('..')

describe('given a string', () => {
  it('lowers all characters', () => {
    expect(slugify('STRING')).toEqual('string')
  })
  it('replaces spaces with dashes', () => {
    expect(slugify('a lot of spaces')).toEqual('a-lot-of-spaces')
  })
  it('changes special characters to ascii', () => {
    expect(
      slugify('á é í ó ú Á É Í Ó Ú ç Ç æ Æ œ Œ ® © € ¥ ª º ¹ ² ½ ¼'),
    ).toEqual('a-e-i-o-u-a-e-i-o-u-c-c-ae-ae-oe-oe-r-c-eu-y-a-o-1-2-1-2-1-4')
  })
  describe('if input value is not a string', () => {
    ;[123, {}, [], null, undefined, true].forEach((invalidInput) => {
      it(`returns undefined when value is ${stringify(invalidInput)}`, () => {
        expect(slugify(invalidInput)).toEqual(undefined)
      })
    })
  })
})
