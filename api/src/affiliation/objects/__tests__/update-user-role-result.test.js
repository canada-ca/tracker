import { GraphQLString } from 'graphql'

import { userSharedType } from '../../../user/objects'
import { updateUserRoleResultType } from '../update-user-role-result'

describe('given the updateUserRoleResultType object', () => {
  describe('testing the field definitions', () => {
    it('has an status field', () => {
      const demoType = updateUserRoleResultType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(GraphQLString)
    })
    it('has a user field', () => {
      const demoType = updateUserRoleResultType.getFields()

      expect(demoType).toHaveProperty('user')
      expect(demoType.user.type).toMatchObject(userSharedType)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the status resolver', () => {
      it('returns the resolved field', () => {
        const demoType = updateUserRoleResultType.getFields()

        expect(demoType.status.resolve({ status: 'status' })).toEqual('status')
      })
    })
    describe('testing the user resolver', () => {
      it('returns the resolved field', () => {
        const demoType = updateUserRoleResultType.getFields()

        const expectedResult = {
          _id: 'users/1',
          _key: '1',
          _rev: 'rev',
          _type: 'user',
          id: '1',
          displayName: 'Test Account',
          emailValidated: false,
          tfaValidated: false,
          userName: 'test.account@istio.actually.exists',
        }

        expect(demoType.user.resolve({ user: expectedResult })).toEqual(expectedResult)
      })
    })
  })
})
