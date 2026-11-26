import { GraphQLObjectType } from 'graphql'
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

  describe('field resolvers', () => {
    it('resolves the global id from the finding id', () => {
      expect(fields.id.resolve({ id: '123' })).toEqual(toGlobalId('additionalFinding', '123'))
    })

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
