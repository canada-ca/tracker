import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'

const { setupI18n } = require('@lingui/core')

describe('loadAdditionalFindingsByDomainId', () => {
  const i18n = setupI18n({
    locale: 'en',
    localeData: {
      en: {},
      fr: {},
    },
    locales: ['en', 'fr'],
    messages: {
      en: englishMessages.messages,
      fr: frenchMessages.messages,
    },
  })

  it('throws an error when domainId is not provided', async () => {
    const loadAdditionalFindingsByDomainId =
      require('../load-additional-findings-by-domain-id').loadAdditionalFindingsByDomainId
    const func = loadAdditionalFindingsByDomainId({
      query: jest.fn(),
      userKey: 'userKey',
      cleanseInput: jest.fn((input) => input),
      i18n,
    })

    await expect(func({ limit: 10 })).rejects.toThrow(
      "You must provide a `domainId` to retrieve a domain's additional findings.",
    )
  })

  it('throws an error when limit is not provided', async () => {
    const loadAdditionalFindingsByDomainId =
      require('../load-additional-findings-by-domain-id').loadAdditionalFindingsByDomainId
    const func = loadAdditionalFindingsByDomainId({
      query: jest.fn(),
      userKey: 'userKey',
      cleanseInput: jest.fn((input) => input),
      i18n,
    })

    await expect(func({ domainId: 'domainId' })).rejects.toThrow(
      'You must provide a `limit` value to properly paginate additional findings.',
    )
  })

  it('throws an error when a database error occurs', async () => {
    const query = jest.fn(() => {
      throw new Error()
    })
    const loadAdditionalFindingsByDomainId =
      require('../load-additional-findings-by-domain-id').loadAdditionalFindingsByDomainId
    const func = loadAdditionalFindingsByDomainId({
      query,
      userKey: 'userKey',
      cleanseInput: jest.fn((input) => input),
      i18n,
    })

    await expect(func({ domainId: 'domainId', limit: 10 })).rejects.toThrow(
      'Unable to load additional findings. Please try again.',
    )
  })

  it('throws an error when a cursor error occurs', async () => {
    const cursor = {
      next: jest.fn(() => {
        throw new Error()
      }),
    }
    const query = jest.fn(() => cursor)
    const loadAdditionalFindingsByDomainId =
      require('../load-additional-findings-by-domain-id').loadAdditionalFindingsByDomainId
    const func = loadAdditionalFindingsByDomainId({
      query,
      userKey: 'userKey',
      cleanseInput: jest.fn((input) => input),
      i18n,
    })

    await expect(func({ domainId: 'domainId', limit: 10 })).rejects.toThrow(
      'Unable to load additional findings. Please try again.',
    )
  })

  it('returns a connection when everything is correct', async () => {
    const finding = { _key: '1', source: 'scanner-a' }
    const cursor = {
      next: jest.fn(() => ({
        findings: [finding],
        totalCount: 1,
        hasMoreRelayPage: false,
        hasReversePage: false,
      })),
    }
    const query = jest.fn(() => cursor)
    const loadAdditionalFindingsByDomainId =
      require('../load-additional-findings-by-domain-id').loadAdditionalFindingsByDomainId
    const func = loadAdditionalFindingsByDomainId({
      query,
      userKey: 'userKey',
      cleanseInput: jest.fn((input) => input),
      i18n,
    })

    const result = await func({ domainId: 'domainId', limit: 10 })

    expect(result.totalCount).toEqual(1)
    expect(result.edges).toHaveLength(1)
    expect(result.edges[0].node).toEqual(finding)
    expect(result.pageInfo).toEqual({
      hasPreviousPage: false,
      hasNextPage: false,
      startCursor: result.edges[0].cursor,
      endCursor: result.edges[0].cursor,
    })
  })

  it('returns an empty connection when there are no findings', async () => {
    const cursor = {
      next: jest.fn(() => ({
        findings: [],
        totalCount: 0,
        hasMoreRelayPage: false,
        hasReversePage: false,
      })),
    }
    const query = jest.fn(() => cursor)
    const loadAdditionalFindingsByDomainId =
      require('../load-additional-findings-by-domain-id').loadAdditionalFindingsByDomainId
    const func = loadAdditionalFindingsByDomainId({
      query,
      userKey: 'userKey',
      cleanseInput: jest.fn((input) => input),
      i18n,
    })

    const result = await func({ domainId: 'domainId', limit: 10 })

    expect(result).toEqual({
      edges: [],
      totalCount: 0,
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: false,
        startCursor: null,
        endCursor: null,
      },
    })
  })

  it('accepts AND filters and orderBy arguments', async () => {
    const cursor = {
      next: jest.fn(() => ({
        findings: [{ _key: '2', source: 'scanner-b', severity: 'high' }],
        totalCount: 1,
        hasMoreRelayPage: false,
        hasReversePage: false,
      })),
    }
    const query = jest.fn(() => cursor)
    const loadAdditionalFindingsByDomainId =
      require('../load-additional-findings-by-domain-id').loadAdditionalFindingsByDomainId
    const func = loadAdditionalFindingsByDomainId({
      query,
      userKey: 'userKey',
      cleanseInput: jest.fn((input) => input),
      i18n,
    })

    const result = await func({
      domainId: 'domainId',
      limit: 10,
      orderBy: { field: 'severity', direction: 'DESC' },
      filters: [
        { filterCategory: 'source', comparison: '==', filterValue: 'scanner-b' },
        { filterCategory: 'severity', comparison: '==', filterValue: 'high' },
      ],
    })

    expect(query).toHaveBeenCalled()
    expect(result.edges).toHaveLength(1)
  })
})
