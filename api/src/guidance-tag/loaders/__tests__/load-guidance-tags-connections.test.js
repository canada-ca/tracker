const { loadGuidanceTagSummaryConnectionsByTagId } = require('../load-guidance-tags-connections')
const { toGlobalId } = require('graphql-relay')

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
    const after = toGlobalId('guidanceTag', 'tag1')
    const before = toGlobalId('guidanceTag', 'tag2')
    const first = 1
    const orderBy = { field: 'tag-id', direction: 'ASC' }

    query.mockResolvedValueOnce({
      next: jest.fn().mockResolvedValueOnce({
        guidanceTags: [
          { _key: '1', tagName: 'Tag 1' },
          { _key: '2', tagName: 'Tag 2' },
        ],
        totalCount: 2,
        hasNextPage: false,
        hasPreviousPage: false,
        startKey: '1',
        endKey: '2',
      }),
    })

    const loader = loadGuidanceTagSummaryConnectionsByTagId({
      query,
      userKey,
      cleanseInput,
      i18n,
      language,
    })

    const result = await loader({
      guidanceTags,
      after,
      before,
      first,
      orderBy,
    })

    expect(result).toEqual({
      edges: [
        { cursor: toGlobalId('guidanceTag', '1'), node: { _key: '1', tagName: 'Tag 1' } },
        { cursor: toGlobalId('guidanceTag', '2'), node: { _key: '2', tagName: 'Tag 2' } },
      ],
      totalCount: 2,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: toGlobalId('guidanceTag', '1'),
        endCursor: toGlobalId('guidanceTag', '2'),
      },
    })
  })

  it('throws an error if neither first nor last is provided', async () => {
    const loader = loadGuidanceTagSummaryConnectionsByTagId({
      query,
      userKey,
      cleanseInput,
      i18n,
      language,
    })

    await expect(loader({ guidanceTags: {} })).rejects.toThrow(
      'You must provide a `first` or `last` value to properly paginate the `GuidanceTag` connection.',
    )
  })

  it('throws an error if both first and last are provided', async () => {
    const loader = loadGuidanceTagSummaryConnectionsByTagId({
      query,
      userKey,
      cleanseInput,
      i18n,
      language,
    })

    await expect(loader({ guidanceTags: {}, first: 1, last: 1 })).rejects.toThrow(
      'Passing both `first` and `last` to paginate the `GuidanceTag` connection is not supported.',
    )
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

    await expect(loader({ guidanceTags: {}, first: 1 })).rejects.toThrow(
      'Unable to load guidance tag(s). Please try again.',
    )
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

    await expect(loader({ guidanceTags: {}, first: 1 })).rejects.toThrow(
      'Unable to load guidance tag(s). Please try again.',
    )
  })
})
