import { GraphQLInt } from 'graphql'
import { dkimResultConnection } from '../dkim-result-connection'

describe('given the dkim result connection object', () => {
  describe('testing its field definitions', () => {
    it('has a totalCount field', () => {
      const demoType = dkimResultConnection.connectionType.getFields()

      expect(demoType).toHaveProperty('totalCount')
      expect(demoType.totalCount.type).toMatchObject(GraphQLInt)
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the totalCount resolver', () => {
      it('returns the resolved value', () => {
        const demoType = dkimResultConnection.connectionType.getFields()

        expect(demoType.totalCount.resolve({ totalCount: 1 })).toEqual(1)
      })
    })
  })
})
