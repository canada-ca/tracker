import {
  verifyAccountErrorType,
  verifyAccountResultType,
} from '../../objects/index'
import { verifyAccountUnion } from '../verify-account-union'

describe('given the verifyAccountUnion', () => {
  describe('testing the field types', () => {
    it('contains verifyAccountResultType', () => {
      const demoType = verifyAccountUnion.getTypes()

      expect(demoType).toContain(verifyAccountResultType)
    })
    it('contains verifyAccountErrorType', () => {
      const demoType = verifyAccountUnion.getTypes()

      expect(demoType).toContain(verifyAccountErrorType)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the verifyAccountResultType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'success',
          authResult: {},
        }

        expect(verifyAccountUnion.resolveType(obj)).toMatchObject(
          verifyAccountResultType,
        )
      })
    })
    describe('testing the verifyAccountErrorType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          error: 'sign-in-error',
          code: 401,
          description: 'text',
        }

        expect(verifyAccountUnion.resolveType(obj)).toMatchObject(
          verifyAccountErrorType,
        )
      })
    })
  })
})
