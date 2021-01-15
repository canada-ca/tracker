import { GraphQLString, GraphQLInt, GraphQLFloat } from 'graphql'
import { summaryCategoryType } from '../summary-category'

describe('given the summary category gql object', () => {
  describe('testing its field definitions', () => {
    it('has a name field', () => {
      const demoType = summaryCategoryType.getFields()

      expect(demoType).toHaveProperty('name')
      expect(demoType.name.type).toMatchObject(GraphQLString)
    })
    it('has a count field', () => {
      const demoType = summaryCategoryType.getFields()

      expect(demoType).toHaveProperty('count')
      expect(demoType.count.type).toMatchObject(GraphQLInt)
    })
    it('has a percentage field', () => {
      const demoType = summaryCategoryType.getFields()

      expect(demoType).toHaveProperty('percentage')
      expect(demoType.percentage.type).toMatchObject(GraphQLFloat)
    })
  })
  describe('testing the field resolvers', () => {
    describe('testing the name resolver', () => {
      it('returns the resolved value', () => {
        const demoType = summaryCategoryType.getFields()

        expect(demoType.name.resolve({ name: 'name' })).toEqual('name')
      })
    })
    describe('testing the count resolver', () => {
      it('returns the resolved value', () => {
        const demoType = summaryCategoryType.getFields()

        expect(demoType.count.resolve({ count: 5 })).toEqual(5)
      })
    })
    describe('testing the percentage resolver', () => {
      it('returns the resolved value', () => {
        const demoType = summaryCategoryType.getFields()

        expect(demoType.percentage.resolve({ percentage: 5.5 })).toEqual(5.5)
      })
    })
  })
})
