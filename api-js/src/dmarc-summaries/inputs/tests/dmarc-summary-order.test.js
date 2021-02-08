import { GraphQLNonNull } from 'graphql'

import { dmarcSummaryOrder } from '../dmarc-summary-order'
import { OrderDirection, DmarcSummaryOrderField } from '../../../enums'

describe('given the dmarcSummaryOrder input object', () => {
  describe('testing fields', () => {
    it('has a direction field', () => {
      const demoType = dmarcSummaryOrder.getFields()

      expect(demoType).toHaveProperty('direction')
      expect(demoType.direction.type).toMatchObject(
        GraphQLNonNull(OrderDirection),
      )
    })
    it('has a field field', () => {
      const demoType = dmarcSummaryOrder.getFields()

      expect(demoType).toHaveProperty('field')
      expect(demoType.field.type).toMatchObject(
        GraphQLNonNull(DmarcSummaryOrderField),
      )
    })
  })
})
