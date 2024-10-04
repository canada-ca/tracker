import {GraphQLString} from 'graphql'

import {tfaSignInResult} from '../index'

describe('given the tfaSignInResult object', () => {
  describe('testing the field definitions', () => {
    it('has an authenticateToken field', () => {
      const demoType = tfaSignInResult.getFields()

      expect(demoType).toHaveProperty('authenticateToken')
      expect(demoType.authenticateToken.type).toMatchObject(GraphQLString)
    })
    it('has a sendMethod field', () => {
      const demoType = tfaSignInResult.getFields()

      expect(demoType).toHaveProperty('sendMethod')
      expect(demoType.sendMethod.type).toMatchObject(GraphQLString)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the authenticateToken resolver', () => {
      it('returns the resolved field', () => {
        const demoType = tfaSignInResult.getFields()

        expect(
          demoType.authenticateToken.resolve({authenticateToken: 'token'}),
        ).toEqual('token')
      })
    })
    describe('testing the description field', () => {
      it('returns the resolved value', () => {
        const demoType = tfaSignInResult.getFields()

        expect(
          demoType.sendMethod.resolve({sendMethod: 'sendMethod'}),
        ).toEqual('sendMethod')
      })
    })
  })
})
