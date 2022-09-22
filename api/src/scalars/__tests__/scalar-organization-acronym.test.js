import {Kind} from 'graphql'
import {stringify} from 'jest-matcher-utils'
import {Acronym} from '../index'

describe('given a acronym scalar', () => {
  describe('serializing inputs', () => {
    describe('given valid inputs', () => {
      describe('given a valid acronym', () => {
        it('returns test acronym', () => {
          const testAcronym = 'CANADA'
          expect(Acronym.serialize(testAcronym)).toEqual(testAcronym)
        })
      })
      describe('given an invalid acronym', () => {
        it('throws type error', () => {
          const testAcronym = 'not an acronym!'
          expect(() => Acronym.serialize(testAcronym)).toThrow(
            new TypeError(`Value is not a valid acronym: ${testAcronym}`),
          )
        })
      })
    })
    describe('given invalid inputs', () => {
      ;[123, {}, [], null, undefined, true].forEach((invalidInput) => {
        it(`throws an error when serializing ${stringify(
          invalidInput,
        )}`, () => {
          expect(() => Acronym.serialize(invalidInput)).toThrow(
            new TypeError(`Value is not string: ${typeof invalidInput}`),
          )
        })
      })
    })
  })
  describe('value parsing', () => {
    describe('given valid inputs', () => {
      describe('given a valid acronym', () => {
        const testAcronym = 'CANADA'
        expect(Acronym.parseValue(testAcronym)).toEqual(testAcronym)
      })
      describe('given an invalid acronym', () => {
        const testAcronym = 'not an acronym!'
        expect(() => Acronym.parseValue(testAcronym)).toThrow(
          new TypeError(`Value is not a valid acronym: ${testAcronym}`),
        )
      })
    })
    describe('given invalid inputs', () => {
      ;[123, {}, [], null, undefined, true].forEach((invalidInput) => {
        it(`throws an error when serializing ${stringify(
          invalidInput,
        )}`, () => {
          expect(() => Acronym.parseValue(invalidInput)).toThrow(
            new TypeError(`Value is not string: ${typeof invalidInput}`),
          )
        })
      })
    })
  })
  describe('literal parsing', () => {
    describe('given valid inputs', () => {
      describe('given a valid acronym', () => {
        const testAcronym = 'CANADA'
        const testLiteral = {
          kind: Kind.STRING,
          value: testAcronym,
        }
        expect(Acronym.parseLiteral(testLiteral, {})).toEqual(testAcronym)
      })
      describe('given an invalid acronym', () => {
        const testAcronym = 'not an acronym!'
        const testLiteral = {
          kind: Kind.STRING,
          value: testAcronym,
        }
        expect(() => Acronym.parseLiteral(testLiteral, {})).toThrow(
          new TypeError(`Value is not a valid acronym: ${testAcronym}`),
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
          expect(() => Acronym.parseLiteral(literal, {})).toThrow(
            new TypeError(
              `Can only validate strings as acronyms but got a: ${literal.kind}`,
            ),
          )
        })
      })
    })
  })
})
