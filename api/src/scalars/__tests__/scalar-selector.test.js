import { Kind } from 'graphql'
import { stringify } from 'jest-matcher-utils'
import { Selectors, SelectorsInput } from '../index'

describe("checking a 'selector' type", () => {
  describe('given a selectors scalar', () => {
    describe('value parsing', () => {
      describe('given valid inputs', () => {
        describe('given a valid selector', () => {
          it('returns test selector', () => {
            const testSelector = 'selector1'
            expect(Selectors.parseValue(testSelector)).toEqual(testSelector)
          })
        })
      })
      describe('given invalid inputs', () => {
        ;[123, {}, [], null, undefined, true].forEach((invalidInput) => {
          it(`throws an error when serializing ${stringify(invalidInput)}`, () => {
            expect(() => Selectors.parseValue(invalidInput)).toThrow(
              new TypeError(`Value is not a string: ${typeof invalidInput}`),
            )
          })
        })
      })
    })
    describe('literal parsing', () => {
      describe('given valid inputs', () => {
        describe('given a valid selector', () => {
          it('returns test selector', () => {
            const testSelector = 'selector1'
            const testLiteral = {
              kind: Kind.STRING,
              value: testSelector,
            }
            expect(Selectors.parseLiteral(testLiteral, {})).toEqual(testSelector)
          })
        })
      })
      describe('given invalid inputs', () => {
        ;[
          {
            kind: Kind.FLOAT,
            value: '5',
          },
          {
            kind: Kind.DOCUMENT,
          },
        ].forEach((literal) => {
          it(`throws an error when parsing invalid literal ${stringify(literal)}`, () => {
            expect(() => Selectors.parseLiteral(literal, {})).toThrow(
              new TypeError(`Can only validate strings as selectors but got a: ${literal.kind}`),
            )
          })
        })
      })
    })
  })
})

describe("checking a 'selectorInput' type", () => {
  describe('serializing inputs', () => {
    describe('given valid inputs', () => {
      describe('given a valid selector', () => {
        it('returns test selector', () => {
          const testSelector = 'selector1'
          expect(SelectorsInput.serialize(testSelector)).toEqual(testSelector)
        })
      })
      describe('given an invalid selector', () => {
        describe('selector contains string', () => {
          it('throws an error', () => {
            const testSelector = 'This is an invalid selector'
            expect(() => SelectorsInput.serialize(testSelector)).toThrow(
              new TypeError(`Value is not a valid selector: ${testSelector}`),
            )
          })
        })
      })
    })
    describe('given invalid inputs', () => {
      ;[123, {}, [], null, undefined, true].forEach((invalidInput) => {
        it(`throws an error when serializing ${stringify(invalidInput)}`, () => {
          expect(() => SelectorsInput.serialize(invalidInput)).toThrow(
            new TypeError(`Value is not a string: ${typeof invalidInput}`),
          )
        })
      })
    })
  })
})
