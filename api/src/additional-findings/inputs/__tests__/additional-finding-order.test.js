import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'

import { additionalFindingOrder } from '../additional-finding-order'
import { AdditionalFindingOrderField, OrderDirection } from '../../../enums'

describe('given the additionalFindingOrder input object', () => {
  const fields = additionalFindingOrder.getFields()

  it('is a GraphQLInputObjectType named AdditionalFindingOrder', () => {
    expect(additionalFindingOrder).toBeInstanceOf(GraphQLInputObjectType)
    expect(additionalFindingOrder.name).toBe('AdditionalFindingOrder')
  })

  it('requires a field of AdditionalFindingOrderField', () => {
    expect(fields.field.type).toEqual(new GraphQLNonNull(AdditionalFindingOrderField))
  })

  it('requires a direction of OrderDirection', () => {
    expect(fields.direction.type).toEqual(new GraphQLNonNull(OrderDirection))
  })
})

describe('given the AdditionalFindingOrderField enum', () => {
  it('offers only LAST_SEEN, FIRST_SEEN and CONFIDENCE mapped to their finding properties', () => {
    const values = Object.fromEntries(AdditionalFindingOrderField.getValues().map(({ name, value }) => [name, value]))

    expect(values).toEqual({ LAST_SEEN: 'lastSeen', FIRST_SEEN: 'firstSeen', CONFIDENCE: 'confidence' })
  })
})
