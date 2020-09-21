require('jest-fetch-mock').enableFetchMocks()

const {
  dmarcReportLoader,
  generateDetailTableFields,
  generateGqlQuery,
} = require('../loaders')

describe('given the domainLoaderDmarcReport function', () => {
  const fetch = fetchMock

  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeEach(async () => {
    console.error = mockedError
    consoleOutput = []
    fetch.resetMocks()
  })

  describe('given a successful fetch call', () => {
    it('returns data to the api', async () => {
      fetch.mockResponseOnce(JSON.stringify({ data: '12345' }))

      const loader = dmarcReportLoader({
        generateGqlQuery,
        generateDetailTableFields,
        fetch,
      })

      const info = {
        fieldName: 'testQuery',
        fieldNodes: [
          {
            selectionSet: {
              selections: [
                {
                  name: {
                    value: 'month',
                  },
                },
              ],
            },
          },
        ],
      }

      const data = await loader({
        info,
        domain: 'test.domain.gc.ca',
        userId: '53521',
      })

      expect(data).toEqual({ data: '12345' })
    })
  })
  describe('given an unsuccessful fetch call', () => {
    it('raises an error', async () => {
      fetch.mockReject(Error('Fetch Error occurred.'))

      const loader = dmarcReportLoader({
        generateGqlQuery,
        generateDetailTableFields,
        fetch,
      })

      const info = {
        fieldName: 'testQuery',
        fieldNodes: [
          {
            selectionSet: {
              selections: [
                {
                  name: {
                    value: 'month',
                  },
                },
              ],
            },
          },
        ],
      }

      try {
        await loader({
          info,
          domain: 'test.domain.gc.ca',
          userId: '53521',
        })
      } catch (err) {
        expect(err).toEqual(new Error('Unable to retrieve testQuery for domain: test.domain.gc.ca.'))
      }

      expect(consoleOutput).toEqual([
        `Fetch error occurred well User: 53521 was trying to retrieve testQuery from the dmarc-report-api, error: Error: Fetch Error occurred.`,
      ])
    })
  })
})
