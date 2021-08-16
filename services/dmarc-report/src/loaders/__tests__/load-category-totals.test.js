const { loadCategoryTotals } = require('../load-category-totals')

describe('given the loadCategoryTotals function', () => {
  describe('given a successful load', () => {
    describe('category totals is undefined', () => {
      it('returns an object with values set to zero', async () => {
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

        const loader = loadCategoryTotals({ container: mockedContainer })

        const categoryTotals = await loader({
          domain: 'domain.ca',
          date: '2021-01-01',
        })

        const expectedResult = {
          pass: 0,
          fail: 0,
          passDkimOnly: 0,
          passSpfOnly: 0,
        }

        expect(categoryTotals).toEqual(expectedResult)
      })
    })
    describe('category totals is defined', () => {
      it('returns the proper category totals', async () => {
        const mockedContainer = {
          items: {
            query: jest.fn().mockReturnValueOnce({
              fetchAll() {
                return {
                  resources: [
                    { pass: 1, fail: 2, passDkimOnly: 3, passSpfOnly: 4 },
                  ],
                }
              },
            }),
          },
        }

        const loader = loadCategoryTotals({ container: mockedContainer })

        const categoryTotals = await loader({
          domain: 'domain.ca',
          date: '2021-01-01',
        })

        const expectedResult = {
          pass: 1,
          fail: 2,
          passDkimOnly: 3,
          passSpfOnly: 4,
        }

        expect(categoryTotals).toEqual(expectedResult)
      })
    })
  })
  describe('given an unsuccessful load', () => {
    it('throws an error', async () => {
      const mockedContainer = {
        items: {
          query() {
            return {
              fetchAll: jest.fn().mockRejectedValue('Database error occurred.'),
            }
          },
        },
      }

      const loader = loadCategoryTotals({ container: mockedContainer })

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
