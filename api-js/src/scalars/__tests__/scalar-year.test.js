import { Kind } from 'graphql'
import { stringify } from 'jest-matcher-utils'
import { Year } from '../index'

describe('given a year scalar', () => {
  describe('serializing inputs', () => {
    describe('given valid inputs', () => {
      describe('given a valid year', () => {
        it('returns test year', () => {
          const testYear = '2020'
          expect(Year.serialize(testYear)).toEqual(testYear)
        })
      })
      describe('given an invalid year', () => {
        it('throws a typeError', () => {
          const testYear = 'Text'
          expect(() => Year.serialize(testYear)).toThrow(
            new TypeError(`Value is not a valid year: ${testYear}`),
          )
        })
      })
    })
    describe('given invalid inputs', () => {
      ;[123, {}, [], null, undefined, true].forEach((invalidInput) => {
        it(`throws an error when serializing ${stringify(
          invalidInput,
        )}`, () => {
          expect(() => Year.serialize(invalidInput)).toThrow(
            new TypeError(`Value is not string: ${typeof invalidInput}`),
          )
        })
      })
    })
  })

  describe('value parsing', () => {
    describe('given valid inputs', () => {
      describe('given a valid year', () => {
        it('returns test year', () => {
          const testYear = '2020'
          expect(Year.parseValue(testYear)).toEqual(testYear)
        })
      })
      describe('given an invalid year', () => {
        const testYear = 'Text'
        expect(() => Year.parseValue(testYear)).toThrow(
          new TypeError(`Value is not a valid year: ${testYear}`),
        )
      })
    })
    describe('given invalid inputs', () => {
      ;[123, {}, [], null, undefined, true].forEach((invalidInput) => {
        it(`throws an error when serializing ${stringify(
          invalidInput,
        )}`, () => {
          expect(() => Year.parseValue(invalidInput)).toThrow(
            new TypeError(`Value is not string: ${typeof invalidInput}`),
          )
        })
      })
    })
  })

  describe('literal parsing', () => {
    describe('given valid inputs', () => {
      describe('given a valid year', () => {
        const testYear = '2020'
        const testLiteral = {
          kind: Kind.STRING,
          value: testYear,
        }
        expect(Year.parseLiteral(testLiteral, {})).toEqual(testYear)
      })
      describe('given an invalid year', () => {
        const testYear = 'Text'
        const testLiteral = {
          kind: Kind.STRING,
          value: testYear,
        }
        expect(() => Year.parseLiteral(testLiteral, {})).toThrow(
          new TypeError(`Value is not a valid year: ${testYear}`),
        )
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
        it(`throws an error when parsing invalid literal ${stringify(
          literal,
        )}`, () => {
          expect(() => Year.parseLiteral(literal, {})).toThrow(
            new TypeError(
              `Can only validate strings as year but got a: ${literal.kind}`,
            ),
          )
        })
      })
    })
  })
})
