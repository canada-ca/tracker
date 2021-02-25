import { GraphQLNonNull } from 'graphql'

import { affiliationOrgOrder } from '../affiliation-org-order'
import { OrderDirection, AffiliationOrgOrderField } from '../../../enums'

describe('given the affiliationOrder input object', () => {
  describe('testing fields', () => {
    it('has a direction field', () => {
      const demoType = affiliationOrgOrder.getFields()

      expect(demoType).toHaveProperty('direction')
      expect(demoType.direction.type).toMatchObject(
        GraphQLNonNull(OrderDirection),
      )
    })
    it('has a field field', () => {
      const demoType = affiliationOrgOrder.getFields()

      expect(demoType).toHaveProperty('field')
      expect(demoType.field.type).toMatchObject(
        GraphQLNonNull(AffiliationOrgOrderField),
      )
    })
  })
})
