const { GraphQLInt } = require('graphql')
const { guidanceTagConnection } = require('../index')

describe('given the guidance Tag Connection connection object', () => {
  describe('testing its field definitions', () => {
    it('has a totalCount field', () => {
      const demoType = guidanceTagConnection.connectionType.getFields()

      expect(demoType).toHaveProperty('totalCount')
      expect(demoType.totalCount.type).toMatchObject(GraphQLInt)
    })
  })
  describe('testing its field resolvers', () => {
    describe('testing the totalCount resolver', () => {
      it('returns the resolved value', () => {
        const demoType = guidanceTagConnection.connectionType.getFields()

        expect(demoType.totalCount.resolve({ totalCount: 1 })).toEqual(1)
      })
    })
  })
})
