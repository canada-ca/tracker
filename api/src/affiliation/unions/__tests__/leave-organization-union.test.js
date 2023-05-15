import {
  affiliationError,
  leaveOrganizationResultType,
} from '../../objects/index'
import {leaveOrganizationUnion} from '../leave-organization-union'

describe('given the leaveOrganizationUnion', () => {
  describe('testing the field types', () => {
    it('contains inviteUserToOrgResultType', () => {
      const demoType = leaveOrganizationUnion.getTypes()

      expect(demoType).toContain(leaveOrganizationResultType)
    })
    it('contains affiliationError', () => {
      const demoType = leaveOrganizationUnion.getTypes()

      expect(demoType).toContain(affiliationError)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the leaveOrganizationResultType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'regular',
          authResult: {},
        }

        expect(leaveOrganizationUnion.resolveType(obj)).toMatchObject(
          leaveOrganizationResultType,
        )
      })
    })
    describe('testing the affiliationError', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          error: 'error text',
          code: 401,
          description: 'text',
        }

        expect(leaveOrganizationUnion.resolveType(obj)).toMatchObject(
          affiliationError,
        )
      })
    })
  })
})
