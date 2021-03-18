import {
  resetPasswordErrorType,
  resetPasswordResultType,
} from '../../objects/index'
import { resetPasswordUnion } from '../reset-password-union'

describe('given the resetPasswordUnion', () => {
  describe('testing the field types', () => {
    it('contains resetPasswordResultType', () => {
      const demoType = resetPasswordUnion.getTypes()

      expect(demoType).toContain(resetPasswordResultType)
    })
    it('contains resetPasswordErrorType', () => {
      const demoType = resetPasswordUnion.getTypes()

      expect(demoType).toContain(resetPasswordErrorType)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the resetPasswordResultType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'regular',
          authResult: {},
        }

        expect(resetPasswordUnion.resolveType(obj)).toMatchObject(
          resetPasswordResultType,
        )
      })
    })
    describe('testing the resetPasswordErrorType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          error: 'sign-in-error',
          code: 401,
          description: 'text',
        }

        expect(resetPasswordUnion.resolveType(obj)).toMatchObject(
          resetPasswordErrorType,
        )
      })
    })
  })
})
