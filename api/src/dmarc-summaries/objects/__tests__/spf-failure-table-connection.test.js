import { GraphQLInt } from 'graphql'
import { spfFailureConnection } from '../index'

describe('given the spfFailure connection object', () => {
  describe('testing its field definitions', () => {
    it('has a totalCount field', () => {
      const demoType = spfFailureConnection.connectionType.getFields()

      expect(demoType).toHaveProperty('totalCount')
      expect(demoType.totalCount.type).toMatchObject(GraphQLInt)
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the totalCount resolver', () => {
      it('returns the resolved value', () => {
        const demoType = spfFailureConnection.connectionType.getFields()

        expect(demoType.totalCount.resolve({ totalCount: 1 })).toEqual(1)
      })
    })
  })
})
