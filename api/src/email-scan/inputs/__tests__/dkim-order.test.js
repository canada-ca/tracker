import { GraphQLNonNull } from 'graphql'

import { dkimOrder } from '../dkim-order'
import { OrderDirection, DkimOrderField } from '../../../enums'

describe('given the dkimOrder input object', () => {
  describe('testing fields', () => {
    it('has a direction field', () => {
      const demoType = dkimOrder.getFields()

      expect(demoType).toHaveProperty('direction')
      expect(demoType.direction.type).toMatchObject(
        GraphQLNonNull(OrderDirection),
      )
    })
    it('has a field field', () => {
      const demoType = dkimOrder.getFields()

      expect(demoType).toHaveProperty('field')
      expect(demoType.field.type).toMatchObject(GraphQLNonNull(DkimOrderField))
    })
  })
})
