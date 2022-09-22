import {closeAccountError, closeAccountResult} from '../../objects'
import {closeAccountUnion} from '../close-account-union'

describe('given the closeAccountUnion', () => {
  describe('testing the field types', () => {
    it('contains closeAccountResult', () => {
      const demoType = closeAccountUnion.getTypes()

      expect(demoType).toContain(closeAccountResult)
    })
    it('contains closeAccountError', () => {
      const demoType = closeAccountUnion.getTypes()

      expect(demoType).toContain(closeAccountError)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the closeAccountResult', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'regular',
          authResult: {},
        }

        expect(closeAccountUnion.resolveType(obj)).toMatchObject(
          closeAccountResult,
        )
      })
    })
    describe('testing the closeAccountError', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          error: 'sign-in-error',
          code: 401,
          description: 'text',
        }

        expect(closeAccountUnion.resolveType(obj)).toMatchObject(
          closeAccountError,
        )
      })
    })
  })
})
