import {GraphQLNonNull, GraphQLID, GraphQLString, GraphQLList} from 'graphql'
import {toGlobalId} from 'graphql-relay'

import {guidanceTagType, refLinksType} from '../index'

describe('given the guidanceTag gql object', () => {
  describe('testing the field definitions', () => {
    it('has an id field', () => {
      const demoType = guidanceTagType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a tagId field', () => {
      const demoType = guidanceTagType.getFields()

      expect(demoType).toHaveProperty('tagId')
      expect(demoType.tagId.type).toMatchObject(GraphQLString)
    })
    it('has a tagName field', () => {
      const demoType = guidanceTagType.getFields()

      expect(demoType).toHaveProperty('tagName')
      expect(demoType.tagName.type).toMatchObject(GraphQLString)
    })
    it('has a guidance field', () => {
      const demoType = guidanceTagType.getFields()

      expect(demoType).toHaveProperty('guidance')
      expect(demoType.guidance.type).toMatchObject(GraphQLString)
    })
    it('has a refLinks field', () => {
      const demoType = guidanceTagType.getFields()

      expect(demoType).toHaveProperty('refLinks')
      expect(demoType.refLinks.type).toMatchObject(GraphQLList(refLinksType))
    })
    it('has a refLinksTechnical field', () => {
      const demoType = guidanceTagType.getFields()

      expect(demoType).toHaveProperty('refLinksTech')
      expect(demoType.refLinksTech.type).toMatchObject(
        GraphQLList(refLinksType),
      )
    })
  })
  describe('testing the field resolvers', () => {
    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = guidanceTagType.getFields()

        expect(demoType.id.resolve({id: '1'})).toEqual(
          toGlobalId('guidanceTag', 1),
        )
      })
    })
    describe('testing the tagId resolver', () => {
      it('returns the resolved value', () => {
        const demoType = guidanceTagType.getFields()

        expect(demoType.tagId.resolve({tagId: 'tagId'})).toEqual('tagId')
      })
    })
    describe('testing the tagName resolver', () => {
      it('returns the resolved value', () => {
        const demoType = guidanceTagType.getFields()

        expect(demoType.tagName.resolve({tagName: 'tagName'})).toEqual(
          'tagName',
        )
      })
    })
    describe('testing the guidance resolver', () => {
      it('returns the resolved value', () => {
        const demoType = guidanceTagType.getFields()

        expect(demoType.guidance.resolve({guidance: 'guidance'})).toEqual(
          'guidance',
        )
      })
    })
    describe('testing the refLinks resolver', () => {
      it('returns the resolved value', () => {
        const demoType = guidanceTagType.getFields()

        const refLinksGuide = [
          {
            description: 'description',
            refLink: 'refLink',
          },
        ]

        expect(demoType.refLinks.resolve({refLinksGuide})).toEqual([
          {
            description: 'description',
            refLink: 'refLink',
          },
        ])
      })
    })
    describe('testing the refLinksTech resolver', () => {
      it('returns the resolved value', () => {
        const demoType = guidanceTagType.getFields()

        const refLinksTechnical = [
          {
            description: 'description',
            refLink: 'refLink',
          },
        ]

        expect(demoType.refLinksTech.resolve({refLinksTechnical})).toEqual([
          {
            description: 'description',
            refLink: 'refLink',
          },
        ])
      })
    })
  })
})
