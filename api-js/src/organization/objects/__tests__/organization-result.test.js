import { GraphQLString } from 'graphql'

import { organizationResultType } from '../organization-result'

describe('given the organizationResultType object', () => {
  describe('testing the field definitions', () => {
    it('has an status field', () => {
      const demoType = organizationResultType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(GraphQLString)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the status resolver', () => {
      it('returns the resolved field', () => {
        const demoType = organizationResultType.getFields()

        expect(demoType.status.resolve({ status: 'status' })).toEqual('status')
      })
    })
  })
})
