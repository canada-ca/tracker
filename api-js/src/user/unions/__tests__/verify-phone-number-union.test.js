import {
  verifyPhoneNumberErrorType,
  verifyPhoneNumberResultType,
} from '../../objects/index'
import { verifyPhoneNumberUnion } from '../index'

describe('given the verifyPhoneNumberUnion', () => {
  describe('testing the field types', () => {
    it('contains verifyPhoneNumberResultType', () => {
      const demoType = verifyPhoneNumberUnion.getTypes()

      expect(demoType).toContain(verifyPhoneNumberResultType)
    })
    it('contains verifyPhoneNumberErrorType', () => {
      const demoType = verifyPhoneNumberUnion.getTypes()

      expect(demoType).toContain(verifyPhoneNumberErrorType)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the verifyPhoneNumberResultType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'success',
          authResult: {},
        }

        expect(verifyPhoneNumberUnion.resolveType(obj)).toMatchObject(
          verifyPhoneNumberResultType,
        )
      })
    })
    describe('testing the verifyPhoneNumberErrorType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          code: 401,
          description: 'text',
        }

        expect(verifyPhoneNumberUnion.resolveType(obj)).toMatchObject(
          verifyPhoneNumberErrorType,
        )
      })
    })
  })
})
