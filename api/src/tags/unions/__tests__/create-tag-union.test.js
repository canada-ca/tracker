import { createTagUnion } from '../create-tag-union'
import { tagErrorType, tagType } from '../../objects'
import { GraphQLUnionType } from 'graphql'

describe('createTagUnion', () => {
  it('should be an instance of GraphQLUnionType', () => {
    expect(createTagUnion).toBeInstanceOf(GraphQLUnionType)
  })

  it('should have the correct name', () => {
    expect(createTagUnion.name).toBe('CreateTagUnion')
  })

  it('should have the correct description', () => {
    expect(createTagUnion.description).toBe(`This union is used with the \`CreateTag\` mutation,
allowing for users to create a tag and add it to their org,
and support any errors that may occur`)
  })

  it('should have the correct types', () => {
    expect(createTagUnion.getTypes()).toContain(tagErrorType)
    expect(createTagUnion.getTypes()).toContain(tagType)
  })

  describe('resolveType', () => {
    it('should return tagType name when _type is "tag"', () => {
      const result = createTagUnion.resolveType({ _type: 'tag' })
      expect(result).toBe(tagType.name)
    })

    it('should return tagErrorType name when _type is not "tag"', () => {
      const result = createTagUnion.resolveType({ _type: 'error' })
      expect(result).toBe(tagErrorType.name)
    })
  })
})
