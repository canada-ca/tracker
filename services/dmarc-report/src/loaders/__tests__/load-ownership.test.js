require('jest-fetch-mock').enableFetchMocks()
const { getDecodedData } = require('..')

describe('given the loadDomainOwnership function', () => {
  const fetch = fetchMock

  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeEach(async () => {
    console.error = mockedError
    consoleOutput.length = 0
    fetch.resetMocks()
  })

  describe('given a successful load', () => {
    it("returns an object with the keys as org acronyms and fields as array's of domains", async () => {
      const unencodedContent = JSON.stringify({
        TEST1: ['test.gc.ca', 'test-domain.gc.ca'],
        TEST2: ['test.canada.ca', 'test-domain.canada.ca'],
      })
      const resp = {
        data: {
          content: Buffer.from(unencodedContent).toString('base64'),
        },
      }
      const data = await getDecodedData(resp)

      expect(JSON.stringify(data)).toEqual(unencodedContent)
    })
  })
})
