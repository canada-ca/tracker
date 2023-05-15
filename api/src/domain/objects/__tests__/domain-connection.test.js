import {GraphQLInt} from 'graphql'
import {domainConnection} from '../domain-connection'

describe('given the domain connection object', () => {
  describe('testing its field definitions', () => {
    it('has a totalCount field', () => {
      const demoType = domainConnection.connectionType.getFields()

      expect(demoType).toHaveProperty('totalCount')
      expect(demoType.totalCount.type).toMatchObject(GraphQLInt)
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the totalCount resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainConnection.connectionType.getFields()

        expect(demoType.totalCount.resolve({totalCount: 1})).toEqual(1)
      })
    })
  })
})
