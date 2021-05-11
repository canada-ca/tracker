import {
  GraphQLID,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLList,
} from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { dmarcFailureTableType } from '../dmarc-failure-table'
import { Domain } from '../../../scalars'

describe('given the dmarcFailureTable gql object', () => {
  describe('testing field definitions', () => {
    it('has an id field', () => {
      const demoType = dmarcFailureTableType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a dkimDomains field', () => {
      const demoType = dmarcFailureTableType.getFields()

      expect(demoType).toHaveProperty('dkimDomains')
      expect(demoType.dkimDomains.type).toMatchObject(GraphQLList(Domain))
    })
    it('has a dkimSelectors field', () => {
      const demoType = dmarcFailureTableType.getFields()

      expect(demoType).toHaveProperty('dkimSelectors')
      expect(demoType.dkimSelectors.type).toMatchObject(GraphQLList(GraphQLString))
    })
    it('has a disposition field', () => {
      const demoType = dmarcFailureTableType.getFields()

      expect(demoType).toHaveProperty('disposition')
      expect(demoType.disposition.type).toMatchObject(GraphQLString)
    })
    it('has a dnsHost field', () => {
      const demoType = dmarcFailureTableType.getFields()

      expect(demoType).toHaveProperty('dnsHost')
      expect(demoType.dnsHost.type).toMatchObject(Domain)
    })
    it('has an envelopeFrom field', () => {
      const demoType = dmarcFailureTableType.getFields()

      expect(demoType).toHaveProperty('envelopeFrom')
      expect(demoType.envelopeFrom.type).toMatchObject(Domain)
    })
    it('has a headerFrom field', () => {
      const demoType = dmarcFailureTableType.getFields()

      expect(demoType).toHaveProperty('headerFrom')
      expect(demoType.headerFrom.type).toMatchObject(Domain)
    })
    it('has a sourceIpAddress field', () => {
      const demoType = dmarcFailureTableType.getFields()

      expect(demoType).toHaveProperty('sourceIpAddress')
      expect(demoType.sourceIpAddress.type).toMatchObject(GraphQLString)
    })
    it('has a spfDomains field', () => {
      const demoType = dmarcFailureTableType.getFields()

      expect(demoType).toHaveProperty('spfDomains')
      expect(demoType.spfDomains.type).toMatchObject(GraphQLList(Domain))
    })
    it('has a totalMessages field', () => {
      const demoType = dmarcFailureTableType.getFields()

      expect(demoType).toHaveProperty('totalMessages')
      expect(demoType.totalMessages.type).toMatchObject(GraphQLInt)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the id resolver', () => {
      it('returns the resolved result', () => {
        const demoType = dmarcFailureTableType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(
          toGlobalId('dmarcFail', 1),
        )
      })
    })
    describe('testing the dkimDomains resolver', () => {
      it('returns the resolved result', () => {
        const demoType = dmarcFailureTableType.getFields()

        expect(
          demoType.dkimDomains.resolve({ dkimDomains: 'dkimDomains' }),
        ).toEqual(['dkimDomains'])
      })
    })
    describe('testing the dkimSelectors resolver', () => {
      it('returns the resolved result', () => {
        const demoType = dmarcFailureTableType.getFields()

        expect(
          demoType.dkimSelectors.resolve({ dkimSelectors: 'dkimSelectors' }),
        ).toEqual(['dkimSelectors'])
      })
    })
    describe('testing the disposition resolver', () => {
      it('returns the resolved result', () => {
        const demoType = dmarcFailureTableType.getFields()

        expect(
          demoType.disposition.resolve({ disposition: 'disposition' }),
        ).toEqual('disposition')
      })
    })
    describe('testing the dnsHost resolver', () => {
      it('returns the resolved result', () => {
        const demoType = dmarcFailureTableType.getFields()

        expect(demoType.dnsHost.resolve({ dnsHost: 'dnsHost' })).toEqual(
          'dnsHost',
        )
      })
    })
    describe('testing the envelopeFrom resolver', () => {
      it('returns the resolved result', () => {
        const demoType = dmarcFailureTableType.getFields()

        expect(
          demoType.envelopeFrom.resolve({ envelopeFrom: 'envelopeFrom' }),
        ).toEqual('envelopeFrom')
      })
    })
    describe('testing the headerFrom resolver', () => {
      it('returns the resolved result', () => {
        const demoType = dmarcFailureTableType.getFields()

        expect(
          demoType.headerFrom.resolve({ headerFrom: 'headerFrom' }),
        ).toEqual('headerFrom')
      })
    })
    describe('testing the sourceIpAddress resolver', () => {
      it('returns the resolved result', () => {
        const demoType = dmarcFailureTableType.getFields()

        expect(
          demoType.sourceIpAddress.resolve({
            sourceIpAddress: 'sourceIpAddress',
          }),
        ).toEqual('sourceIpAddress')
      })
    })
    describe('testing the spfDomains resolver', () => {
      it('returns the resolved result', () => {
        const demoType = dmarcFailureTableType.getFields()

        expect(
          demoType.spfDomains.resolve({ spfDomains: 'spfDomains' }),
        ).toEqual(['spfDomains'])
      })
    })
    describe('testing the totalMessages resolvers', () => {
      it('returns the resolved result', () => {
        const demoType = dmarcFailureTableType.getFields()

        expect(demoType.totalMessages.resolve({ totalMessages: 5 })).toEqual(5)
      })
    })
  })
})
