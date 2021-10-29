import { organizationErrorType, organizationResultType } from '../../objects'
import { removeOrganizationUnion } from '../remove-organization-union'

describe('given the removeOrganizationUnion', () => {
  describe('testing the field types', () => {
    it('contains organizationResultType', () => {
      const demoType = removeOrganizationUnion.getTypes()

      expect(demoType).toContain(organizationResultType)
    })
    it('contains organizationErrorType', () => {
      const demoType = removeOrganizationUnion.getTypes()

      expect(demoType).toContain(organizationErrorType)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the organizationResultType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'result',
          status: 'status',
        }

        expect(removeOrganizationUnion.resolveType(obj)).toMatchObject(
          organizationResultType,
        )
      })
    })
    describe('testing the organizationErrorType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          error: 'sign-in-error',
          code: 401,
          description: 'text',
        }

        expect(removeOrganizationUnion.resolveType(obj)).toMatchObject(
          organizationErrorType,
        )
      })
    })
  })
})
