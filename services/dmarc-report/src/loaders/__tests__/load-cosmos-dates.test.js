const { loadCosmosDates } = require('../load-cosmos-dates')

describe('given the loadCosmosDates function', () => {
  it('returns a list of dates', async () => {
    const mockedContainer = {
      items: {
        query: jest.fn().mockReturnValue({
          fetchAll: jest.fn().mockResolvedValue({
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
          }),
        }),
      },
    }

    const cosmosDates = await loadCosmosDates({
      container: mockedContainer,
    })

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
