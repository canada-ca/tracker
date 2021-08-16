const { mapGuidance } = require('../../utils')
const { loadDkimFailureTable } = require('../load-dkim-failure-table')

describe('given the loadDkimFailureTable function', () => {
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
                    envelopeFrom: 'envelopFrom.ca',
                    headerFrom: 'headerFrom.ca',
                    dkimDomains: '',
                    dkimSelectors: '',
                    dkimResults: '',
                    dkimAligned: false,
                    totalMessages: 294,
                    dnsHost: 'dns.ca',
                    id: 1,
                    guidance: 'agg1',
                  },
                ],
              }
            },
          }),
        },
      }

      const loader = loadDkimFailureTable({
        container: mockedContainer,
        mapGuidance,
      })

      const summary = await loader({
        domain: 'domain.ca',
        date: '2021-01-01',
      })

      const dkimFailureList = [
        {
          sourceIpAddress: '12.34.56.78',
          envelopeFrom: 'envelopFrom.ca',
          headerFrom: 'headerFrom.ca',
          dkimDomains: '',
          dkimSelectors: '',
          dkimResults: '',
          dkimAligned: false,
          totalMessages: 294,
          dnsHost: 'dns.ca',
          id: 1,
          guidance: 'agg1',
        },
      ]

      expect(summary).toEqual(dkimFailureList)
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

      const loader = loadDkimFailureTable({ container: mockedContainer })

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
