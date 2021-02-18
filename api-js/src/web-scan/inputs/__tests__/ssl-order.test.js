import { GraphQLNonNull } from 'graphql'

import { sslOrder } from '../ssl-order'
import { OrderDirection, SslOrderField } from '../../../enums'

describe('given the sslOrder input object', () => {
  describe('testing fields', () => {
    it('has a direction field', () => {
      const demoType = sslOrder.getFields()

      expect(demoType).toHaveProperty('direction')
      expect(demoType.direction.type).toMatchObject(
        GraphQLNonNull(OrderDirection),
      )
    })
    it('has a field field', () => {
      const demoType = sslOrder.getFields()

      expect(demoType).toHaveProperty('field')
      expect(demoType.field.type).toMatchObject(GraphQLNonNull(SslOrderField))
    })
  })
})
