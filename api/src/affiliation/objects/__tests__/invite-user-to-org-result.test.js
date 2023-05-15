import {GraphQLString} from 'graphql'

import {inviteUserToOrgResultType} from '../invite-user-to-org-result'

describe('given the inviteUserToOrgResultType object', () => {
  describe('testing the field definitions', () => {
    it('has an status field', () => {
      const demoType = inviteUserToOrgResultType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(GraphQLString)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the status resolver', () => {
      it('returns the resolved field', () => {
        const demoType = inviteUserToOrgResultType.getFields()

        expect(demoType.status.resolve({status: 'status'})).toEqual('status')
      })
    })
  })
})
