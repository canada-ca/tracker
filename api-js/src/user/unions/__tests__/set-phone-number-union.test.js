import {
  setPhoneNumberErrorType,
  setPhoneNumberResultType,
} from '../../objects/index'
import { setPhoneNumberUnion } from '../index'

describe('given the setPhoneNumberUnion', () => {
  describe('testing the field types', () => {
    it('contains setPhoneNumberResultType', () => {
      const demoType = setPhoneNumberUnion.getTypes()

      expect(demoType).toContain(setPhoneNumberResultType)
    })
    it('contains setPhoneNumberErrorType', () => {
      const demoType = setPhoneNumberUnion.getTypes()

      expect(demoType).toContain(setPhoneNumberErrorType)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the setPhoneNumberResultType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'regular',
          authResult: {},
        }

        expect(setPhoneNumberUnion.resolveType(obj)).toMatchObject(
          setPhoneNumberResultType,
        )
      })
    })
    describe('testing the setPhoneNumberErrorType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          error: 'sign-in-error',
          code: 401,
          description: 'text',
        }

        expect(setPhoneNumberUnion.resolveType(obj)).toMatchObject(
          setPhoneNumberErrorType,
        )
      })
    })
  })
})
