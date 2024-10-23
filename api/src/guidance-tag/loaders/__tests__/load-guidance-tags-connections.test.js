const { loadGuidanceTagSummaryConnectionsByTagId } = require('../load-guidance-tags-connections')

describe('loadGuidanceTagSummaryConnectionsByTagId', () => {
  let query, userKey, cleanseInput, i18n, language

  beforeEach(() => {
    query = jest.fn()
    userKey = '1'
    cleanseInput = jest.fn((input) => input)
    i18n = {
      _: jest.fn((msg) => msg),
    }
    language = 'en'
  })

  it('successfully retrieves data', async () => {
    const guidanceTags = { tag1: 3, tag2: 5 }
    const orderBy = { field: 'tag-id', direction: 'ASC' }

    query.mockResolvedValueOnce({
      next: jest.fn().mockResolvedValueOnce({
        guidanceTags: [
          { _key: '1', tagName: 'Tag 1' },
          { _key: '2', tagName: 'Tag 2' },
        ],
        totalCount: 2,
      }),
    })

    const loader = loadGuidanceTagSummaryConnectionsByTagId({
      query,
      userKey,
      cleanseInput,
      i18n,
      language,
    })

    const result = await loader({ guidanceTags, orderBy })
    expect(result).toEqual({
      guidanceTags: [
        { _key: '1', tagName: 'Tag 1' },
        { _key: '2', tagName: 'Tag 2' },
      ],
      totalCount: 2,
    })
  })

  it('throws an error if there is a database error', async () => {
    query.mockRejectedValueOnce(new Error('Database error'))

    const loader = loadGuidanceTagSummaryConnectionsByTagId({
      query,
      userKey,
      cleanseInput,
      i18n,
      language,
    })

    await expect(loader({ guidanceTags: {} })).rejects.toThrow('Unable to load guidance tag(s). Please try again.')
  })

  it('throws an error if there is a cursor error', async () => {
    query.mockResolvedValueOnce({
      next: jest.fn().mockRejectedValueOnce(new Error('Cursor error')),
    })

    const loader = loadGuidanceTagSummaryConnectionsByTagId({
      query,
      userKey,
      cleanseInput,
      i18n,
      language,
    })

    await expect(loader({ guidanceTags: {} })).rejects.toThrow('Unable to load guidance tag(s). Please try again.')
  })
})
