import { GraphQLInt, GraphQLObjectType, GraphQLString } from 'graphql'
import { GraphQLJSONObject } from 'graphql-scalars'

import { additionalFinding } from '../additional-finding'
import { domainType } from '../../../domain/objects'

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
      expect(fields).toHaveProperty('occurrenceCount')
      expect(fields).toHaveProperty('raw')
      expect(fields).toHaveProperty('status')
    })

    it('assigns the domain field type correctly', () => {
      expect(fields.domain.type).toMatchObject(domainType)
    })

    it('assigns scalar field types correctly', () => {
      expect(fields.source.type).toBe(GraphQLString)
      expect(fields.findingType.type).toBe(GraphQLString)
      expect(fields.subject.type).toBe(GraphQLString)
      expect(fields.confidence.type).toBe(GraphQLString)
      expect(fields.severity.type).toBe(GraphQLString)
      expect(fields.reasonCode.type).toBe(GraphQLString)
      expect(fields.firstSeen.type).toBe(GraphQLString)
      expect(fields.lastSeen.type).toBe(GraphQLString)
      expect(fields.occurrenceCount.type).toBe(GraphQLInt)
      expect(fields.status.type).toBe(GraphQLString)
    })

    it('assigns json object fields correctly', () => {
      expect(fields.evidence.type).toBe(GraphQLJSONObject)
      expect(fields.attributes.type).toBe(GraphQLJSONObject)
      expect(fields.raw.type).toBe(GraphQLJSONObject)
    })

    describe('testing the domain resolver', () => {
      it('returns the resolved field', async () => {
        const domain = {
          _id: 'domains/1',
          _rev: 'rev',
          _key: '1',
          id: '1',
          domain: 'test.domain.gc.ca',
        }

        await expect(
          fields.domain.resolve(
            { domainKey: domain._key },
            {},
            {
              dataSources: {
                domain: { byKey: { load: jest.fn().mockReturnValue(domain) } },
              },
            },
          ),
        ).resolves.toEqual(domain)
      })
    })
  })
})
