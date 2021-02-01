import { GraphQLInt } from 'graphql'
import { categoryTotalsType } from '../category-totals'

describe('testing the category totals gql object', () => {
  describe('testing the field definitions', () => {
    it('has a passSpfOnly field', () => {
      const demoType = categoryTotalsType.getFields()

      expect(demoType).toHaveProperty('passSpfOnly')
      expect(demoType.passSpfOnly.type).toMatchObject(GraphQLInt)
    })
    it('has a passDkimOnly field', () => {
      const demoType = categoryTotalsType.getFields()

      expect(demoType).toHaveProperty('passDkimOnly')
      expect(demoType.passDkimOnly.type).toMatchObject(GraphQLInt)
    })
    it('has a fullPass field', () => {
      const demoType = categoryTotalsType.getFields()

      expect(demoType).toHaveProperty('fullPass')
      expect(demoType.fullPass.type).toMatchObject(GraphQLInt)
    })
    it('has a fail field', () => {
      const demoType = categoryTotalsType.getFields()

      expect(demoType).toHaveProperty('fail')
      expect(demoType.fail.type).toMatchObject(GraphQLInt)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the passSpfOnly resolver', () => {
      it('returns the resolved value', () => {
        const demoType = categoryTotalsType.getFields()

        expect(demoType.passSpfOnly.resolve({ passSpfOnly: 5 })).toEqual(5)
      })
    })
    describe('testing the passDkimOnly resolver', () => {
      it('returns the resolved value', () => {
        const demoType = categoryTotalsType.getFields()

        expect(demoType.passDkimOnly.resolve({ passDkimOnly: 5 })).toEqual(5)
      })
    })
    describe('testing the fullPass field', () => {
      it('returns the resolved value', () => {
        const demoType = categoryTotalsType.getFields()

        expect(demoType.fullPass.resolve({ pass: 5 })).toEqual(5)
      })
    })
    describe('testing the fail field', () => {
      it('returns the resolved value', () => {
        const demoType = categoryTotalsType.getFields()

        expect(demoType.fail.resolve({ fail: 5 })).toEqual(5)
      })
    })
  })
})
