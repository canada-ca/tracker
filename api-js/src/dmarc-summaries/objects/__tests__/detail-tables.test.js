import { ensure, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'

import { databaseOptions } from '../../../../database-options'
import {
  dkimFailureLoaderConnectionsBySumId,
  dmarcFailureLoaderConnectionsBySumId,
  fullPassLoaderConnectionsBySumId,
  spfFailureLoaderConnectionsBySumId,
} from '../../loaders'
import { detailTablesType } from '../detail-tables'
import { dkimFailureConnection } from '../dkim-failure-table-connection'
import { dmarcFailureConnection } from '../dmarc-failure-table-connection'
import { fullPassConnection } from '../full-pass-table-connection'
import { spfFailureConnection } from '../spf-failure-table-connection'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('testing the detailTables gql object', () => {
  let query, drop, truncate, collections, dmarcSummary

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
    dmarcSummary = await collections.dmarcSummaries.save({
      categoryTotals: {},
      detailTables: {
        dkimFailure: [
          {
            id: '1',
            dkimAligned: false,
            dkimDomains: 'dkimDomains',
            dkimResults: 'dkimResults',
            dkimSelectors: 'dkimSelectors',
            dnsHost: 'dnsHost',
            envelopeFrom: 'envelopeFrom',
            guidance: 'guidance',
            headerFrom: 'headerFrom',
            sourceIpAddress: 'sourceIpAddress',
            totalMessages: 1000,
          },
        ],
        dmarcFailure: [
          {
            id: '1',
            dkimDomains: 'dkimDomains',
            dkimSelectors: 'dkimSelectors',
            disposition: 'disposition',
            dnsHost: 'dnsHost',
            envelopeFrom: 'envelopeFrom',
            headerFrom: 'headerFrom',
            sourceIpAddress: 'sourceIpAddress',
            spfDomains: 'spfDomains',
            totalMessages: 1000,
          },
        ],
        fullPass: [
          {
            id: '1',
            dkimDomains: 'dkimDomains',
            dkimSelectors: 'dkimSelectors',
            dnsHost: 'dnsHost',
            envelopeFrom: 'envelopeFrom',
            headerFrom: 'headerFrom',
            sourceIpAddress: 'sourceIpAddress',
            spfDomains: 'spfDomains',
            totalMessages: 1000,
          },
        ],
        spfFailure: [
          {
            id: '1',
            dnsHost: 'dnsHost',
            envelopeFrom: 'envelopeFrom',
            guidance: 'guidance',
            headerFrom: 'headerFrom',
            sourceIpAddress: 'sourceIpAddress',
            spfAligned: true,
            spfDomains: 'spfDomains',
            spfResults: 'spfResults',
            totalMessages: 1000,
          },
        ],
      },
    })
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('testing the field definitions', () => {
    it('has a dkimFailure field', () => {
      const demoType = detailTablesType.getFields()

      expect(demoType).toHaveProperty('dkimFailure')
      expect(demoType.dkimFailure.type).toMatchObject(
        dkimFailureConnection.connectionType,
      )
    })
    it('has a dmarcFailure field', () => {
      const demoType = detailTablesType.getFields()

      expect(demoType).toHaveProperty('dmarcFailure')
      expect(demoType.dmarcFailure.type).toMatchObject(
        dmarcFailureConnection.connectionType,
      )
    })
    it('has a fullPass field', () => {
      const demoType = detailTablesType.getFields()

      expect(demoType).toHaveProperty('fullPass')
      expect(demoType.fullPass.type).toMatchObject(
        fullPassConnection.connectionType,
      )
    })
    it('has a spfFailure field', () => {
      const demoType = detailTablesType.getFields()

      expect(demoType).toHaveProperty('spfFailure')
      expect(demoType.spfFailure.type).toMatchObject(
        spfFailureConnection.connectionType,
      )
    })
  })
  describe('testing the field resolvers', () => {
    describe('testing the dkimFailure resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = detailTablesType.getFields()

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('dkimFail', 1),
              node: {
                id: '1',
                dkimAligned: false,
                dkimDomains: 'dkimDomains',
                dkimResults: 'dkimResults',
                dkimSelectors: 'dkimSelectors',
                dnsHost: 'dnsHost',
                envelopeFrom: 'envelopeFrom',
                guidance: 'guidance',
                headerFrom: 'headerFrom',
                sourceIpAddress: 'sourceIpAddress',
                totalMessages: 1000,
                type: 'dkimFail',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('dkimFail', 1),
            endCursor: toGlobalId('dkimFail', 1),
          },
        }

        await expect(
          demoType.dkimFailure.resolve(
            { _id: dmarcSummary._id },
            { first: 1 },
            {
              loaders: {
                dkimFailureLoaderConnectionsBySumId: dkimFailureLoaderConnectionsBySumId(
                  query,
                ),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the dmarcFailure resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = detailTablesType.getFields()

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('dmarcFail', 1),
              node: {
                id: '1',
                dkimDomains: 'dkimDomains',
                dkimSelectors: 'dkimSelectors',
                disposition: 'disposition',
                dnsHost: 'dnsHost',
                envelopeFrom: 'envelopeFrom',
                headerFrom: 'headerFrom',
                sourceIpAddress: 'sourceIpAddress',
                spfDomains: 'spfDomains',
                totalMessages: 1000,
                type: 'dmarcFail',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('dmarcFail', 1),
            endCursor: toGlobalId('dmarcFail', 1),
          },
        }

        await expect(
          demoType.dmarcFailure.resolve(
            { _id: dmarcSummary._id },
            { first: 1 },
            {
              loaders: {
                dmarcFailureLoaderConnectionsBySumId: dmarcFailureLoaderConnectionsBySumId(
                  query,
                ),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the fullPass resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = detailTablesType.getFields()

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('fullPass', 1),
              node: {
                id: '1',
                dkimDomains: 'dkimDomains',
                dkimSelectors: 'dkimSelectors',
                dnsHost: 'dnsHost',
                envelopeFrom: 'envelopeFrom',
                headerFrom: 'headerFrom',
                sourceIpAddress: 'sourceIpAddress',
                spfDomains: 'spfDomains',
                totalMessages: 1000,
                type: 'fullPass',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('fullPass', 1),
            endCursor: toGlobalId('fullPass', 1),
          },
        }

        await expect(
          demoType.fullPass.resolve(
            { _id: dmarcSummary._id },
            { first: 1 },
            {
              loaders: {
                fullPassLoaderConnectionsBySumId: fullPassLoaderConnectionsBySumId(
                  query,
                ),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the spfFailure field', () => {
      it('returns the resolved value', async () => {
        const demoType = detailTablesType.getFields()

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('spfFail', 1),
              node: {
                id: '1',
                dnsHost: 'dnsHost',
                envelopeFrom: 'envelopeFrom',
                guidance: 'guidance',
                headerFrom: 'headerFrom',
                sourceIpAddress: 'sourceIpAddress',
                spfAligned: true,
                spfDomains: 'spfDomains',
                spfResults: 'spfResults',
                totalMessages: 1000,
                type: 'spfFail',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('spfFail', 1),
            endCursor: toGlobalId('spfFail', 1),
          },
        }

        await expect(
          demoType.spfFailure.resolve(
            { _id: dmarcSummary._id },
            { first: 1 },
            {
              loaders: {
                spfFailureLoaderConnectionsBySumId: spfFailureLoaderConnectionsBySumId(
                  query,
                ),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
  })
})
