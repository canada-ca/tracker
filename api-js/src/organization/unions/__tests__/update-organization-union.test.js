import { organizationErrorType, organizationType } from '../../objects'
import { updateOrganizationUnion } from '../update-organization-union'

describe('given the updateOrganizationUnion', () => {
  describe('testing the field types', () => {
    it('contains organizationType', () => {
      const demoType = updateOrganizationUnion.getTypes()

      expect(demoType).toContain(organizationType)
    })
    it('contains organizationErrorType', () => {
      const demoType = updateOrganizationUnion.getTypes()

      expect(demoType).toContain(organizationErrorType)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the organizationType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'organization',
          domain: {},
        }

        expect(updateOrganizationUnion.resolveType(obj)).toMatchObject(
          organizationType,
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

        expect(updateOrganizationUnion.resolveType(obj)).toMatchObject(
          organizationErrorType,
        )
      })
    })
  })
})
