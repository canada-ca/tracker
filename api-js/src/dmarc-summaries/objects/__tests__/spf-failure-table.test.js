import {
  GraphQLID,
  GraphQLInt,
  GraphQLString,
  GraphQLBoolean,
  GraphQLNonNull,
} from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { spfFailureTableType } from '../spf-failure-table'
import { guidanceTagType } from '../../../guidance-tag/objects'

describe('given spfFailureTable gql object', () => {
  describe('testing field definitions', () => {
    it('has an id field', () => {
      const demoType = spfFailureTableType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a dnsHost field', () => {
      const demoType = spfFailureTableType.getFields()

      expect(demoType).toHaveProperty('dnsHost')
      expect(demoType.dnsHost.type).toMatchObject(GraphQLString)
    })
    it('has a envelopeFrom field', () => {
      const demoType = spfFailureTableType.getFields()

      expect(demoType).toHaveProperty('envelopeFrom')
      expect(demoType.envelopeFrom.type).toMatchObject(GraphQLString)
    })
    it('has a guidance field', () => {
      const demoType = spfFailureTableType.getFields()

      expect(demoType).toHaveProperty('guidance')
      expect(demoType.guidance.type).toMatchObject(GraphQLString)
    })
    it('has a guidanceTag field', () => {
      const demoType = spfFailureTableType.getFields()

      expect(demoType).toHaveProperty('guidanceTag')
      expect(demoType.guidanceTag.type).toMatchObject(guidanceTagType)
    })
    it('has a headerFrom field', () => {
      const demoType = spfFailureTableType.getFields()

      expect(demoType).toHaveProperty('headerFrom')
      expect(demoType.headerFrom.type).toMatchObject(GraphQLString)
    })
    it('has a sourceIpAddress field', () => {
      const demoType = spfFailureTableType.getFields()

      expect(demoType).toHaveProperty('sourceIpAddress')
      expect(demoType.sourceIpAddress.type).toMatchObject(GraphQLString)
    })
    it('has a spfAligned field', () => {
      const demoType = spfFailureTableType.getFields()

      expect(demoType).toHaveProperty('spfAligned')
      expect(demoType.spfAligned.type).toMatchObject(GraphQLBoolean)
    })
    it('has a spfDomains field', () => {
      const demoType = spfFailureTableType.getFields()

      expect(demoType).toHaveProperty('spfDomains')
      expect(demoType.spfDomains.type).toMatchObject(GraphQLString)
    })
    it('has a spfResults field', () => {
      const demoType = spfFailureTableType.getFields()

      expect(demoType).toHaveProperty('spfResults')
      expect(demoType.spfResults.type).toMatchObject(GraphQLString)
    })
    it('has a totalMessages field', () => {
      const demoType = spfFailureTableType.getFields()

      expect(demoType).toHaveProperty('totalMessages')
      expect(demoType.totalMessages.type).toMatchObject(GraphQLInt)
    })
  })
  describe('testing field resolvers', () => {
    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = spfFailureTableType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(
          toGlobalId('spfFail', 1),
        )
      })
    })
    describe('testing the dnsHost resolver', () => {
      it('returns the resolved value', () => {
        const demoType = spfFailureTableType.getFields()

        expect(demoType.dnsHost.resolve({ dnsHost: 'dnsHost' })).toEqual(
          'dnsHost',
        )
      })
    })
    describe('testing the envelopeFrom resolver', () => {
      it('returns the resolved value', () => {
        const demoType = spfFailureTableType.getFields()

        expect(
          demoType.envelopeFrom.resolve({ envelopeFrom: 'envelopeFrom' }),
        ).toEqual('envelopeFrom')
      })
    })
    describe('testing the guidance resolver', () => {
      it('returns the resolved value', () => {
        const demoType = spfFailureTableType.getFields()

        expect(demoType.guidance.resolve({ guidance: 'guidance' })).toEqual(
          'guidance',
        )
      })
    })
    describe('testing the guidanceTag resolver', () => {
      describe('guidance is not null', () => {
        it('returns resolved value', async () => {
          const demoType = spfFailureTableType.getFields()
  
          const expectedResult = {
            _id: 'aggregateGuidanceTags/agg1',
            _key: 'agg1',
            _rev: 'rev',
            _type: 'guidanceTag',
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
          }
  
          expect(
            await demoType.guidanceTag.resolve(
              { guidance: 'agg1' },
              {},
              {
                loaders: {
                  loadAggregateGuidanceTagByTagId: {
                    load: jest.fn().mockReturnValue(expectedResult),
                  },
                },
              },
            ),
          ).toEqual(expectedResult)
        })
      })
      describe('guidance is null', () => {
        it('returns an empty obj', async () => {
          const demoType = spfFailureTableType.getFields()
  
          const expectedResult = {}
  
          expect(
            await demoType.guidanceTag.resolve(
              { guidance: null },
              {},
              {
                loaders: {
                  loadAggregateGuidanceTagByTagId: {
                    load: jest.fn().mockReturnValue(expectedResult),
                  },
                },
              },
            ),
          ).toEqual(expectedResult)
        })
      })
    })
    describe('testing the headerFrom resolver', () => {
      it('returns the resolved value', () => {
        const demoType = spfFailureTableType.getFields()

        expect(
          demoType.headerFrom.resolve({ headerFrom: 'headerFrom' }),
        ).toEqual('headerFrom')
      })
    })
    describe('testing the sourceIpAddress resolver', () => {
      it('returns the resolved value', () => {
        const demoType = spfFailureTableType.getFields()

        expect(
          demoType.sourceIpAddress.resolve({
            sourceIpAddress: 'sourceIpAddress',
          }),
        ).toEqual('sourceIpAddress')
      })
    })
    describe('testing the spfAligned field', () => {
      it('returns the resolved value', () => {
        const demoType = spfFailureTableType.getFields()

        expect(demoType.spfAligned.resolve({ spfAligned: true })).toEqual(true)
      })
    })
    describe('testing the spfDomains resolver', () => {
      it('returns the resolved value', () => {
        const demoType = spfFailureTableType.getFields()

        expect(
          demoType.spfDomains.resolve({ spfDomains: 'spfDomains' }),
        ).toEqual('spfDomains')
      })
    })
    describe('testing the spfResults resolver', () => {
      it('returns the resolved value', () => {
        const demoType = spfFailureTableType.getFields()

        expect(
          demoType.spfResults.resolve({ spfResults: 'spfResults' }),
        ).toEqual('spfResults')
      })
    })
    describe('testing the totalMessages resolver', () => {
      it('returns the resolved value', () => {
        const demoType = spfFailureTableType.getFields()

        expect(demoType.totalMessages.resolve({ totalMessages: 5 })).toEqual(5)
      })
    })
  })
})
