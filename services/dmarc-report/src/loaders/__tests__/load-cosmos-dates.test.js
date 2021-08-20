const { loadCosmosDates } = require('../load-cosmos-dates')

describe('given the loadCosmosDates function', () => {
  it('returns a list of dkim failures', async () => {
    const mockedContainer = {
      items: {
        query: jest.fn().mockReturnValue({
          fetchAll() {
            return {
              resources: [
                '2020-01-01',
                '2020-02-01',
                '2020-03-01',
                '2020-04-01',
                '2020-05-01',
                '2020-06-01',
                '2020-07-01',
                '2020-08-01',
                '2020-09-01',
                '2020-10-01',
                '2020-11-01',
                '2020-12-01',
                '2021-01-01',
              ],
            }
          },
        }),
      },
    }

    const loader = loadCosmosDates({
      container: mockedContainer,
    })

    const cosmosDates = await loader()

    const expectedDates = [
      '2020-01-01',
      '2020-02-01',
      '2020-03-01',
      '2020-04-01',
      '2020-05-01',
      '2020-06-01',
      '2020-07-01',
      '2020-08-01',
      '2020-09-01',
      '2020-10-01',
      '2020-11-01',
      '2020-12-01',
      '2021-01-01',
    ]

    expect(cosmosDates).toEqual(expectedDates)
  })
})
