import {
  GraphQLID,
  GraphQLBoolean,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
} from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { dkimFailureTableType } from '../dkim-failure-table'
import { guidanceTagType } from '../../../guidance-tag/objects'

describe('given the dkimFailureTable gql object', () => {
  describe('testing the field definitions', () => {
    it('has an id field', () => {
      const demoType = dkimFailureTableType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a dkimAligned field', () => {
      const demoType = dkimFailureTableType.getFields()

      expect(demoType).toHaveProperty('dkimAligned')
      expect(demoType.dkimAligned.type).toMatchObject(GraphQLBoolean)
    })
    it('has a dkimDomains field', () => {
      const demoType = dkimFailureTableType.getFields()

      expect(demoType).toHaveProperty('dkimDomains')
      expect(demoType.dkimDomains.type).toMatchObject(GraphQLString)
    })
    it('has a dkimResults field', () => {
      const demoType = dkimFailureTableType.getFields()

      expect(demoType).toHaveProperty('dkimResults')
      expect(demoType.dkimResults.type).toMatchObject(GraphQLString)
    })
    it('has a dkimSelectors field', () => {
      const demoType = dkimFailureTableType.getFields()

      expect(demoType).toHaveProperty('dkimSelectors')
      expect(demoType.dkimSelectors.type).toMatchObject(GraphQLString)
    })
    it('has a dnsHost field', () => {
      const demoType = dkimFailureTableType.getFields()

      expect(demoType).toHaveProperty('dnsHost')
      expect(demoType.dnsHost.type).toMatchObject(GraphQLString)
    })
    it('has an envelopeFrom field', () => {
      const demoType = dkimFailureTableType.getFields()

      expect(demoType).toHaveProperty('envelopeFrom')
      expect(demoType.envelopeFrom.type).toMatchObject(GraphQLString)
    })
    it('has a guidance field', () => {
      const demoType = dkimFailureTableType.getFields()

      expect(demoType).toHaveProperty('guidance')
      expect(demoType.guidance.type).toMatchObject(GraphQLString)
    })
    it('has a guidanceTag field', () => {
      const demoType = dkimFailureTableType.getFields()

      expect(demoType).toHaveProperty('guidanceTag')
      expect(demoType.guidanceTag.type).toMatchObject(guidanceTagType)
    })
    it('has a headerFrom field', () => {
      const demoType = dkimFailureTableType.getFields()

      expect(demoType).toHaveProperty('headerFrom')
      expect(demoType.headerFrom.type).toMatchObject(GraphQLString)
    })
    it('has a sourceIpAddress field', () => {
      const demoType = dkimFailureTableType.getFields()

      expect(demoType).toHaveProperty('sourceIpAddress')
      expect(demoType.sourceIpAddress.type).toMatchObject(GraphQLString)
    })
    it('has a totalMessages field', () => {
      const demoType = dkimFailureTableType.getFields()

      expect(demoType).toHaveProperty('totalMessages')
      expect(demoType.totalMessages.type).toMatchObject(GraphQLInt)
    })
  })
  describe('testing field resolvers', () => {
    describe('testing the id resolver', () => {
      it('returns resolved value', () => {
        const demoType = dkimFailureTableType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(
          toGlobalId('dkimFail', 1),
        )
      })
    })
    describe('testing the dkimAligned resolver', () => {
      it('returns resolved value', () => {
        const demoType = dkimFailureTableType.getFields()

        expect(demoType.dkimAligned.resolve({ dkimAligned: true })).toEqual(
          true,
        )
      })
    })
    describe('testing the dkimDomains resolver', () => {
      it('returns resolved value', () => {
        const demoType = dkimFailureTableType.getFields()

        expect(
          demoType.dkimDomains.resolve({ dkimDomains: 'dkimDomains' }),
        ).toEqual('dkimDomains')
      })
    })
    describe('testing the dkimResults resolver', () => {
      it('returns resolved value', () => {
        const demoType = dkimFailureTableType.getFields()

        expect(
          demoType.dkimResults.resolve({ dkimResults: 'dkimResults' }),
        ).toEqual('dkimResults')
      })
    })
    describe('testing the dkimSelectors resolver', () => {
      it('returns resolved value', () => {
        const demoType = dkimFailureTableType.getFields()

        expect(
          demoType.dkimSelectors.resolve({ dkimSelectors: 'dkimSelectors' }),
        ).toEqual('dkimSelectors')
      })
    })
    describe('testing the dnsHost resolver', () => {
      it('returns resolved value', () => {
        const demoType = dkimFailureTableType.getFields()

        expect(demoType.dnsHost.resolve({ dnsHost: 'dnsHost' })).toEqual(
          'dnsHost',
        )
      })
    })
    describe('testing the envelopeFrom resolver', () => {
      it('returns resolved value', () => {
        const demoType = dkimFailureTableType.getFields()

        expect(
          demoType.envelopeFrom.resolve({ envelopeFrom: 'envelopeFrom' }),
        ).toEqual('envelopeFrom')
      })
    })
    describe('testing the guidance resolver', () => {
      it('returns resolved value', () => {
        const demoType = dkimFailureTableType.getFields()

        expect(demoType.guidance.resolve({ guidance: 'guidance' })).toEqual(
          'guidance',
        )
      })
    })
    describe('testing the guidanceTag resolver', () => {
      it('returns resolved value', async () => {
        const demoType = dkimFailureTableType.getFields()

        const expectedResults = {
          _id: 'aggregateGuidanceTags/agg1',
          _key: 'agg1',
          _rev: 'rev',
          _type: 'guidanceTag',
          en: {
            guidance: 'cool guidance for issue',
            id: 'agg1',
            refLinksGuide: [
              { description: 'Link Description', ref_link: 'www.link.ca' },
            ],
            refLinksTechnical: [
              {
                description: 'Tech link description',
                tech_link: 'www.tech.link.ca',
              },
            ],
            tagId: 'agg1',
            tagName: 'cool-tag-name',
          },
          fr: {},
        }

        expect(
          await demoType.guidanceTag.resolve(
            { guidance: 'agg1' },
            {},
            {
              loaders: {
                loadAggregateGuidanceTagById: {
                  load: jest.fn().mockReturnValue(expectedResults),
                },
              },
            },
          ),
        ).toEqual(expectedResults)
      })
    })
    describe('testing the headerFrom resolver', () => {
      it('returns resolved value', () => {
        const demoType = dkimFailureTableType.getFields()

        expect(
          demoType.headerFrom.resolve({ headerFrom: 'headerFrom' }),
        ).toEqual('headerFrom')
      })
    })
    describe('testing test sourceIpAddress resolver', () => {
      it('returns resolved value', () => {
        const demoType = dkimFailureTableType.getFields()

        expect(
          demoType.sourceIpAddress.resolve({
            sourceIpAddress: 'sourceIpAddress',
          }),
        ).toEqual('sourceIpAddress')
      })
    })
    describe('testing the totalMessages resolver', () => {
      it('returns resolved value', () => {
        const demoType = dkimFailureTableType.getFields()

        expect(demoType.totalMessages.resolve({ totalMessages: 5 })).toEqual(5)
      })
    })
  })
})
