import { GraphQLID, GraphQLInt, GraphQLString, GraphQLNonNull } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { fullPassTableType } from '../full-pass-table'

describe('given the fullPassTable gql object', () => {
  describe('testing the field definitions', () => {
    it('has an id field', () => {
      const demoType = fullPassTableType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(new GraphQLNonNull(GraphQLID))
    })
    it('has a dkimDomains field', () => {
      const demoType = fullPassTableType.getFields()

      expect(demoType).toHaveProperty('dkimDomains')
      expect(demoType.dkimDomains.type).toMatchObject(GraphQLString)
    })
    it('has a dkimSelectors field', () => {
      const demoType = fullPassTableType.getFields()

      expect(demoType).toHaveProperty('dkimSelectors')
      expect(demoType.dkimSelectors.type).toMatchObject(GraphQLString)
    })
    it('has a dnsHost field', () => {
      const demoType = fullPassTableType.getFields()

      expect(demoType).toHaveProperty('dnsHost')
      expect(demoType.dnsHost.type).toMatchObject(GraphQLString)
    })
    it('has an envelopeFrom field', () => {
      const demoType = fullPassTableType.getFields()

      expect(demoType).toHaveProperty('envelopeFrom')
      expect(demoType.envelopeFrom.type).toMatchObject(GraphQLString)
    })
    it('has a headerFrom field', () => {
      const demoType = fullPassTableType.getFields()

      expect(demoType).toHaveProperty('headerFrom')
      expect(demoType.headerFrom.type).toMatchObject(GraphQLString)
    })
    it('has a sourceIpAddress field', () => {
      const demoType = fullPassTableType.getFields()

      expect(demoType).toHaveProperty('sourceIpAddress')
      expect(demoType.sourceIpAddress.type).toMatchObject(GraphQLString)
    })
    it('has a spfDomains field', () => {
      const demoType = fullPassTableType.getFields()

      expect(demoType).toHaveProperty('spfDomains')
      expect(demoType.spfDomains.type).toMatchObject(GraphQLString)
    })
    it('has a totalMessages field', () => {
      const demoType = fullPassTableType.getFields()

      expect(demoType).toHaveProperty('totalMessages')
      expect(demoType.totalMessages.type).toMatchObject(GraphQLInt)
    })
  })

  describe('testing the field resolvers', () => {
    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = fullPassTableType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(toGlobalId('fullPass', 1))
      })
    })
    describe('testing the dkimDomains resolver', () => {
      it('returns the resolved value', () => {
        const demoType = fullPassTableType.getFields()

        expect(demoType.dkimDomains.resolve({ dkimDomains: 'dkimDomains' })).toEqual('dkimDomains')
      })
    })
    describe('testing the dkimSelectors resolvers', () => {
      it('returns the resolved value', () => {
        const demoType = fullPassTableType.getFields()

        expect(demoType.dkimSelectors.resolve({ dkimSelectors: 'dkimSelectors' })).toEqual('dkimSelectors')
      })
    })
    describe('testing the dnsHost resolver', () => {
      it('returns the resolved value', () => {
        const demoType = fullPassTableType.getFields()

        expect(demoType.dnsHost.resolve({ dnsHost: 'dnsHost' })).toEqual('dnsHost')
      })
    })
    describe('testing the envelopeFrom resolver', () => {
      it('returns the resolved value', () => {
        const demoType = fullPassTableType.getFields()

        expect(demoType.envelopeFrom.resolve({ envelopeFrom: 'envelopeFrom' })).toEqual('envelopeFrom')
      })
    })
    describe('testing the headerFrom resolver', () => {
      it('returns the resolved value', () => {
        const demoType = fullPassTableType.getFields()

        expect(demoType.headerFrom.resolve({ headerFrom: 'headerFrom' })).toEqual('headerFrom')
      })
    })
    describe('testing the sourceIpAddress resolver', () => {
      it('returns the resolved value', () => {
        const demoType = fullPassTableType.getFields()

        expect(
          demoType.sourceIpAddress.resolve({
            sourceIpAddress: 'sourceIpAddress',
          }),
        ).toEqual('sourceIpAddress')
      })
    })
    describe('testing the spfDomains resolver', () => {
      it('returns the resolved value', () => {
        const demoType = fullPassTableType.getFields()

        expect(demoType.spfDomains.resolve({ spfDomains: 'spfDomains' })).toEqual('spfDomains')
      })
    })
    describe('testing the totalMessages resolver', () => {
      it('returns the resolved value', () => {
        const demoType = fullPassTableType.getFields()

        expect(demoType.totalMessages.resolve({ totalMessages: 10 })).toEqual(10)
      })
    })
  })
})
