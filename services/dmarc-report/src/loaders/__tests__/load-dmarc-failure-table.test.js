const { mapGuidance } = require('../../utils')
const { loadDmarcFailureTable } = require('../load-dmarc-failure-table')

describe('given the loadDmarcFailureTable function', () => {
  describe('given a successful load', () => {
    it('returns a list of dkim failures', async () => {
      const mockedContainer = {
        items: {
          query: jest.fn().mockReturnValue({
            fetchAll() {
              return {
                resources: [
                  {
                    sourceIpAddress: '12.23.45.56',
                    envelopeFrom: 'envelopeFrom.ca',
                    headerFrom: 'headerFrom.ca',
                    spfDomains: 'spfDomains',
                    dkimDomains: '',
                    dkimSelectors: '',
                    disposition: 'none',
                    totalMessages: 294,
                    dnsHost: 'dns.ca',
                    id: 1,
                  },
                ],
              }
            },
          }),
        },
      }

      const loader = loadDmarcFailureTable({
        container: mockedContainer,
        mapGuidance,
      })

      const summary = await loader({
        domain: 'domain.ca',
        date: '2021-01-01',
      })

      const dmarcFailureList = [
        {
          sourceIpAddress: '12.23.45.56',
          envelopeFrom: 'envelopeFrom.ca',
          headerFrom: 'headerFrom.ca',
          spfDomains: 'spfDomains',
          dkimDomains: '',
          dkimSelectors: '',
          disposition: 'none',
          totalMessages: 294,
          dnsHost: 'dns.ca',
          id: 1,
        },
      ]

      expect(summary).toEqual(dmarcFailureList)
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

      const loader = loadDmarcFailureTable({ container: mockedContainer })

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
