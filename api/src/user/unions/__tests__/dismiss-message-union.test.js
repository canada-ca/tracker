import { dismissMessageResult, dismissMessageError } from '../../objects/index'
import { dismissMessageUnion } from '../dismiss-message-union'

describe('given the dismissMessageUnion', () => {
  describe('testing the field types', () => {
    it('contains dismissMessageResult', () => {
      const demoType = dismissMessageUnion.getTypes()

      expect(demoType).toContain(dismissMessageResult)
    })
    it('contains dismissMessageError', () => {
      const demoType = dismissMessageUnion.getTypes()

      expect(demoType).toContain(dismissMessageError)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the dismissMessageResult', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'success',
          status: '',
          user: {},
        }

        expect(dismissMessageUnion.resolveType(obj)).toMatch(dismissMessageResult.name)
      })
    })
    describe('testing the dismissMessageError', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          code: 400,
          description: '',
        }

        expect(dismissMessageUnion.resolveType(obj)).toMatch(dismissMessageError.name)
      })
    })
  })
})
