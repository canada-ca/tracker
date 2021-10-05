import { toGlobalId } from 'graphql-relay'

import { detailTablesType } from '../detail-tables'
import { dkimFailureConnection } from '../dkim-failure-table-connection'
import { dmarcFailureConnection } from '../dmarc-failure-table-connection'
import { fullPassConnection } from '../full-pass-table-connection'
import { spfFailureConnection } from '../spf-failure-table-connection'

describe('testing the detailTables gql object', () => {
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
            { _id: '1' },
            { first: 1 },
            {
              loaders: {
                loadDkimFailConnectionsBySumId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
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
            { _id: '1' },
            { first: 1 },
            {
              loaders: {
                loadDmarcFailConnectionsBySumId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
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
            { _id: '1' },
            { first: 1 },
            {
              loaders: {
                loadFullPassConnectionsBySumId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
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
            { _id: '1' },
            { first: 1 },
            {
              loaders: {
                loadSpfFailureConnectionsBySumId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
  })
})
