import { domainErrorType, domainResultType } from '../../objects'
import { removeDomainUnion } from '../remove-domain-union'

describe('given the removeDomainUnion', () => {
  describe('testing the field types', () => {
    it('contains domainResultType', () => {
      const demoType = removeDomainUnion.getTypes()

      expect(demoType).toContain(domainResultType)
    })
    it('contains domainErrorType', () => {
      const demoType = removeDomainUnion.getTypes()

      expect(demoType).toContain(domainErrorType)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the domainResultType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'result',
          status: 'status',
        }

        expect(removeDomainUnion.resolveType(obj)).toMatchObject(
          domainResultType,
        )
      })
    })
    describe('testing the domainErrorType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'error',
          error: 'sign-in-error',
          code: 401,
          description: 'text',
        }

        expect(removeDomainUnion.resolveType(obj)).toMatchObject(
          domainErrorType,
        )
      })
    })
  })
})
