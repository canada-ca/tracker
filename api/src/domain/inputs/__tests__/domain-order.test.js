import {GraphQLNonNull} from 'graphql'

import {domainOrder} from '../domain-order'
import {OrderDirection, DomainOrderField} from '../../../enums'

describe('given the domainOrder input object', () => {
  describe('testing fields', () => {
    it('has a direction field', () => {
      const demoType = domainOrder.getFields()

      expect(demoType).toHaveProperty('direction')
      expect(demoType.direction.type).toMatchObject(
        GraphQLNonNull(OrderDirection),
      )
    })
    it('has a field field', () => {
      const demoType = domainOrder.getFields()

      expect(demoType).toHaveProperty('field')
      expect(demoType.field.type).toMatchObject(
        GraphQLNonNull(DomainOrderField),
      )
    })
  })
})
