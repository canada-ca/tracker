import { GraphQLInt, GraphQLString } from 'graphql'

import { setPhoneNumberErrorType } from '../index'

describe('given the setPhoneNumberErrorType object', () => {
  describe('testing the field definitions', () => {
    it('has an code field', () => {
      const demoType = setPhoneNumberErrorType.getFields()

      expect(demoType).toHaveProperty('code')
      expect(demoType.code.type).toMatchObject(GraphQLInt)
    })
    it('has a description field', () => {
      const demoType = setPhoneNumberErrorType.getFields()

      expect(demoType).toHaveProperty('description')
      expect(demoType.description.type).toMatchObject(GraphQLString)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the code resolver', () => {
      it('returns the resolved field', () => {
        const demoType = setPhoneNumberErrorType.getFields()

        expect(demoType.code.resolve({ code: 400 })).toEqual(400)
      })
    })
    describe('testing the description field', () => {
      it('returns the resolved value', () => {
        const demoType = setPhoneNumberErrorType.getFields()

        expect(
          demoType.description.resolve({ description: 'description' }),
        ).toEqual('description')
      })
    })
  })
})
