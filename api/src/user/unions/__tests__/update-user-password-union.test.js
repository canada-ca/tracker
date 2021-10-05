import {
  updateUserPasswordErrorType,
  updateUserPasswordResultType,
} from '../../objects/index'
import { updateUserPasswordUnion } from '../update-user-password-union'

describe('given the updateUserPasswordUnion', () => {
  describe('testing the field types', () => {
    it('contains updateUserPasswordResultType', () => {
      const demoType = updateUserPasswordUnion.getTypes()

      expect(demoType).toContain(updateUserPasswordResultType)
    })
    it('contains updateUserPasswordErrorType', () => {
      const demoType = updateUserPasswordUnion.getTypes()

      expect(demoType).toContain(updateUserPasswordErrorType)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the updateUserPasswordResultType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'regular',
          authResult: {},
        }

        expect(updateUserPasswordUnion.resolveType(obj)).toMatchObject(
          updateUserPasswordResultType,
        )
      })
    })
    describe('testing the updateUserPasswordErrorType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          error: 'sign-in-error',
          code: 401,
          description: 'text',
        }

        expect(updateUserPasswordUnion.resolveType(obj)).toMatchObject(
          updateUserPasswordErrorType,
        )
      })
    })
  })
})
