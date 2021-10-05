import {
  affiliationError,
  transferOrgOwnershipResult,
} from '../../objects/index'
import { transferOrgOwnershipUnion } from '../transfer-org-ownership-union'

describe('given the transferOrgOwnershipUnion', () => {
  describe('testing the field types', () => {
    it('contains inviteUserToOrgResultType', () => {
      const demoType = transferOrgOwnershipUnion.getTypes()

      expect(demoType).toContain(transferOrgOwnershipResult)
    })
    it('contains affiliationError', () => {
      const demoType = transferOrgOwnershipUnion.getTypes()

      expect(demoType).toContain(affiliationError)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the transferOrgOwnershipResult', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'regular',
          authResult: {},
        }

        expect(transferOrgOwnershipUnion.resolveType(obj)).toMatchObject(
          transferOrgOwnershipResult,
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

        expect(transferOrgOwnershipUnion.resolveType(obj)).toMatchObject(
          affiliationError,
        )
      })
    })
  })
})
