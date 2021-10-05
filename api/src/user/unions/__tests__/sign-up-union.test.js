import { authResultType, signUpError } from '../../objects/index'
import { signUpUnion } from '../sign-up-union'

describe('given the sign up union', () => {
  describe('testing the field types', () => {
    it('contains authResultType type', () => {
      const demoType = signUpUnion.getTypes()

      expect(demoType).toContain(authResultType)
    })
    it('contains signUpError type', () => {
      const demoType = signUpUnion.getTypes()

      expect(demoType).toContain(signUpError)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the authResult type', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'authResult',
          authResult: {},
        }

        expect(signUpUnion.resolveType(obj)).toMatchObject(authResultType)
      })
    })
    describe('testing the signUpError type', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          error: 'sign-in-error',
          code: 401,
          description: 'text',
        }

        expect(signUpUnion.resolveType(obj)).toMatchObject(signUpError)
      })
    })
  })
})
