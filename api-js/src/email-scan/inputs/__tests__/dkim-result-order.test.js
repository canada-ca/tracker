import { GraphQLNonNull } from 'graphql'

import { dkimResultOrder } from '../dkim-result-order'
import { OrderDirection, DkimResultOrderField } from '../../../enums'

describe('given the dkimResultOrder input object', () => {
  describe('testing fields', () => {
    it('has a direction field', () => {
      const demoType = dkimResultOrder.getFields()

      expect(demoType).toHaveProperty('direction')
      expect(demoType.direction.type).toMatchObject(
        GraphQLNonNull(OrderDirection),
      )
    })
    it('has a field field', () => {
      const demoType = dkimResultOrder.getFields()

      expect(demoType).toHaveProperty('field')
      expect(demoType.field.type).toMatchObject(
        GraphQLNonNull(DkimResultOrderField),
      )
    })
  })
})
