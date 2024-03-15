import { GraphQLNonNull } from 'graphql'

import { userOrder } from '../user-order'
import { OrderDirection, UserOrderField } from '../../../enums'

describe('given the affiliationOrder input object', () => {
  describe('testing fields', () => {
    it('has a direction field', () => {
      const demoType = userOrder.getFields()

      expect(demoType).toHaveProperty('direction')
      expect(demoType.direction.type).toMatchObject(new GraphQLNonNull(OrderDirection))
    })
    it('has a field field', () => {
      const demoType = userOrder.getFields()

      expect(demoType).toHaveProperty('field')
      expect(demoType.field.type).toMatchObject(new GraphQLNonNull(UserOrderField))
    })
  })
})
