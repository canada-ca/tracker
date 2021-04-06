import {
  removePhoneNumberErrorType,
  removePhoneNumberResultType,
} from '../../objects/index'
import { removePhoneNumberUnion } from '../remove-phone-number-union'

describe('given the removePhoneNumberUnion', () => {
  describe('testing the field types', () => {
    it('contains removePhoneNumberResultType', () => {
      const demoType = removePhoneNumberUnion.getTypes()

      expect(demoType).toContain(removePhoneNumberResultType)
    })
    it('contains removePhoneNumberErrorType', () => {
      const demoType = removePhoneNumberUnion.getTypes()

      expect(demoType).toContain(removePhoneNumberErrorType)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the removePhoneNumberResultType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'result',
          authResult: {},
        }

        expect(removePhoneNumberUnion.resolveType(obj)).toMatchObject(
          removePhoneNumberResultType,
        )
      })
    })
    describe('testing the removePhoneNumberErrorType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          error: 'sign-in-error',
          code: 401,
          description: 'text',
        }

        expect(removePhoneNumberUnion.resolveType(obj)).toMatchObject(
          removePhoneNumberErrorType,
        )
      })
    })
  })
})
