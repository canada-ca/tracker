import { GraphQLString } from 'graphql'

import { setPhoneNumberResultType } from '../index'

describe('given the setPhoneNumberResultType object', () => {
  describe('testing the field definitions', () => {
    it('has an status field', () => {
      const demoType = setPhoneNumberResultType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(GraphQLString)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the status resolver', () => {
      it('returns the resolved field', () => {
        const demoType = setPhoneNumberResultType.getFields()

        expect(demoType.status.resolve({ status: 'status' })).toEqual('status')
      })
    })
  })
})
