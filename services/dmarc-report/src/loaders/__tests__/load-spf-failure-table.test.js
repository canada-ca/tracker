const { mapGuidance } = require('../../utils')
const { loadSpfFailureTable } = require('../load-spf-failure-table')

describe('given the loadSpfFailureTable function', () => {
  describe('given a successful load', () => {
    it('returns a list of dkim failures', async () => {
      const mockedContainer = {
        items: {
          query: jest.fn().mockReturnValue({
            fetchAll() {
              return {
                resources: [
                  {
                    sourceIpAddress: '12.34.56.78',
                    envelopeFrom: 'envelopeFrom.ca',
                    headerFrom: 'headerFrom.ca',
                    spfDomains: 'spfDomain.com',
                    spfResults: 'softfail',
                    spfAligned: false,
                    totalMessages: 294,
                    id: 1,
                    dnsHost: 'dns.ca',
                    guidance: 'agg1',
                  },
                ],
              }
            },
          }),
        },
      }

      const loader = loadSpfFailureTable({
        container: mockedContainer,
        mapGuidance,
      })

      const summary = await loader({
        domain: 'domain.ca',
        date: '2021-01-01',
      })

      const spfFailureList = [
        {
          sourceIpAddress: '12.34.56.78',
          envelopeFrom: 'envelopeFrom.ca',
          headerFrom: 'headerFrom.ca',
          spfDomains: 'spfDomain.com',
          spfResults: 'softfail',
          spfAligned: false,
          totalMessages: 294,
          id: 1,
          dnsHost: 'dns.ca',
          guidance: 'agg1',
        },
      ]

      expect(summary).toEqual(spfFailureList)
    })
  })
  describe('given an unsuccessful load', () => {
    it('throws an error', async () => {
      const mockedContainer = {
        items: {
          query: jest.fn().mockReturnValue({
            fetchAll: jest.fn().mockRejectedValue('Database error occurred.'),
          }),
        },
      }

      const loader = loadSpfFailureTable({ container: mockedContainer })

      try {
        await loader({
          domain: 'domain.ca',
          date: '2021-01-01',
        })
      } catch (err) {
        expect(err).toEqual('Database error occurred.')
      }
    })
  })
})
