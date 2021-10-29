import { GraphQLString } from 'graphql'

import { organizationResultType } from '../organization-result'
import { organizationType } from '../organization'

describe('given the organizationResultType object', () => {
  describe('testing the field definitions', () => {
    it('has an status field', () => {
      const demoType = organizationResultType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(GraphQLString)
    })
    it('has an organization field', () => {
      const demoType = organizationResultType.getFields()

      expect(demoType).toHaveProperty('organization')
      expect(demoType.organization.type).toMatchObject(organizationType)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the status resolver', () => {
      it('returns the resolved field', () => {
        const demoType = organizationResultType.getFields()

        expect(demoType.status.resolve({ status: 'status' })).toEqual('status')
      })
    })
    describe('testing the organization resolver', () => {
      it('returns the resolved field', () => {
        const demoType = organizationResultType.getFields()

        expect(
          demoType.organization.resolve({
            organization: { id: 1, name: 'org name' },
          }),
        ).toEqual({ id: 1, name: 'org name' })
      })
    })
  })
})
