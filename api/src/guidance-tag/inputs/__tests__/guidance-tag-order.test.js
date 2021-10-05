import { GraphQLNonNull } from 'graphql'

import { guidanceTagOrder } from '../guidance-tag-order'
import { OrderDirection, GuidanceTagOrderField } from '../../../enums'

describe('given the guidanceTagOrder input object', () => {
  describe('testing fields', () => {
    it('has a direction field', () => {
      const demoType = guidanceTagOrder.getFields()

      expect(demoType).toHaveProperty('direction')
      expect(demoType.direction.type).toMatchObject(
        GraphQLNonNull(OrderDirection),
      )
    })
    it('has a field field', () => {
      const demoType = guidanceTagOrder.getFields()

      expect(demoType).toHaveProperty('field')
      expect(demoType.field.type).toMatchObject(
        GraphQLNonNull(GuidanceTagOrderField),
      )
    })
  })
})
