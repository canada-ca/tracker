import {GraphQLString} from 'graphql'

import {verifyPhoneNumberResultType, userPersonalType} from '../index'

describe('given the verifyPhoneNumberResultType object', () => {
  describe('testing the field definitions', () => {
    it('has an status field', () => {
      const demoType = verifyPhoneNumberResultType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(GraphQLString)
    })
    it('has a user field', () => {
      const demoType = verifyPhoneNumberResultType.getFields()

      expect(demoType).toHaveProperty('user')
      expect(demoType.user.type).toMatchObject(userPersonalType)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the status resolver', () => {
      it('returns the resolved field', () => {
        const demoType = verifyPhoneNumberResultType.getFields()

        expect(demoType.status.resolve({status: 'status'})).toEqual('status')
      })
    })
    describe('testing the user resolver', () => {
      it('returns the resolved field', () => {
        const demoType = verifyPhoneNumberResultType.getFields()

        const user = {
          displayName: 'John Doe',
        }

        expect(demoType.user.resolve({user})).toEqual({
          displayName: 'John Doe',
        })
      })
    })
  })
})
