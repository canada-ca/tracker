import {
  removeUserFromOrgErrorType,
  removeUserFromOrgResultType,
} from '../../objects'
import { removeUserFromOrgUnion } from '../remove-user-from-org-union'

describe('given the removeUserFromOrgUnion', () => {
  describe('testing the field types', () => {
    it('contains removeUserFromOrgResultType', () => {
      const demoType = removeUserFromOrgUnion.getTypes()

      expect(demoType).toContain(removeUserFromOrgResultType)
    })
    it('contains removeUserFromOrgErrorType', () => {
      const demoType = removeUserFromOrgUnion.getTypes()

      expect(demoType).toContain(removeUserFromOrgErrorType)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the removeUserFromOrgResultType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'regular',
          authResult: {},
        }

        expect(removeUserFromOrgUnion.resolveType(obj)).toMatchObject(
          removeUserFromOrgResultType,
        )
      })
    })
    describe('testing the removeUserFromOrgErrorType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          error: 'sign-in-error',
          code: 401,
          description: 'text',
        }

        expect(removeUserFromOrgUnion.resolveType(obj)).toMatchObject(
          removeUserFromOrgErrorType,
        )
      })
    })
  })
})
