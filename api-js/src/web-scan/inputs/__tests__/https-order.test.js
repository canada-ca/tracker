import { GraphQLNonNull } from 'graphql'

import { httpsOrder } from '../https-order'
import { OrderDirection, HttpsOrderField } from '../../../enums'

describe('given the httpsOrder input object', () => {
  describe('testing fields', () => {
    it('has a direction field', () => {
      const demoType = httpsOrder.getFields()

      expect(demoType).toHaveProperty('direction')
      expect(demoType.direction.type).toMatchObject(
        GraphQLNonNull(OrderDirection),
      )
    })
    it('has a field field', () => {
      const demoType = httpsOrder.getFields()

      expect(demoType).toHaveProperty('field')
      expect(demoType.field.type).toMatchObject(GraphQLNonNull(HttpsOrderField))
    })
  })
})
