import { GraphQLString } from 'graphql'

import { updateUserProfileResultType, userPersonalType } from '../index'

describe('given the updateUserProfileResultType object', () => {
  describe('testing the field definitions', () => {
    it('has a status field', () => {
      const demoType = updateUserProfileResultType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(GraphQLString)
    })
    it('has a user field', () => {
      const demoType = updateUserProfileResultType.getFields()

      expect(demoType).toHaveProperty('user')
      expect(demoType.user.type).toMatchObject(userPersonalType)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the status resolver', () => {
      it('returns the resolved field', () => {
        const demoType = updateUserProfileResultType.getFields()

        expect(demoType.status.resolve({ status: 'status' })).toEqual('status')
      })
    })
    describe('testing the user field', () => {
      it('returns the resolved value', () => {
        const demoType = updateUserProfileResultType.getFields()

        expect(demoType.user.resolve({ user: { id: '1' } })).toEqual({
          id: '1',
        })
      })
    })
  })
})
