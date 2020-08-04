const { Kind } = require('graphql')
const { stringify } = require('jest-matcher-utils')
const { Selectors } = require('../scalars')

describe('given a selectors scalar', () => {
  describe('serializing inputs', () => {
    describe('given valid inputs', () => {
      describe('given a valid selector', () => {
        it('returns test selector', () => {
          const testSelector = ['selector1._domainkey', 'selector2._domainkey']
          expect(Selectors.serialize(testSelector)).toEqual(testSelector)
        })
      })
      describe('given an invalid selector', () => {
        describe('selector contains string', () => {
          it('throws an error', () => {
            const testSelector = ['This is an invalid selector']
            expect(() => Selectors.serialize(testSelector)).toThrow(
              new TypeError(`Value is not a vaild selector: ${testSelector}`),
            )
          })
        })
        describe('selector does not contain string', () => {
          it('throws an error', () => {
            const testSelector = [123]
            expect(() => Selectors.serialize(testSelector)).toThrow(
              new TypeError(`Value is not a string: ${testSelector}`),
            )
          })
        })
      })
    })
    describe('given invalid inputs', () => {
      ;[123, {}, 'string', null, undefined, true].forEach((invalidInput) => {
        it(`throws an error when serializing ${stringify(
          invalidInput,
        )}`, () => {
          expect(() => Selectors.serialize(invalidInput)).toThrow(
            new TypeError(`Value is not list: ${typeof invalidInput}`),
          )
        })
      })
    })
  })
  describe('value parsing', () => {
    describe('given valid inputs', () => {
      describe('given a valid selector', () => {
        it('returns test selector', () => {
          const testSelector = ['selector1._domainkey', 'selector2._domainkey']
          expect(Selectors.parseValue(testSelector)).toEqual(testSelector)
        })
      })
      describe('given an invalid selector', () => {
        describe('selector contains string', () => {
          it('throws an error', () => {
            const testSelector = ['This is an invalid selector']
            expect(() => Selectors.parseValue(testSelector)).toThrow(
              new TypeError(`Value is not a vaild selector: ${testSelector}`),
            )
          })
        })
        describe('selector does not contain string', () => {
          it('throws an error', () => {
            const testSelector = [123]
            expect(() => Selectors.parseValue(testSelector)).toThrow(
              new TypeError(`Value is not a string: ${testSelector}`),
            )
          })
        })
      })
    })
    describe('given invalid inputs', () => {
      ;[123, {}, 'string', null, undefined, true].forEach((invalidInput) => {
        it(`throws an error when serializing ${stringify(
          invalidInput,
        )}`, () => {
          expect(() => Selectors.parseValue(invalidInput)).toThrow(
            new TypeError(`Value is not list: ${typeof invalidInput}`),
          )
        })
      })
    })
  })
  describe('literal parsing', () => {
    describe('given valid inputs', () => {
      describe('given a valid selector', () => {
        it('returns test selector', () => {
          const testSelector = ['selector1._domainkey', 'selector2._domainkey']
          const testLiteral = {
            kind: Kind.LIST,
            value: testSelector,
          }
          expect(Selectors.parseLiteral(testLiteral, {})).toEqual(testSelector)
        })
      })
      describe('given an invalid selector', () => {
        describe('selector contains string', () => {
          it('throws an error', () => {
            const testSelector = ['This is an invalid selector']
            const testLiteral = {
              kind: Kind.LIST,
              value: testSelector,
            }
            expect(() => Selectors.parseLiteral(testLiteral, {})).toThrow(
              new TypeError(`Value is not a vaild selector: ${testSelector}`),
            )
          })
        })
        describe('selector does not contain string', () => {
          it('throws an error', () => {
            const testSelector = [123]
            const testLiteral = {
              kind: Kind.LIST,
              value: testSelector,
            }
            expect(() => Selectors.parseLiteral(testLiteral, {})).toThrow(
              new TypeError(`Value is not a string: ${testSelector}`),
            )
          })
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
        it(`throws an error when parsing invalid literal ${stringify(
          literal,
        )}`, () => {
          expect(() => Selectors.parseLiteral(literal, {})).toThrow(
            new TypeError(
              `Can only validate lists as selectors but got a: ${literal.kind}`,
            ),
          )
        })
      })
    })
  })
})
