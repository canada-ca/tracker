import { signInUnion, regularSignInResult, tfaSignInResult } from '../index'

describe('given the sign in union', () => {
  describe('testing the field types', () => {
    it('contains regularSignInResult type', () => {
      const demoType = signInUnion.getTypes()

      expect(demoType).toContain(regularSignInResult)
    })
    it('contains tfaSignInResult type', () => {
      const demoType = signInUnion.getTypes()

      expect(demoType).toContain(tfaSignInResult)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the regularSignInResult type', () => {
      it('returns the correct type', () => {
        const obj = {
          authResult: {},
        }

        expect(signInUnion.resolveType(obj)).toMatchObject(regularSignInResult)
      })
    })
    describe('testing the tfaSignInResult type', () => {
      it('returns the correct type', () => {
        const obj = {
          sendMethod: 'phone',
          authenticateToken: 'token',
        }

        expect(signInUnion.resolveType(obj)).toMatchObject(tfaSignInResult)
      })
    })
  })
})
