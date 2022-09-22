import {GraphQLString} from 'graphql'

import {leaveOrganizationResultType} from '../leave-organization-result'

describe('given the leaveOrganizationResultType object', () => {
  describe('testing the field definitions', () => {
    it('has an status field', () => {
      const demoType = leaveOrganizationResultType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(GraphQLString)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the status resolver', () => {
      it('returns the resolved field', () => {
        const demoType = leaveOrganizationResultType.getFields()

        expect(demoType.status.resolve({status: 'status'})).toEqual('status')
      })
    })
  })
})
