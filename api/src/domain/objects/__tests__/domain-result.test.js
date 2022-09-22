import {GraphQLString} from 'graphql'

import {domainResultType} from '../domain-result'
import {domainType} from '../domain'

describe('given the domainResultType object', () => {
  describe('testing the field definitions', () => {
    it('has an status field', () => {
      const demoType = domainResultType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(GraphQLString)
    })
    it('has a domain type', () => {
      const demoType = domainResultType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(domainType)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the status resolver', () => {
      it('returns the resolved field', () => {
        const demoType = domainResultType.getFields()

        expect(demoType.status.resolve({status: 'status'})).toEqual('status')
      })
    })
    describe('testing the domain resolver', () => {
      const demoType = domainResultType.getFields()

      expect(
        demoType.domain.resolve({domain: {id: 1, domain: 'test.gc.ca'}}),
      ).toEqual({id: 1, domain: 'test.gc.ca'})
    })
  })
})
