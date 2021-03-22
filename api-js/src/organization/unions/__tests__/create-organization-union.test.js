import { organizationErrorType, organizationType } from '../../objects'
import { createOrganizationUnion } from '../create-organization-union'

describe('given the createOrganizationUnion', () => {
  describe('testing the field types', () => {
    it('contains organizationType', () => {
      const demoType = createOrganizationUnion.getTypes()

      expect(demoType).toContain(organizationType)
    })
    it('contains organizationErrorType', () => {
      const demoType = createOrganizationUnion.getTypes()

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

        expect(createOrganizationUnion.resolveType(obj)).toMatchObject(
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

        expect(createOrganizationUnion.resolveType(obj)).toMatchObject(
          organizationErrorType,
        )
      })
    })
  })
})
