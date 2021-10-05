import { GraphQLList, GraphQLInt } from 'graphql'
import { categorizedSummaryType, summaryCategoryType } from '../index'

describe('given the categorized summary gql object', () => {
  describe('testing the field definitions', () => {
    it('has a categories field', () => {
      const demoType = categorizedSummaryType.getFields()

      expect(demoType).toHaveProperty('categories')
      expect(demoType.categories.type).toMatchObject(
        GraphQLList(summaryCategoryType),
      )
    })
    it('has a total field', () => {
      const demoType = categorizedSummaryType.getFields()

      expect(demoType).toHaveProperty('total')
      expect(demoType.total.type).toMatchObject(GraphQLInt)
    })
  })
  describe('testing the field resolvers', () => {
    describe('testing the categories resolver', () => {
      it('returns the resolved value', () => {
        const demoType = categorizedSummaryType.getFields()

        const summary = {
          categories: [
            {
              pass: 50,
              fail: 1000,
            },
          ],
          total: 1050,
        }

        const expectedResults = [{ fail: 1000, pass: 50 }]

        expect(demoType.categories.resolve(summary)).toEqual(expectedResults)
      })
    })
    describe('testing the total resolver', () => {
      it('returns the resolved value', () => {
        const demoType = categorizedSummaryType.getFields()

        expect(demoType.total.resolve({ total: 1500 })).toEqual(1500)
      })
    })
  })
})
