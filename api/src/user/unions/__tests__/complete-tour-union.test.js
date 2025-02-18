import { completeTourResult, completeTourError } from '../../objects/index'
import { completeTourUnion } from '../complete-tour-union'

describe('given the completeTourUnion', () => {
  describe('testing the field types', () => {
    it('contains completeTourResult', () => {
      const demoType = completeTourUnion.getTypes()

      expect(demoType).toContain(completeTourResult)
    })
    it('contains completeTourError', () => {
      const demoType = completeTourUnion.getTypes()

      expect(demoType).toContain(completeTourError)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the completeTourResult', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'success',
          status: '',
          user: {},
        }

        expect(completeTourUnion.resolveType(obj)).toMatch(completeTourResult.name)
      })
    })
    describe('testing the completeTourError', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          code: 400,
          description: '',
        }

        expect(completeTourUnion.resolveType(obj)).toMatch(completeTourError.name)
      })
    })
  })
})
