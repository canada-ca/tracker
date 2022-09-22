import {
  authResultType,
  signInError,
  tfaSignInResult,
} from '../../objects/index'
import {signInUnion} from '../sign-in-union'

describe('given the sign in union', () => {
  describe('testing the field types', () => {
    it('contains authResultType type', () => {
      const demoType = signInUnion.getTypes()

      expect(demoType).toContain(authResultType)
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
    describe('testing the authResult type', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'regular',
          authResult: {},
        }

        expect(signInUnion.resolveType(obj)).toMatchObject(authResultType)
      })
    })
    describe('testing the signInError type', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
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
          _type: 'tfa',
          sendMethod: 'phone',
          authenticateToken: 'token',
        }

        expect(signInUnion.resolveType(obj)).toMatchObject(tfaSignInResult)
      })
    })
  })
})
