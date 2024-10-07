import { GraphQLString } from 'graphql'

import { authResultType, userPersonalType } from '../index'

describe('given the auth result gql object', () => {
  describe('testing field definitions', () => {
    it('has an authToken field', () => {
      const demoType = authResultType.getFields()

      expect(demoType).toHaveProperty('authToken')
      expect(demoType.authToken.type).toMatchObject(GraphQLString)
    })
    it('has a user field', () => {
      const demoType = authResultType.getFields()

      expect(demoType).toHaveProperty('user')
      expect(demoType.user.type).toMatchObject(userPersonalType)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the authToken resolver', () => {
      it('returns the resolved field', () => {
        const demoType = authResultType.getFields()

        expect(demoType.authToken.resolve({ token: 'authToken' })).toEqual('authToken')
      })
    })
    describe('testing the user field', () => {
      it('returns the resolved field', () => {
        const demoType = authResultType.getFields()

        const user = {
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          tfaValidated: false,
          emailValidated: false,
        }

        const expectedResult = {
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          tfaValidated: false,
          emailValidated: false,
        }

        expect(demoType.user.resolve({ user })).toEqual(expectedResult)
      })
    })
  })
})
