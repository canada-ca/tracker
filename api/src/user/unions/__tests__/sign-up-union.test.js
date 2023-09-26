import { tfaSignInResult, signUpError } from '../../objects/index'
import { signUpUnion } from '../sign-up-union'

describe('given the sign up union', () => {
  describe('testing the field types', () => {
    it('contains tfaSignInResult type', () => {
      const demoType = signUpUnion.getTypes()

      expect(demoType).toContain(tfaSignInResult)
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
          _type: 'tfaSignInResult',
          authResult: {},
        }

        expect(signUpUnion.resolveType(obj)).toMatch(tfaSignInResult.name)
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

        expect(signUpUnion.resolveType(obj)).toMatch(signUpError.name)
      })
    })
  })
})
