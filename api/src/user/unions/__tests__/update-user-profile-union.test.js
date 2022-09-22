import {
  updateUserProfileResultType,
  updateUserProfileErrorType,
} from '../../objects/index'
import {updateUserProfileUnion} from '../update-user-profile-union'

describe('given the updateUserProfileUnion', () => {
  describe('testing the field types', () => {
    it('contains updateUserProfileResultType', () => {
      const demoType = updateUserProfileUnion.getTypes()

      expect(demoType).toContain(updateUserProfileResultType)
    })
    it('contains updateUserProfileErrorType', () => {
      const demoType = updateUserProfileUnion.getTypes()

      expect(demoType).toContain(updateUserProfileErrorType)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the updateUserProfileResultType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'success',
          authResult: {},
        }

        expect(updateUserProfileUnion.resolveType(obj)).toMatchObject(
          updateUserProfileResultType,
        )
      })
    })
    describe('testing the updateUserProfileErrorType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          code: 401,
          description: 'text',
        }

        expect(updateUserProfileUnion.resolveType(obj)).toMatchObject(
          updateUserProfileErrorType,
        )
      })
    })
  })
})
