import {GraphQLString} from 'graphql'

import {removeUserFromOrgResultType} from '../remove-user-from-org-result'
import {userSharedType} from '../../../user/objects'

describe('given the removeUserFromOrgResultType object', () => {
  describe('testing the field definitions', () => {
    it('has an status field', () => {
      const demoType = removeUserFromOrgResultType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(GraphQLString)
    })
    it('has a user field', () => {
      const demoType = removeUserFromOrgResultType.getFields()

      expect(demoType).toHaveProperty('user')
      expect(demoType.user.type).toMatchObject(userSharedType)
    })
  })
  describe('testing the field resolvers', () => {
    describe('testing the status resolver', () => {
      it('returns the resolved field', () => {
        const demoType = removeUserFromOrgResultType.getFields()

        expect(demoType.status.resolve({status: 'status'})).toEqual('status')
      })
    })
    describe('testing the user resolver', () => {
      it('returns the resolved field', () => {
        const demoType = removeUserFromOrgResultType.getFields()

        expect(
          demoType.user.resolve({user: {id: 1, userName: 'test@email.ca'}}),
        ).toEqual({id: 1, userName: 'test@email.ca'})
      })
    })
  })
})
