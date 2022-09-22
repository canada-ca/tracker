import {Kind} from 'graphql'
import {stringify} from 'jest-matcher-utils'
import {Slug} from '../index'

describe('given a slug scalar', () => {
  describe('serializing inputs', () => {
    describe('given valid inputs', () => {
      describe('given a valid slug', () => {
        it('returns test slug', () => {
          const testSlug = 'this-is-a-valid-slug'
          expect(Slug.serialize(testSlug)).toEqual(testSlug)
        })
      })

      describe('given an invalid slug', () => {
        it('throws an error', () => {
          const testSlug = 'This is an invalid slug'
          expect(() => Slug.serialize(testSlug)).toThrow(
            new TypeError(`Value is not a valid slug: ${testSlug}`),
          )
        })
      })
    })

    describe('given invalid inputs', () => {
      ;[123, {}, [], null, undefined, true].forEach((invalidInput) => {
        it(`throws an error when serializing ${stringify(
          invalidInput,
        )}`, () => {
          expect(() => Slug.serialize(invalidInput)).toThrow(
            new TypeError(`Value is not string: ${typeof invalidInput}`),
          )
        })
      })
    })
  })

  describe('value parsing', () => {
    describe('given valid inputs', () => {
      describe('given a valid slug', () => {
        it('returns the test slug', () => {
          const testSlug = 'valid-slug'
          expect(Slug.parseValue(testSlug)).toEqual(testSlug)
        })
      })
      describe('given an invalid slug', () => {
        it('throws a type error', () => {
          const testSlug = 'invalid slug'
          expect(() => Slug.parseValue(testSlug)).toThrow(
            new TypeError(`Value is not a valid slug: ${testSlug}`),
          )
        })
      })
    })
    describe('given invalid inputs', () => {
      ;[123, {}, [], null, undefined, true].forEach((invalidInput) => {
        it(`throws an error when value parsing ${stringify(
          invalidInput,
        )}`, () => {
          expect(() => Slug.parseValue(invalidInput)).toThrow(
            new TypeError(`Value is not string: ${typeof invalidInput}`),
          )
        })
      })
    })
  })

  describe('literal parsing', () => {
    describe('given valid inputs', () => {
      describe('given a valid slug', () => {
        const testSlug = 'valid-slug'
        const testLiteral = {
          kind: Kind.STRING,
          value: testSlug,
        }
        expect(Slug.parseLiteral(testLiteral, {})).toEqual(testSlug)
      })
      describe('given an invalid slug', () => {
        const testSlug = 'invalid slug'
        const testLiteral = {
          kind: Kind.STRING,
          value: testSlug,
        }
        expect(() => Slug.parseLiteral(testLiteral, {})).toThrow(
          new TypeError(`Value is not a valid slug: ${testSlug}`),
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
          expect(() => Slug.parseLiteral(literal, {})).toThrow(
            new TypeError(
              `Can only validate strings as slug but got a: ${literal.kind}`,
            ),
          )
        })
      })
    })
  })
})
