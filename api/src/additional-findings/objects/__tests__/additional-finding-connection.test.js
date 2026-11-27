import { GraphQLInt, GraphQLObjectType } from 'graphql'

import { additionalFindingConnection } from '../additional-finding-connection'
import { additionalFinding } from '../additional-finding'

describe('given the additionalFindingConnection object', () => {
  const { connectionType, edgeType } = additionalFindingConnection

  it('is named AdditionalFindingConnection', () => {
    expect(connectionType).toBeInstanceOf(GraphQLObjectType)
    expect(connectionType.name).toBe('AdditionalFindingConnection')
  })

  it('has edges of additional findings', () => {
    expect(edgeType.getFields().node.type).toEqual(additionalFinding)
  })

  describe('totalCount field', () => {
    const { totalCount } = connectionType.getFields()

    it('is an Int', () => {
      expect(totalCount.type).toEqual(GraphQLInt)
    })

    it('resolves the total count from the loader result', () => {
      expect(totalCount.resolve({ totalCount: 42 })).toEqual(42)
    })
  })
})
