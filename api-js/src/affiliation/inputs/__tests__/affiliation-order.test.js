import { GraphQLNonNull } from 'graphql'

import { affiliationOrder } from '../affiliation-order'
import { OrderDirection, AffiliationOrderField } from '../../../enums'

describe('given the affiliationOrder input object', () => {
  describe('testing fields', () => {
    it('has a direction field', () => {
      const demoType = affiliationOrder.getFields()

      expect(demoType).toHaveProperty('direction')
      expect(demoType.direction.type).toMatchObject(
        GraphQLNonNull(OrderDirection),
      )
    })
    it('has a field field', () => {
      const demoType = affiliationOrder.getFields()

      expect(demoType).toHaveProperty('field')
      expect(demoType.field.type).toMatchObject(
        GraphQLNonNull(AffiliationOrderField),
      )
    })
  })
})
