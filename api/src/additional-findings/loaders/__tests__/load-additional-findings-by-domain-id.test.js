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
    const func = loadAdditionalFindingsByDomainId({ query: jest.fn(), userKey: 'userKey', i18n })

    await expect(func({})).rejects.toThrow("You must provide a `domainId` to retrieve a domain's additional findings.")
  })

  it('throws an error when a database error occurs', async () => {
    const query = jest.fn(() => {
      throw new Error()
    })
    const loadAdditionalFindingsByDomainId =
      require('../load-additional-findings-by-domain-id').loadAdditionalFindingsByDomainId
    const func = loadAdditionalFindingsByDomainId({ query, userKey: 'userKey', i18n })

    await expect(func({ domainId: 'domainId' })).rejects.toThrow(
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
    const func = loadAdditionalFindingsByDomainId({ query, userKey: 'userKey', i18n })

    await expect(func({ domainId: 'domainId' })).rejects.toThrow(
      'Unable to load additional findings. Please try again.',
    )
  })

  it('returns the finding when everything is correct', async () => {
    const finding = { id: 'findingId' }
    const cursor = { next: jest.fn(() => finding) }
    const query = jest.fn(() => cursor)
    const loadAdditionalFindingsByDomainId =
      require('../load-additional-findings-by-domain-id').loadAdditionalFindingsByDomainId
    const func = loadAdditionalFindingsByDomainId({ query, userKey: 'userKey', i18n })

    const result = await func({ domainId: 'domainId' })

    expect(result).toEqual(finding)
  })
})
