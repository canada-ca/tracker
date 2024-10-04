import {GraphQLString} from 'graphql'

import {transferOrgOwnershipResult} from '../transfer-org-ownership-result'

describe('given the transferOrgOwnershipResult object', () => {
  describe('testing the field definitions', () => {
    it('has an status field', () => {
      const demoType = transferOrgOwnershipResult.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(GraphQLString)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the status resolver', () => {
      it('returns the resolved field', () => {
        const demoType = transferOrgOwnershipResult.getFields()

        expect(demoType.status.resolve({status: 'status'})).toEqual('status')
      })
    })
  })
})
