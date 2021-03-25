import { domainErrorType, domainType } from '../../objects/index'
import { updateDomainUnion } from '../update-domain-union'

describe('given the updateDomainUnion', () => {
  describe('testing the field types', () => {
    it('contains domainType', () => {
      const demoType = updateDomainUnion.getTypes()

      expect(demoType).toContain(domainType)
    })
    it('contains domainErrorType', () => {
      const demoType = updateDomainUnion.getTypes()

      expect(demoType).toContain(domainErrorType)
    })
  })
  describe('testing the field selection', () => {
    describe('testing the domainType', () => {
      it('returns the correct type', () => {
        const obj = {
          _type: 'domain',
          domain: {},
        }

        expect(updateDomainUnion.resolveType(obj)).toMatchObject(domainType)
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

        expect(updateDomainUnion.resolveType(obj)).toMatchObject(
          domainErrorType,
        )
      })
    })
  })
})
