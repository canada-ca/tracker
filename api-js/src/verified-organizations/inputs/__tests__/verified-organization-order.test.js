import { GraphQLNonNull } from 'graphql'

import { verifiedOrganizationOrder } from '../verified-organization-order'
import { OrderDirection, VerifiedOrganizationOrderField } from '../../../enums'

describe('given the verifiedOrganizationOrder input object', () => {
  describe('testing fields', () => {
    it('has a direction field', () => {
      const demoType = verifiedOrganizationOrder.getFields()

      expect(demoType).toHaveProperty('direction')
      expect(demoType.direction.type).toMatchObject(
        GraphQLNonNull(OrderDirection),
      )
    })
    it('has a field field', () => {
      const demoType = verifiedOrganizationOrder.getFields()

      expect(demoType).toHaveProperty('field')
      expect(demoType.field.type).toMatchObject(
        GraphQLNonNull(VerifiedOrganizationOrderField),
      )
    })
  })
})
