const { loadSummaryByDate } = require('../load-summary-by-date')

describe('given the loadSummaryByDate function', () => {
  describe('given no errors', () => {
    describe('category totals is undefined', () => {
      it('returns summary object', async () => {
        const mockedContainer = {
          items: {
            query() {
              return {
                fetchAll() {
                  return {
                    resources: [],
                  }
                },
              }
            },
          },
        }

        const loader = loadSummaryByDate(mockedContainer)

        const summary = await loader({
          domain: 'domain.ca',
          startDate: '2021-01-01',
        })

        const expectedSummary = {
          detailTables: {
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          categoryTotals: {
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
        }

        expect(summary).toEqual(expectedSummary)
      })
    })
    describe('category totals is not undefined', () => {
      it('returns summary object', async () => {
        const mockedContainer = {
          items: {
            query: jest
              .fn()
              .mockReturnValueOnce({
                fetchAll() {
                  return {
                    resources: [
                      { pass: 0, fail: 0, passDkimOnly: 0, passSpfOnly: 0 },
                    ],
                  }
                },
              })
              .mockReturnValue({
                fetchAll() {
                  return {
                    resources: [],
                  }
                },
              }),
          },
        }

        const loader = loadSummaryByDate(mockedContainer)

        const summary = await loader({
          domain: 'domain.ca',
          startDate: '2021-01-01',
        })

        const expectedSummary = {
          detailTables: {
            dkimFailure: [],
            dmarcFailure: [],
            fullPass: [],
            spfFailure: [],
          },
          categoryTotals: {
            pass: 0,
            fail: 0,
            passDkimOnly: 0,
            passSpfOnly: 0,
          },
        }

        expect(summary).toEqual(expectedSummary)
      })
    })
  })
  describe('given an error', () => {
    describe('when retrieving category totals', () => {
      it('throws an error', async () => {
        const mockedContainer = {
          items: {
            query() {
              return {
                fetchAll: jest
                  .fn()
                  .mockRejectedValue('Database error occurred.'),
              }
            },
          },
        }

        const loader = loadSummaryByDate(mockedContainer)

        try {
          await loader({
            domain: 'domain.ca',
            startDate: '2021-01-01',
          })
        } catch (err) {
          expect(err).toEqual(new Error('Database error occurred.'))
        }
      })
    })
    describe('when retrieving dkim failure data', () => {
      it('throws an error', async () => {
        const mockedContainer = {
          items: {
            query: jest
              .fn()
              .mockReturnValueOnce({
                fetchAll() {
                  return {
                    resources: [],
                  }
                },
              })
              .mockReturnValue({
                fetchAll: jest
                  .fn()
                  .mockRejectedValue('Database error occurred.'),
              }),
          },
        }

        const loader = loadSummaryByDate(mockedContainer)

        try {
          await loader({
            domain: 'domain.ca',
            startDate: '2021-01-01',
          })
        } catch (err) {
          expect(err).toEqual(new Error('Database error occurred.'))
        }
      })
    })
    describe('when retrieving dmarc failure data', () => {
      it('throws an error', async () => {
        const mockedContainer = {
          items: {
            query: jest
              .fn()
              .mockReturnValueOnce({
                fetchAll() {
                  return {
                    resources: [],
                  }
                },
              })
              .mockReturnValueOnce({
                fetchAll() {
                  return {
                    resources: [],
                  }
                },
              })
              .mockReturnValue({
                fetchAll: jest
                  .fn()
                  .mockRejectedValue('Database error occurred.'),
              }),
          },
        }

        const loader = loadSummaryByDate(mockedContainer)

        try {
          await loader({
            domain: 'domain.ca',
            startDate: '2021-01-01',
          })
        } catch (err) {
          expect(err).toEqual(new Error('Database error occurred.'))
        }
      })
    })
    describe('when retrieving full pass data', () => {
      it('throws an error', async () => {
        const mockedContainer = {
          items: {
            query: jest
              .fn()
              .mockReturnValueOnce({
                fetchAll() {
                  return {
                    resources: [],
                  }
                },
              })
              .mockReturnValueOnce({
                fetchAll() {
                  return {
                    resources: [],
                  }
                },
              })
              .mockReturnValueOnce({
                fetchAll() {
                  return {
                    resources: [],
                  }
                },
              })
              .mockReturnValue({
                fetchAll: jest
                  .fn()
                  .mockRejectedValue('Database error occurred.'),
              }),
          },
        }

        const loader = loadSummaryByDate(mockedContainer)

        try {
          await loader({
            domain: 'domain.ca',
            startDate: '2021-01-01',
          })
        } catch (err) {
          expect(err).toEqual(new Error('Database error occurred.'))
        }
      })
    })
    describe('when retrieving spf failure data', () => {
      it('throws an error', async () => {
        const mockedContainer = {
          items: {
            query: jest
              .fn()
              .mockReturnValueOnce({
                fetchAll() {
                  return {
                    resources: [],
                  }
                },
              })
              .mockReturnValueOnce({
                fetchAll() {
                  return {
                    resources: [],
                  }
                },
              })
              .mockReturnValueOnce({
                fetchAll() {
                  return {
                    resources: [],
                  }
                },
              })
              .mockReturnValueOnce({
                fetchAll() {
                  return {
                    resources: [],
                  }
                },
              })
              .mockReturnValue({
                fetchAll: jest
                  .fn()
                  .mockRejectedValue('Database error occurred.'),
              }),
          },
        }

        const loader = loadSummaryByDate(mockedContainer)

        try {
          await loader({
            domain: 'domain.ca',
            startDate: '2021-01-01',
          })
        } catch (err) {
          expect(err).toEqual(new Error('Database error occurred.'))
        }
      })
    })
  })
})
