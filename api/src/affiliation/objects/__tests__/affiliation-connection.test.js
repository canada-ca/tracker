import {GraphQLInt} from 'graphql'
import {affiliationConnection} from '../affiliation-connection'

describe('given the affiliation connection object', () => {
  describe('testing its field definitions', () => {
    it('has a totalCount field', () => {
      const demoType = affiliationConnection.connectionType.getFields()

      expect(demoType).toHaveProperty('totalCount')
      expect(demoType.totalCount.type).toMatchObject(GraphQLInt)
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the totalCount resolver', () => {
      it('returns the resolved value', () => {
        const demoType = affiliationConnection.connectionType.getFields()

        expect(demoType.totalCount.resolve({totalCount: 1})).toEqual(1)
      })
    })
  })
})
