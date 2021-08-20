require('jest-fetch-mock').enableFetchMocks()
const { loadDomainOwnership } = require('..')

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
      const gqlReturnObj = {
        data: {
          repository: {
            id: 'dGVzdAo=',
            object: {
              text:
                '{"Federal": {\n\t"TBS":{\n\t"TEST1": [\n\t\t"test.gc.ca",\n\t\t"test-domain.gc.ca"\n\t],\n\t"TEST2": [\n\t\t"test.canada.ca",\n\t\t"test-domain.canada.ca"\n\t]\n}\n}\n}\n',
            },
          },
        },
      }
      fetch.mockResponseOnce(JSON.stringify(gqlReturnObj))

      const data = await loadDomainOwnership({ fetch })()

      expect(data).toEqual({
        TEST1: ['test.gc.ca', 'test-domain.gc.ca'],
        TEST2: ['test.canada.ca', 'test-domain.canada.ca'],
      })
    })
  })
  describe('given an unsuccessful load', () => {
    describe('if error occurs', () => {
      it('throws error', async () => {
        fetch.mockReject(Error('Fetch Error occurred.'))

        await loadDomainOwnership({ fetch })()
        expect(consoleOutput[0]).toEqual(
          'Error occurred while fetching domain ownership information: Error: Fetch Error occurred.',
        )
      })
    })
  })
})
