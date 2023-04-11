import {authResultType, authenticateError} from '../../objects/index'
import {authenticateUnion} from '../authenticate-union'

describe('given the authenticateUnion', () => {
  describe('testing the field types', () => {
    it('contains authResultType type', () => {
      const demoType = authenticateUnion.getTypes()

      expect(demoType).toContain(authResultType)
    })
    it('contains authenticateError type', () => {
      const demoType = authenticateUnion.getTypes()

      expect(demoType).toContain(authenticateError)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the authResultType type', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'authResult',
          authResult: {},
        }

        expect(authenticateUnion.resolveType(obj)).toMatchObject(authResultType)
      })
    })
    describe('testing the authenticateError type', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          code: 401,
          description: 'text',
        }

        expect(authenticateUnion.resolveType(obj)).toMatchObject(
          authenticateError,
        )
      })
    })
  })
})
