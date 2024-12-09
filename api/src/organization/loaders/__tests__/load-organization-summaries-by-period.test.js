import { loadOrganizationSummariesByPeriod } from '../load-organization-summaries-by-period'
import { createI18n } from '../../../create-i18n'

describe('loadOrganizationSummariesByPeriod', () => {
  let query, userKey, cleanseInput

  const i18n = createI18n('en')

  beforeEach(() => {
    query = jest.fn()
    userKey = '1'
    cleanseInput = jest.fn((input) => input)
  })

  it('throws an error if period is not provided', async () => {
    const loader = loadOrganizationSummariesByPeriod({ query, userKey, cleanseInput, i18n })

    await expect(loader({ orgId: 'org1', year: '2023', sortDirection: 'ASC' })).rejects.toThrow(
      'You must provide a `period` value to access the `OrganizationSummaries` connection.',
    )
  })

  it('throws an error if year is not provided', async () => {
    const loader = loadOrganizationSummariesByPeriod({ query, userKey, cleanseInput, i18n })

    await expect(loader({ orgId: 'org1', period: 'january', sortDirection: 'ASC' })).rejects.toThrow(
      'You must provide a `year` value to access the `OrganizationSummaries` connection.',
    )
  })

  it('returns summaries for a given period and year', async () => {
    const loader = loadOrganizationSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    const mockSummaries = [
      { _key: '1', date: '2023-01-01' },
      { _key: '2', date: '2023-01-02' },
    ]
    query.mockResolvedValueOnce({
      next: jest.fn().mockResolvedValueOnce(mockSummaries),
    })

    const result = await loader({ orgId: 'org1', period: 'january', year: '2023', sortDirection: 'ASC' })

    expect(result).toEqual(mockSummaries)
  })

  it('handles database errors gracefully', async () => {
    const loader = loadOrganizationSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    query.mockRejectedValueOnce(new Error('Database error'))

    await expect(loader({ orgId: 'org1', period: 'january', year: '2023', sortDirection: 'ASC' })).rejects.toThrow(
      'Unable to load organization summary data. Please try again.',
    )
  })

  it('handles cursor errors gracefully', async () => {
    const loader = loadOrganizationSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    query.mockResolvedValueOnce({
      next: jest.fn().mockRejectedValueOnce(new Error('Cursor error')),
    })

    await expect(loader({ orgId: 'org1', period: 'january', year: '2023', sortDirection: 'ASC' })).rejects.toThrow(
      'Unable to load organization summary data. Please try again.',
    )
  })
})
