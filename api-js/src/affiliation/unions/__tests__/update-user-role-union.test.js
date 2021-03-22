import { affiliationError, updateUserRoleResultType } from '../../objects'
import { updateUserRoleUnion } from '../update-user-role-union'

describe('given the updateUserRoleUnion', () => {
  describe('testing the field types', () => {
    it('contains updateUserRoleResultType', () => {
      const demoType = updateUserRoleUnion.getTypes()

      expect(demoType).toContain(updateUserRoleResultType)
    })
    it('contains affiliationError', () => {
      const demoType = updateUserRoleUnion.getTypes()

      expect(demoType).toContain(affiliationError)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the updateUserRoleResultType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'regular',
          authResult: {},
        }

        expect(updateUserRoleUnion.resolveType(obj)).toMatchObject(
          updateUserRoleResultType,
        )
      })
    })
    describe('testing the affiliationError', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          error: 'sign-in-error',
          code: 401,
          description: 'text',
        }

        expect(updateUserRoleUnion.resolveType(obj)).toMatchObject(
          affiliationError,
        )
      })
    })
  })
})
