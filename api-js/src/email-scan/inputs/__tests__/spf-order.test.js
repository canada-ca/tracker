import { GraphQLNonNull } from 'graphql'

import { spfOrder } from '../spf-order'
import { OrderDirection, SpfOrderField } from '../../../enums'

describe('given the spfOrder input object', () => {
  describe('testing fields', () => {
    it('has a direction field', () => {
      const demoType = spfOrder.getFields()

      expect(demoType).toHaveProperty('direction')
      expect(demoType.direction.type).toMatchObject(
        GraphQLNonNull(OrderDirection),
      )
    })
    it('has a field field', () => {
      const demoType = spfOrder.getFields()

      expect(demoType).toHaveProperty('field')
      expect(demoType.field.type).toMatchObject(GraphQLNonNull(SpfOrderField))
    })
  })
})
