import { GraphQLNonNull } from 'graphql'

import { dmarcOrder } from '../dmarc-order'
import { OrderDirection, DmarcOrderField } from '../../../enums'

describe('given the dmarcOrder input object', () => {
  describe('testing fields', () => {
    it('has a direction field', () => {
      const demoType = dmarcOrder.getFields()

      expect(demoType).toHaveProperty('direction')
      expect(demoType.direction.type).toMatchObject(
        GraphQLNonNull(OrderDirection),
      )
    })
    it('has a field field', () => {
      const demoType = dmarcOrder.getFields()

      expect(demoType).toHaveProperty('field')
      expect(demoType.field.type).toMatchObject(GraphQLNonNull(DmarcOrderField))
    })
  })
})
