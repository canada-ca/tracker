import { organizationErrorType, organizationResultType } from '../../objects'
import { verifyOrganizationUnion } from '../verify-organization-union'

describe('given the verifyOrganizationUnion', () => {
  describe('testing the field types', () => {
    it('contains organizationResultType', () => {
      const demoType = verifyOrganizationUnion.getTypes()

      expect(demoType).toContain(organizationResultType)
    })
    it('contains organizationErrorType', () => {
      const demoType = verifyOrganizationUnion.getTypes()

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

        expect(verifyOrganizationUnion.resolveType(obj)).toMatchObject(
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

        expect(verifyOrganizationUnion.resolveType(obj)).toMatchObject(
          organizationErrorType,
        )
      })
    })
  })
})
