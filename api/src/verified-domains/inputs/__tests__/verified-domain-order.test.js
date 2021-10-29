import { GraphQLNonNull } from 'graphql'

import { verifiedDomainOrder } from '../verified-domain-order'
import { OrderDirection, VerifiedDomainOrderField } from '../../../enums'

describe('given the verifiedDomainOrder input object', () => {
  describe('testing fields', () => {
    it('has a direction field', () => {
      const demoType = verifiedDomainOrder.getFields()

      expect(demoType).toHaveProperty('direction')
      expect(demoType.direction.type).toMatchObject(
        GraphQLNonNull(OrderDirection),
      )
    })
    it('has a field field', () => {
      const demoType = verifiedDomainOrder.getFields()

      expect(demoType).toHaveProperty('field')
      expect(demoType.field.type).toMatchObject(
        GraphQLNonNull(VerifiedDomainOrderField),
      )
    })
  })
})
