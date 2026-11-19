import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLID, GraphQLNonNull } from 'graphql'
import { GraphQLDateTime, GraphQLJSONObject } from 'graphql-scalars'
import { toGlobalId } from 'graphql-relay'

import { additionalFinding } from '../additional-finding'
import { nodeInterface } from '../../../node'

describe('given the additionalFinding object', () => {
  const fields = additionalFinding.getFields()

  it('is a GraphQLObjectType named AdditionalFinding that implements the node interface', () => {
    expect(additionalFinding).toBeInstanceOf(GraphQLObjectType)
    expect(additionalFinding.name).toBe('AdditionalFinding')
    expect(additionalFinding.getInterfaces()).toContain(nodeInterface)
  })

  describe('field definitions', () => {
    it.each([
      { field: 'subject', type: GraphQLString },
      { field: 'source', type: GraphQLString },
      { field: 'findingType', type: GraphQLString },
      { field: 'confidence', type: GraphQLString },
      { field: 'reasonCode', type: GraphQLString },
      { field: 'status', type: GraphQLString },
      { field: 'firstSeen', type: GraphQLDateTime },
      { field: 'lastSeen', type: GraphQLDateTime },
      { field: 'occurrenceCount', type: GraphQLInt },
      { field: 'evidence', type: GraphQLJSONObject },
      { field: 'attributes', type: GraphQLJSONObject },
    ])('has $field of the expected type', ({ field, type }) => {
      expect(fields[field].type).toEqual(type)
    })

    it('has a non-null global id field', () => {
      expect(fields.id.type).toEqual(new GraphQLNonNull(GraphQLID))
    })

    it('exposes exactly the documented fields', () => {
      expect(Object.keys(fields).sort()).toEqual(
        [
          'attributes',
          'confidence',
          'evidence',
          'findingType',
          'firstSeen',
          'id',
          'lastSeen',
          'occurrenceCount',
          'reasonCode',
          'source',
          'status',
          'subject',
        ].sort(),
      )
    })
  })

  describe('field resolvers', () => {
    it('resolves the global id from the finding id', () => {
      expect(fields.id.resolve({ id: '123' })).toEqual(toGlobalId('additionalFinding', '123'))
    })

    it.each(['subject', 'source', 'findingType', 'confidence', 'reasonCode', 'status', 'occurrenceCount'])(
      'passes %s straight through',
      (field) => {
        const value = field === 'occurrenceCount' ? 3 : `${field}-value`
        expect(fields[field].resolve({ [field]: value })).toEqual(value)
      },
    )

    it.each([
      { field: 'firstSeen', stored: '2024-01-01T00:00:00.000Z', expected: new Date('2024-01-01T00:00:00.000Z') },
      { field: 'lastSeen', stored: '2024-03-04T05:06:07.000Z', expected: new Date('2024-03-04T05:06:07.000Z') },
      { field: 'firstSeen', stored: undefined, expected: null },
      { field: 'lastSeen', stored: null, expected: null },
    ])('resolves $field of $stored to $expected', ({ field, stored, expected }) => {
      expect(fields[field].resolve({ [field]: stored })).toEqual(expected)
    })

    it.each(['evidence', 'attributes'])('returns the stored %s object', (field) => {
      const value = { target: 'a.example.ca', nested: { count: 2 } }
      expect(fields[field].resolve({ [field]: value })).toEqual(value)
    })

    it.each([
      { field: 'evidence', stored: undefined },
      { field: 'evidence', stored: null },
      { field: 'attributes', stored: undefined },
      { field: 'attributes', stored: null },
    ])('defaults $field to an empty object when stored as $stored', ({ field, stored }) => {
      expect(fields[field].resolve({ [field]: stored })).toEqual({})
    })
  })
})
