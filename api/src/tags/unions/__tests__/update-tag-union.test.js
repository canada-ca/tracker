import { updateTagUnion } from '../update-tag-union'
import { tagErrorType, tagType } from '../../objects'
import { GraphQLUnionType } from 'graphql'

describe('updateTagUnion', () => {
  it('should be an instance of GraphQLUnionType', () => {
    expect(updateTagUnion).toBeInstanceOf(GraphQLUnionType)
  })

  it('should have the correct name', () => {
    expect(updateTagUnion.name).toBe('UpdateTagUnion')
  })

  it('should have the correct description', () => {
    expect(updateTagUnion.description).toBe(`This union is used with the \`UpdateTag\` mutation,
allowing for users to update a tag and add it to their org,
and support any errors that may occur`)
  })

  it('should have the correct types', () => {
    expect(updateTagUnion.getTypes()).toContain(tagErrorType)
    expect(updateTagUnion.getTypes()).toContain(tagType)
  })

  describe('resolveType', () => {
    it('should return tagType name when _type is "tag"', () => {
      const result = updateTagUnion.resolveType({ _type: 'tag' })
      expect(result).toBe(tagType.name)
    })

    it('should return tagErrorType name when _type is not "tag"', () => {
      const result = updateTagUnion.resolveType({ _type: 'error' })
      expect(result).toBe(tagErrorType.name)
    })
  })
})
