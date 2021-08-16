const { mapGuidance } = require('../../utils')
const { loadFullPassTable } = require('../load-full-pass-table')

describe('given the loadFullPassTable function', () => {
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
                    spfDomains: 'spfDomains.ca',
                    dkimDomains: 'dkimDomains.ca',
                    dkimSelectors: 'selector1',
                    totalMessages: 2,
                    dnsHost: 'dns.ca',
                    id: 1,
                  },
                ],
              }
            },
          }),
        },
      }

      const loader = loadFullPassTable({
        container: mockedContainer,
        mapGuidance,
      })

      const summary = await loader({
        domain: 'domain.ca',
        date: '2021-01-01',
      })

      const fullPassList = [
        {
          sourceIpAddress: '12.34.56.78',
          envelopeFrom: 'envelopeFrom.ca',
          headerFrom: 'headerFrom.ca',
          spfDomains: 'spfDomains.ca',
          dkimDomains: 'dkimDomains.ca',
          dkimSelectors: 'selector1',
          totalMessages: 2,
          dnsHost: 'dns.ca',
          id: 1,
        },
      ]

      expect(summary).toEqual(fullPassList)
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

      const loader = loadFullPassTable({ container: mockedContainer })

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
