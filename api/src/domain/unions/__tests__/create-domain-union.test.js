import {domainErrorType, domainType} from '../../objects/index'
import {createDomainUnion} from '../create-domain-union'

describe('given the createDomainUnion', () => {
  describe('testing the field types', () => {
    it('contains domainType', () => {
      const demoType = createDomainUnion.getTypes()

      expect(demoType).toContain(domainType)
    })
    it('contains domainErrorType', () => {
      const demoType = createDomainUnion.getTypes()

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

        expect(createDomainUnion.resolveType(obj)).toMatchObject(domainType)
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

        expect(createDomainUnion.resolveType(obj)).toMatchObject(
          domainErrorType,
        )
      })
    })
  })
})
