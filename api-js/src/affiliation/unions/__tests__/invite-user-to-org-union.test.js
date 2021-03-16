import {
  inviteUserToOrgError,
  inviteUserToOrgResultType,
} from '../../objects/index'
import { inviteUserToOrgUnion } from '../invite-user-to-org-union'

describe('given the inviteUserToOrgUnion', () => {
  describe('testing the field types', () => {
    it('contains inviteUserToOrgResultType', () => {
      const demoType = inviteUserToOrgUnion.getTypes()

      expect(demoType).toContain(inviteUserToOrgResultType)
    })
    it('contains inviteUserToOrgError', () => {
      const demoType = inviteUserToOrgUnion.getTypes()

      expect(demoType).toContain(inviteUserToOrgError)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the inviteUserToOrgResultType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'regular',
          authResult: {},
        }

        expect(inviteUserToOrgUnion.resolveType(obj)).toMatchObject(
          inviteUserToOrgResultType,
        )
      })
    })
    describe('testing the inviteUserToOrgError', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          error: 'sign-in-error',
          code: 401,
          description: 'text',
        }

        expect(inviteUserToOrgUnion.resolveType(obj)).toMatchObject(
          inviteUserToOrgError,
        )
      })
    })
  })
})
