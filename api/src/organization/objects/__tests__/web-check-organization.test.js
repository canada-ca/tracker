import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLBoolean,
} from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { Acronym, Slug } from '../../../scalars'
import { webCheckType, tagType } from '../../objects'

describe('given the web-check-organization object', () => {
  describe('testing the field definitions', () => {
    it('has an id field', () => {
      const demoType = webCheckType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has an acronym field', () => {
      const demoType = webCheckType.getFields()

      expect(demoType).toHaveProperty('acronym')
      expect(demoType.acronym.type).toMatchObject(Acronym)
    })
    it('has a name field', () => {
      const demoType = webCheckType.getFields()

      expect(demoType).toHaveProperty('name')
      expect(demoType.name.type).toMatchObject(GraphQLString)
    })
    it('has a slug field', () => {
      const demoType = webCheckType.getFields()

      expect(demoType).toHaveProperty('slug')
      expect(demoType.slug.type).toMatchObject(Slug)
    })
    it('has a verified field', () => {
      const demoType = webCheckType.getFields()

      expect(demoType).toHaveProperty('verified')
      expect(demoType.verified.type).toMatchObject(GraphQLBoolean)
    })
    it('has a domains field', () => {
      const demoType = webCheckType.getFields()

      expect(demoType).toHaveProperty('domains')
      expect(demoType.domains.type).toMatchObject({
        name: 'WebCheckDomainConnection',
      })
    })
    it('has a tags field', () => {
      const demoType = webCheckType.getFields()

      expect(demoType).toHaveProperty('tags')
      expect(demoType.tags.type).toMatchObject(tagType)
    })
  })
  describe('testing the field resolvers', () => {
    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = webCheckType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(
          toGlobalId('organization', 1),
        )
      })
    })
    describe('testing the acronym resolver', () => {
      it('returns the resolved value', () => {
        const demoType = webCheckType.getFields()

        expect(demoType.acronym.resolve({ acronym: 'GOC' })).toEqual('GOC')
      })
    })
    describe('testing the name resolver', () => {
      it('returns the resolved value', () => {
        const demoType = webCheckType.getFields()

        expect(demoType.name.resolve({ name: 'Name' })).toEqual('Name')
      })
    })
    describe('testing the slug resolver', () => {
      it('returns the resolved value', () => {
        const demoType = webCheckType.getFields()

        expect(demoType.slug.resolve({ slug: 'organization-name' })).toEqual(
          'organization-name',
        )
      })
    })
    describe('testing the verified resolver', () => {
      it('returns the resolved value', () => {
        const demoType = webCheckType.getFields()

        expect(demoType.verified.resolve({ verified: true })).toEqual(true)
      })
    })
    describe('testing the domains resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = webCheckType.getFields()

        const domainType = demoType.domains.type.getFields()

        await expect(domainType.totalCount.resolve({ totalCount: 1 })).toEqual(
          1,
        )
      })
    })
    describe('testing the tags resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = webCheckType.getFields()

        const expectedResults = {
          edges: [
            {
              id: 'tag-id',
              firstDetected: 'datetime',
              severyity: 'high',
            },
          ],
          totalCount: 1,
        }

        await expect(
          demoType.tags.resolve(
            { _id: 'organizations/1' },
            {}, // empty args object
            {
              loaders: {
                loadDomainTagsByOrgId: jest
                  .fn()
                  .mockReturnValue(expectedResults),
              },
            },
          ),
        ).resolves.toEqual(expectedResults)
      })
    })
  })
})
