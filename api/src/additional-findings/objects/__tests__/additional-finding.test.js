import { GraphQLInt, GraphQLObjectType, GraphQLString } from 'graphql'
import { GraphQLJSONObject } from 'graphql-scalars'

import { additionalFinding } from '../additional-finding'

describe('additionalFinding GraphQLObjectType', () => {
  it('is an instance of GraphQLObjectType', () => {
    expect(additionalFinding).toBeInstanceOf(GraphQLObjectType)
  })

  it('has the correct name and description', () => {
    expect(additionalFinding.name).toBe('AdditionalFinding')
    expect(additionalFinding.description).toBe('Out-of-policy security finding emitted by additional scanners.')
  })

  describe('fields', () => {
    const fields = additionalFinding.getFields()

    it('includes all expected fields', () => {
      expect(fields).toHaveProperty('domain')
      expect(fields).toHaveProperty('source')
      expect(fields).toHaveProperty('findingType')
      expect(fields).toHaveProperty('subject')
      expect(fields).toHaveProperty('confidence')
      expect(fields).toHaveProperty('severity')
      expect(fields).toHaveProperty('reasonCode')
      expect(fields).toHaveProperty('firstSeen')
      expect(fields).toHaveProperty('lastSeen')
      expect(fields).toHaveProperty('evidence')
      expect(fields).toHaveProperty('attributes')
      expect(fields).toHaveProperty('occurenceCount')
      expect(fields).toHaveProperty('raw')
      expect(fields).toHaveProperty('status')
    })

    it('assigns scalar field types correctly', () => {
      expect(fields.domain.type).toBe(GraphQLString)
      expect(fields.source.type).toBe(GraphQLString)
      expect(fields.findingType.type).toBe(GraphQLString)
      expect(fields.subject.type).toBe(GraphQLString)
      expect(fields.confidence.type).toBe(GraphQLString)
      expect(fields.severity.type).toBe(GraphQLString)
      expect(fields.reasonCode.type).toBe(GraphQLString)
      expect(fields.firstSeen.type).toBe(GraphQLString)
      expect(fields.lastSeen.type).toBe(GraphQLString)
      expect(fields.occurenceCount.type).toBe(GraphQLInt)
      expect(fields.status.type).toBe(GraphQLString)
    })

    it('assigns json object fields correctly', () => {
      expect(fields.evidence.type).toBe(GraphQLJSONObject)
      expect(fields.attributes.type).toBe(GraphQLJSONObject)
      expect(fields.raw.type).toBe(GraphQLJSONObject)
    })
  })
})
