import {GraphQLString} from 'graphql'

import {removePhoneNumberResultType} from '../remove-phone-number-result'

describe('given the removePhoneNumberResultType object', () => {
  describe('testing the field definitions', () => {
    it('has an status field', () => {
      const demoType = removePhoneNumberResultType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(GraphQLString)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the status resolver', () => {
      it('returns the resolved field', () => {
        const demoType = removePhoneNumberResultType.getFields()

        expect(demoType.status.resolve({status: 'status'})).toEqual('status')
      })
    })
  })
})
