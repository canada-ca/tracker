import { GraphQLString } from 'graphql'

import { updateUserRoleResultType } from '../update-user-role-result'

describe('given the updateUserRoleResultType object', () => {
  describe('testing the field definitions', () => {
    it('has an status field', () => {
      const demoType = updateUserRoleResultType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(GraphQLString)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the status resolver', () => {
      it('returns the resolved field', () => {
        const demoType = updateUserRoleResultType.getFields()

        expect(demoType.status.resolve({ status: 'status' })).toEqual('status')
      })
    })
  })
})
