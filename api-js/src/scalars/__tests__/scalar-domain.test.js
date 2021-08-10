import { Kind } from 'graphql'
import { stringify } from 'jest-matcher-utils'
import { Domain } from '../index'

describe('given a domain scalar', () => {
  describe('serializing inputs', () => {
    describe('given valid inputs', () => {
      describe('given a valid domain', () => {
        it('returns test domain', () => {
          const testDomain = 'test.domain.ca'
          expect(Domain.serialize(testDomain)).toEqual(testDomain)
        })
      })
      describe('given a domain with uppercase letters', () => {
        it('sends it to lower', () => {
          const testDomain = 'test.DOMAIN.ca'
          expect(Domain.serialize(testDomain)).toEqual('test.domain.ca')
        })
      })
      describe('given an invalid domain', () => {
        it('throws type error', () => {
          const testDomain = 'not an domain'
          expect(() => Domain.serialize(testDomain)).toThrow(
            new TypeError(`Value is not a valid domain: ${testDomain}`),
          )
        })
      })
    })
    describe('given invalid inputs', () => {
      ;[123, {}, [], null, undefined, true].forEach((invalidInput) => {
        it(`throws an error when serializing ${stringify(
          invalidInput,
        )}`, () => {
          expect(() => Domain.serialize(invalidInput)).toThrow(
            new TypeError(`Value is not a string: ${typeof invalidInput}`),
          )
        })
      })
    })
  })
  describe('value parsing', () => {
    describe('given valid inputs', () => {
      describe('given a valid domain', () => {
        const testDomain = 'test.domain.ca'
        expect(Domain.parseValue(testDomain)).toEqual(testDomain)
      })
      describe('given a domain with uppercase letters', () => {
        it('sends it to lower', () => {
          const testDomain = 'test.DOMAIN.ca'
          expect(Domain.parseValue(testDomain)).toEqual('test.domain.ca')
        })
      })
      describe('given an invalid domain', () => {
        const testDomain = 'not an domain'
        expect(() => Domain.parseValue(testDomain)).toThrow(
          new TypeError(`Value is not a valid domain: ${testDomain}`),
        )
      })
    })
    describe('given invalid inputs', () => {
      ;[123, {}, [], null, undefined, true].forEach((invalidInput) => {
        it(`throws an error when serializing ${stringify(
          invalidInput,
        )}`, () => {
          expect(() => Domain.parseValue(invalidInput)).toThrow(
            new TypeError(`Value is not a string: ${typeof invalidInput}`),
          )
        })
      })
    })
  })
  describe('literal parsing', () => {
    describe('given valid inputs', () => {
      describe('given a valid domain', () => {
        const testDomain = 'test.domain.ca'
        const testLiteral = {
          kind: Kind.STRING,
          value: testDomain,
        }
        expect(Domain.parseLiteral(testLiteral, {})).toEqual(testDomain)
      })
      describe('given a domain with uppercase letters', () => {
        it('sends it to lower', () => {
          const testDomain = 'test.DOMAIN.ca'
          const testLiteral = {
            kind: Kind.STRING,
            value: testDomain,
          }
          expect(Domain.parseLiteral(testLiteral, {})).toEqual('test.domain.ca')
        })
      })
      describe('given an invalid domain', () => {
        const testDomain = 'not an domain'
        const testLiteral = {
          kind: Kind.STRING,
          value: testDomain,
        }
        expect(() => Domain.parseLiteral(testLiteral, {})).toThrow(
          new TypeError(`Value is not a valid domain: ${testDomain}`),
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
          expect(() => Domain.parseLiteral(literal, {})).toThrow(
            new TypeError(
              `Can only validate strings as domains but got a: ${literal.kind}`,
            ),
          )
        })
      })
    })
  })
})
