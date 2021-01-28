import { detailTablesType } from '../detail-tables'
import { dkimFailureConnection } from '../dkim-failure-table'
import { dmarcFailureConnection } from '../dmarc-failure-table'
import { fullPassConnection } from '../full-pass-table'
import { spfFailureConnection } from '../spf-failure-table'

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
  describe('testing teh field resolvers', () => {
    describe('testing the dkimFailure resolver', () => {
      it('returns the resolved value', () => {
        const demoType = detailTablesType.getFields()

        const dkimFailure = {
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
        }

        const expectedResult = {
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
        }

        expect(demoType.dkimFailure.resolve({ dkimFailure })).toEqual(
          expectedResult,
        )
      })
    })
    describe('testing the dmarcFailure resolver', () => {
      it('returns the resolved value', () => {
        const demoType = detailTablesType.getFields()

        const dmarcFailure = {
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
        }

        const expectedResult = {
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
        }

        expect(demoType.dmarcFailure.resolve({ dmarcFailure })).toEqual(
          expectedResult,
        )
      })
    })
    describe('testing the fullPass resolver', () => {
      it('returns the resolved value', () => {
        const demoType = detailTablesType.getFields()

        const fullPass = {
          id: '1',
          dkimDomains: 'dkimDomains',
          dkimSelectors: 'dkimSelectors',
          dnsHost: 'dnsHost',
          envelopeFrom: 'envelopeFrom',
          headerFrom: 'headerFrom',
          sourceIpAddress: 'sourceIpAddress',
          spfDomains: 'spfDomains',
          totalMessages: 1000,
        }

        const expectedResult = {
          id: '1',
          dkimDomains: 'dkimDomains',
          dkimSelectors: 'dkimSelectors',
          dnsHost: 'dnsHost',
          envelopeFrom: 'envelopeFrom',
          headerFrom: 'headerFrom',
          sourceIpAddress: 'sourceIpAddress',
          spfDomains: 'spfDomains',
          totalMessages: 1000,
        }

        expect(demoType.fullPass.resolve({ fullPass })).toEqual(expectedResult)
      })
    })
    describe('testing the spfFailure field', () => {
      it('returns the resolved value', () => {
        const demoType = detailTablesType.getFields()

        const spfFailure = {
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
        }

        const expectedResult = {
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
        }

        expect(demoType.spfFailure.resolve({ spfFailure })).toEqual(
          expectedResult,
        )
      })
    })
  })
})
