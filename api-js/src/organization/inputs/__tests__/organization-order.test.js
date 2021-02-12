import { GraphQLNonNull } from 'graphql'

import { organizationOrder } from '../organization-order'
import { OrderDirection, OrganizationOrderField } from '../../../enums'

describe('given the organizationOrder input object', () => {
  describe('testing fields', () => {
    it('has a direction field', () => {
      const demoType = organizationOrder.getFields()

      expect(demoType).toHaveProperty('direction')
      expect(demoType.direction.type).toMatchObject(
        GraphQLNonNull(OrderDirection),
      )
    })
    it('has a field field', () => {
      const demoType = organizationOrder.getFields()

      expect(demoType).toHaveProperty('field')
      expect(demoType.field.type).toMatchObject(
        GraphQLNonNull(OrganizationOrderField),
      )
    })
  })
})
