import { GraphQLNonNull } from 'graphql'

import { affiliationUserOrder } from '../affiliation-user-order'
import { OrderDirection, AffiliationUserOrderField } from '../../../enums'

describe('given the affiliationOrder input object', () => {
  describe('testing fields', () => {
    it('has a direction field', () => {
      const demoType = affiliationUserOrder.getFields()

      expect(demoType).toHaveProperty('direction')
      expect(demoType.direction.type).toMatchObject(
        GraphQLNonNull(OrderDirection),
      )
    })
    it('has a field field', () => {
      const demoType = affiliationUserOrder.getFields()

      expect(demoType).toHaveProperty('field')
      expect(demoType.field.type).toMatchObject(
        GraphQLNonNull(AffiliationUserOrderField),
      )
    })
  })
})
