import { sendPhoneCodeErrorType, sendPhoneCodeResultType } from '../../objects/index'
import { sendPhoneCodeUnion } from '../send-phone-code-union'

describe('given the sendPhoneCodeUnion', () => {
  describe('testing the field types', () => {
    it('contains sendPhoneCodeResultType', () => {
      const demoType = sendPhoneCodeUnion.getTypes()

      expect(demoType).toContain(sendPhoneCodeResultType)
    })
    it('contains sendPhoneCodeErrorType', () => {
      const demoType = sendPhoneCodeUnion.getTypes()

      expect(demoType).toContain(sendPhoneCodeErrorType)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the sendPhoneCodeResultType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'regular',
          authResult: {},
        }

        expect(sendPhoneCodeUnion.resolveType(obj)).toMatchObject(
          sendPhoneCodeResultType,
        )
      })
    })
    describe('testing the sendPhoneCodeErrorType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          error: 'sign-in-error',
          code: 401,
          description: 'text',
        }

        expect(sendPhoneCodeUnion.resolveType(obj)).toMatchObject(
          sendPhoneCodeErrorType,
        )
      })
    })
  })
})
