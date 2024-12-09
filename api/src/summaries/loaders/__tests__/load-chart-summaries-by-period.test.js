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

  it('throws an error if period is not provided', async () => {
    const loader = loadChartSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    await expect(loader({ year: '2023' })).rejects.toThrow(
      'You must provide a `period` value to access the `ChartSummaries` connection.',
    )
  })

  it('throws an error if year is not provided', async () => {
    const loader = loadChartSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    await expect(loader({ period: 'january' })).rejects.toThrow(
      'You must provide a `year` value to access the `ChartSummaries` connection.',
    )
  })

  it('calculates the correct startDate for period "thirtyDays"', async () => {
    query.mockResolvedValue({
      next: jest.fn().mockResolvedValue([]),
    })
    const loader = loadChartSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    const period = 'thirtyDays'
    const year = '2023'
    await loader({ period, year })
    const expectedDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
    expect(query).toHaveBeenCalledWith(expect.any(Array), expect.stringContaining(expectedDate))
  })

  it('calculates the correct startDate for period "lastYear"', async () => {
    query.mockResolvedValue({
      next: jest.fn().mockResolvedValue([]),
    })
    const loader = loadChartSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    const period = 'lastYear'
    const year = '2023'
    await loader({ period, year })
    const expectedDate = new Date(new Date().setDate(new Date().getDate() - 365)).toISOString().split('T')[0]
    expect(query).toHaveBeenCalledWith(expect.any(Array), expect.stringContaining(expectedDate))
  })

  it('calculates the correct startDate for period "yearToDate"', async () => {
    query.mockResolvedValue({
      next: jest.fn().mockResolvedValue([]),
    })
    const loader = loadChartSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    const period = 'yearToDate'
    const year = '2023'
    await loader({ period, year })
    const expectedDate = new Date('2023-01-01').toISOString().split('T')[0]
    expect(query).toHaveBeenCalledWith(expect.any(Array), expect.stringContaining(expectedDate))
  })

  it('calculates the correct startDate for a specific month', async () => {
    query.mockResolvedValue({
      next: jest.fn().mockResolvedValue([]),
    })
    const loader = loadChartSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    const period = 'january'
    const year = '2023'
    await loader({ period, year })
    const expectedDate = new Date('2023-01-01').toISOString().split('T')[0]
    expect(query).toHaveBeenCalledWith(expect.any(Array), expect.stringContaining(expectedDate))
  })

  it('handles database query errors', async () => {
    query.mockRejectedValue(new Error('Database error'))
    const loader = loadChartSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    await expect(loader({ period: 'january', year: '2023' })).rejects.toThrow(
      'Unable to load chart summary data. Please try again.',
    )
  })

  it('handles cursor errors', async () => {
    query.mockResolvedValue({
      next: jest.fn().mockRejectedValue(new Error('Cursor error')),
    })
    const loader = loadChartSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    await expect(loader({ period: 'january', year: '2023' })).rejects.toThrow(
      'Unable to load chart summary data. Please try again.',
    )
  })

  it('returns empty result if no summaries are found', async () => {
    query.mockResolvedValue({
      next: jest.fn().mockResolvedValue([]),
    })
    const loader = loadChartSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    const result = await loader({ period: 'january', year: '2023' })
    expect(result).toEqual([])
  })

  it('returns summaries if found', async () => {
    const summaries = [{ id: 1, date: '2023-01-01' }]
    query.mockResolvedValue({
      next: jest.fn().mockResolvedValue(summaries),
    })
    const loader = loadChartSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    const result = await loader({ period: 'january', year: '2023' })
    expect(result).toEqual(summaries)
  })
})
