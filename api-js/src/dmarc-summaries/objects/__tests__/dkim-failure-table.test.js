import { ensure, dbNameFromFile } from 'arango-tools'
import {
  GraphQLID,
  GraphQLBoolean,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
} from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { dkimFailureTableType } from '../dkim-failure-table'
import { loadAggregateGuidanceTagById } from '../../../guidance-tag/loaders'
import { guidanceTagType } from '../../../guidance-tag/objects'
import { databaseOptions } from '../../../../database-options'

const { DB_PASS: rootPass, DB_URL: url } = process.env

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
        const demoType = dkimFailureTableType.getFields()

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
