import { GraphQLString } from 'graphql'

import { removeUserFromOrgResultType } from '../remove-user-from-org-result'

describe('given the removeUserFromOrgResultType object', () => {
  describe('testing the field definitions', () => {
    it('has an status field', () => {
      const demoType = removeUserFromOrgResultType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(GraphQLString)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the status resolver', () => {
      it('returns the resolved field', () => {
        const demoType = removeUserFromOrgResultType.getFields()

        expect(demoType.status.resolve({ status: 'status' })).toEqual('status')
      })
    })
  })
})
