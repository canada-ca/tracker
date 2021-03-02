import {
  regularSignInResult,
  signInError,
  tfaSignInResult,
} from '../../objects/index'
import { signInUnion } from '../sign-in-union'

describe('given the sign in union', () => {
  describe('testing the field types', () => {
    it('contains regularSignInResult type', () => {
      const demoType = signInUnion.getTypes()

      expect(demoType).toContain(regularSignInResult)
    })
    it('contains signInError type', () => {
      const demoType = signInUnion.getTypes()

      expect(demoType).toContain(signInError)
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
    describe('testing the signInError type', () => {
      it('returns the correct type', () => {
        const obj = {
          error: 'sign-in-error',
          code: 401,
          description: 'text',
        }

        expect(signInUnion.resolveType(obj)).toMatchObject(signInError)
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
