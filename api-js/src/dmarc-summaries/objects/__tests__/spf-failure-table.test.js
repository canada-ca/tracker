import { ensure, dbNameFromFile } from 'arango-tools'
import {
  GraphQLID,
  GraphQLInt,
  GraphQLString,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLList,
} from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { spfFailureTableType } from '../spf-failure-table'
import { loadAggregateGuidanceTagById } from '../../../guidance-tag/loaders'
import { guidanceTagType } from '../../../guidance-tag/objects'
import { databaseOptions } from '../../../../database-options'
import { Domain } from '../../../scalars'

const { DB_PASS: rootPass, DB_URL: url } = process.env

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
      expect(demoType.dnsHost.type).toMatchObject(Domain)
    })
    it('has a envelopeFrom field', () => {
      const demoType = spfFailureTableType.getFields()

      expect(demoType).toHaveProperty('envelopeFrom')
      expect(demoType.envelopeFrom.type).toMatchObject(Domain)
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
      expect(demoType.headerFrom.type).toMatchObject(Domain)
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
      expect(demoType.spfDomains.type).toMatchObject(GraphQLList(Domain))
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
      let query, drop, truncate, collections, aggGT
      beforeAll(async () => {
        ;({ query, drop, truncate, collections } = await ensure({
          type: 'database',
          name: dbNameFromFile(__filename),
          url,
          rootPassword: rootPass,
          options: databaseOptions({ rootPass }),
        }))
      })
      beforeEach(async () => {
        aggGT = await collections.aggregateGuidanceTags.save({
          _key: 'agg1',
          tagName: 'cool-tag-name',
          guidance: 'cool guidance for issue',
          refLinksGuide: [
            {
              description: 'Link Description',
              ref_link: 'www.link.ca',
            },
          ],
          refLinksTechnical: [
            {
              description: 'Tech link description',
              tech_link: 'www.tech.link.ca',
            },
          ],
        })
      })
      afterEach(async () => {
        await truncate()
      })
      afterAll(async () => {
        await drop()
      })
      it('returns resolved value', async () => {
        const demoType = spfFailureTableType.getFields()

        expect(
          await demoType.guidanceTag.resolve(
            { guidance: 'agg1' },
            {},
            {
              loaders: {
                loadAggregateGuidanceTagById: loadAggregateGuidanceTagById({
                  query,
                  userKey: '1',
                }),
              },
            },
          ),
        ).toEqual({
          _id: 'aggregateGuidanceTags/agg1',
          _key: 'agg1',
          _rev: aggGT._rev,
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
        ).toEqual(['spfDomains'])
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
