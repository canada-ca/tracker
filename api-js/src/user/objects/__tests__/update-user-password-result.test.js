import { GraphQLString } from 'graphql'

import { updateUserPasswordResultType } from '../update-user-password-result'

describe('given the updateUserPasswordResultType object', () => {
  describe('testing the field definitions', () => {
    it('has an status field', () => {
      const demoType = updateUserPasswordResultType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(GraphQLString)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the status resolver', () => {
      it('returns the resolved field', () => {
        const demoType = updateUserPasswordResultType.getFields()

        expect(demoType.status.resolve({ status: 'status' })).toEqual('status')
      })
    })
  })
})
