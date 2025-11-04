import { loadChartSummariesByPeriod } from '../load-chart-summaries-by-period'
import { createI18n } from '../../../create-i18n'

describe('loadChartSummariesByPeriod', () => {
  let query, userKey, cleanseInput

  const i18n = createI18n('en')

  beforeEach(() => {
    query = jest.fn()
    userKey = 'test-user'
    cleanseInput = jest.fn((input) => input)
  })

  it('throws an error if startDate or endDate is not provided', async () => {
    const loader = loadChartSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    await expect(loader({ startDate: undefined, endDate: '2023-01-31' })).rejects.toThrow(
      'You must provide both `startDate` and `endDate` values to access the `ChartSummaries` connection.',
    )
    await expect(loader({ startDate: '2023-01-01', endDate: undefined })).rejects.toThrow(
      'You must provide both `startDate` and `endDate` values to access the `ChartSummaries` connection.',
    )
  })

  it('handles database query errors', async () => {
    query.mockRejectedValue(new Error('Database error'))
    const loader = loadChartSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    await expect(loader({ startDate: '2023-01-01', endDate: '2023-01-31', sortDirection: 'ASC' })).rejects.toThrow(
      'Unable to load chart summary data. Please try again.',
    )
  })

  it('handles cursor errors', async () => {
    query.mockResolvedValue({
      next: jest.fn().mockRejectedValue(new Error('Cursor error')),
    })
    const loader = loadChartSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    await expect(loader({ startDate: '2023-01-01', endDate: '2023-01-31', sortDirection: 'ASC' })).rejects.toThrow(
      'Unable to load chart summary data. Please try again.',
    )
  })

  it('returns empty result if no summaries are found', async () => {
    query.mockResolvedValue({
      next: jest.fn().mockResolvedValue([]),
    })
    const loader = loadChartSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    const result = await loader({ startDate: '2023-01-01', endDate: '2023-01-31', sortDirection: 'ASC' })
    expect(result).toEqual([])
  })

  it('returns summaries if found', async () => {
    const summaries = [{ id: 1, date: '2023-01-01' }]
    query.mockResolvedValue({
      next: jest.fn().mockResolvedValue(summaries),
    })
    const loader = loadChartSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    const result = await loader({ startDate: '2023-01-01', endDate: '2023-01-31', sortDirection: 'ASC' })
    expect(result).toEqual(summaries)
  })
})
