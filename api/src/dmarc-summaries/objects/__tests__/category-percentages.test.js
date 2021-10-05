import { GraphQLFloat, GraphQLInt } from 'graphql'
import { categoryPercentagesType } from '../category-percentages'

describe('given the category percentages gql object', () => {
  describe('testing its field definitions', () => {
    it('has a failPercentage field', () => {
      const demoType = categoryPercentagesType.getFields()

      expect(demoType).toHaveProperty('failPercentage')
      expect(demoType.failPercentage.type).toMatchObject(GraphQLFloat)
    })
    it('has a fullPassPercentage field', () => {
      const demoType = categoryPercentagesType.getFields()

      expect(demoType).toHaveProperty('fullPassPercentage')
      expect(demoType.fullPassPercentage.type).toMatchObject(GraphQLFloat)
    })
    it('has a passDkimOnlyPercentage field', () => {
      const demoType = categoryPercentagesType.getFields()

      expect(demoType).toHaveProperty('passDkimOnlyPercentage')
      expect(demoType.passDkimOnlyPercentage.type).toMatchObject(GraphQLFloat)
    })
    it('has a passSpfOnlyPercentage field', () => {
      const demoType = categoryPercentagesType.getFields()

      expect(demoType).toHaveProperty('passSpfOnlyPercentage')
      expect(demoType.passSpfOnlyPercentage.type).toMatchObject(GraphQLFloat)
    })
    it('has a totalMessages field', () => {
      const demoType = categoryPercentagesType.getFields()

      expect(demoType).toHaveProperty('totalMessages')
      expect(demoType.totalMessages.type).toMatchObject(GraphQLInt)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the failPercentage resolver', () => {
      describe('fail value is above 0', () => {
        it('returns the resolved value', () => {
          const demoType = categoryPercentagesType.getFields()

          const data = {
            fail: 5,
            pass: 5,
            passDkimOnly: 5,
            passSpfOnly: 5,
          }

          expect(demoType.failPercentage.resolve(data)).toEqual(5)
        })
      })
      describe('fail is below or equal to zero', () => {
        it('returns the resolved value', () => {
          const demoType = categoryPercentagesType.getFields()

          const data = {
            fail: 0,
            pass: 5,
            passDkimOnly: 5,
            passSpfOnly: 5,
          }

          expect(demoType.failPercentage.resolve(data)).toEqual(0)
        })
      })
    })
    describe('testing the fullPassPercentage field', () => {
      describe('fail value is above 0', () => {
        it('returns the resolved value', () => {
          const demoType = categoryPercentagesType.getFields()

          const data = {
            fail: 5,
            pass: 5,
            passDkimOnly: 5,
            passSpfOnly: 5,
          }

          expect(demoType.fullPassPercentage.resolve(data)).toEqual(5)
        })
      })
      describe('fail is below or equal to zero', () => {
        it('returns the resolved value', () => {
          const demoType = categoryPercentagesType.getFields()

          const data = {
            fail: 0,
            pass: 0,
            passDkimOnly: 5,
            passSpfOnly: 5,
          }

          expect(demoType.fullPassPercentage.resolve(data)).toEqual(0)
        })
      })
    })
    describe('testing the passDkimOnlyPercentage field', () => {
      describe('fail value is above 0', () => {
        it('returns the resolved value', () => {
          const demoType = categoryPercentagesType.getFields()

          const data = {
            fail: 5,
            pass: 5,
            passDkimOnly: 5,
            passSpfOnly: 5,
          }

          expect(demoType.passDkimOnlyPercentage.resolve(data)).toEqual(5)
        })
      })
      describe('fail is below or equal to zero', () => {
        it('returns the resolved value', () => {
          const demoType = categoryPercentagesType.getFields()

          const data = {
            fail: 0,
            pass: 5,
            passDkimOnly: 0,
            passSpfOnly: 5,
          }

          expect(demoType.passDkimOnlyPercentage.resolve(data)).toEqual(0)
        })
      })
    })
    describe('testing the passSpfOnlyPercentage field', () => {
      describe('passSpfOnly value is above 0', () => {
        it('returns the resolved value', () => {
          const demoType = categoryPercentagesType.getFields()

          const data = {
            fail: 5,
            pass: 5,
            passDkimOnly: 5,
            passSpfOnly: 5,
          }

          expect(demoType.passSpfOnlyPercentage.resolve(data)).toEqual(5)
        })
      })
      describe('passSpfOnly is below or equal to zero', () => {
        it('returns the resolved value', () => {
          const demoType = categoryPercentagesType.getFields()

          const data = {
            fail: 5,
            pass: 5,
            passDkimOnly: 5,
            passSpfOnly: 0,
          }

          expect(demoType.passSpfOnlyPercentage.resolve(data)).toEqual(0)
        })
      })
    })
    describe('testing the totalMessages field', () => {
      it('returns the resolved value', () => {
        const demoType = categoryPercentagesType.getFields()

        const data = {
          totalMessages: 20,
        }

        expect(demoType.totalMessages.resolve(data)).toEqual(20)
      })
    })
  })
})
