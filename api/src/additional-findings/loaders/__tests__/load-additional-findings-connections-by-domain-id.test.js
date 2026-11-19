import { dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import { ensureDatabase as ensure } from '../../../testUtilities'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput } from '../../../validators'
import { loadAdditionalFindingsConnectionsByDomainId } from '../index'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

const DOMAIN_ID = 'domains/1'
const OTHER_DOMAIN_ID = 'domains/2'

const encodeCursor = (value) => Buffer.from(value, 'utf8').toString('base64')

describe('given the loadAdditionalFindingsConnectionsByDomainId loader', () => {
  let query, drop, truncate, collections, i18n

  const consoleOutput = []
  const mockedConsole = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.error = mockedConsole
    console.warn = mockedConsole
    ;({ query, drop, truncate, collections } = await ensure({
      variables: {
        dbname: dbNameFromFile(__filename),
        username: 'root',
        rootPassword: rootPass,
        password: rootPass,
        url,
      },
      schema: dbschema,
    }))
    i18n = setupI18n({
      locale: 'en',
      localeData: { en: { plurals: {} }, fr: { plurals: {} } },
      locales: ['en', 'fr'],
      messages: { en: englishMessages.messages, fr: frenchMessages.messages },
    })
  })

  beforeEach(() => {
    consoleOutput.length = 0
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  const buildLoader = (overrides = {}) =>
    loadAdditionalFindingsConnectionsByDomainId({
      query,
      userKey: '1',
      cleanseInput,
      i18n,
      ...overrides,
    })

  const saveFinding = (overrides) =>
    collections.additionalFindings.save({
      domain: DOMAIN_ID,
      status: 'active',
      subject: 'sub.example.ca',
      source: 'dns',
      findingType: 'dangling-cname',
      confidence: 'confirmed',
      reasonCode: 'NXDOMAIN',
      firstSeen: '2024-01-01T00:00:00.000Z',
      lastSeen: '2024-01-01T00:00:00.000Z',
      occurrenceCount: 1,
      ...overrides,
    })

  const keysOf = (connection) => connection.edges.map(({ node }) => node._key)

  /**
   * Distinct sort values on every field:
   *   key | lastSeen | firstSeen | confidence
   *   f1  | 01-05    | 01-01     | confirmed
   *   f2  | 01-04    | 01-02     | probable
   *   f3  | 01-03    | 01-03     | suspected
   *   f4  | 01-02    | 01-04     | (none)
   * plus a resolved finding and a finding on another domain that must never appear.
   */
  const seedDistinctFindings = async () => {
    await saveFinding({
      _key: 'f1',
      lastSeen: '2024-01-05T00:00:00.000Z',
      firstSeen: '2024-01-01T00:00:00.000Z',
      confidence: 'confirmed',
    })
    await saveFinding({
      _key: 'f2',
      lastSeen: '2024-01-04T00:00:00.000Z',
      firstSeen: '2024-01-02T00:00:00.000Z',
      confidence: 'probable',
    })
    await saveFinding({
      _key: 'f3',
      lastSeen: '2024-01-03T00:00:00.000Z',
      firstSeen: '2024-01-03T00:00:00.000Z',
      confidence: 'suspected',
    })
    await saveFinding({
      _key: 'f4',
      lastSeen: '2024-01-02T00:00:00.000Z',
      firstSeen: '2024-01-04T00:00:00.000Z',
      confidence: undefined,
    })
    await saveFinding({ _key: 'resolved', status: 'resolved', lastSeen: '2024-02-01T00:00:00.000Z' })
    await saveFinding({ _key: 'other', domain: OTHER_DOMAIN_ID, lastSeen: '2024-02-02T00:00:00.000Z' })
  }

  describe('filtering', () => {
    it('returns only active findings of the requested domain', async () => {
      await seedDistinctFindings()

      const connection = await buildLoader()({ domainId: DOMAIN_ID, first: 10 })

      expect(keysOf(connection).sort()).toEqual(['f1', 'f2', 'f3', 'f4'])
      expect(connection.totalCount).toBe(4)
    })

    it('returns an empty connection with null cursors when the domain has no findings', async () => {
      const connection = await buildLoader()({ domainId: DOMAIN_ID, first: 10 })

      expect(connection).toEqual({
        edges: [],
        totalCount: 0,
        pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
      })
    })

    it('exposes the stored finding on each node with a string id', async () => {
      await saveFinding({ _key: 'f1', subject: 'a.example.ca', evidence: { target: 'x.example.net' } })

      const connection = await buildLoader()({ domainId: DOMAIN_ID, first: 1 })

      expect(connection.edges[0].node).toMatchObject({
        id: 'f1',
        subject: 'a.example.ca',
        evidence: { target: 'x.example.net' },
      })
    })
  })

  describe('ordering', () => {
    const cases = [
      { name: 'defaults to lastSeen DESC', orderBy: undefined, expected: ['f1', 'f2', 'f3', 'f4'] },
      { name: 'lastSeen ASC', orderBy: { field: 'lastSeen', direction: 'ASC' }, expected: ['f4', 'f3', 'f2', 'f1'] },
      { name: 'lastSeen DESC', orderBy: { field: 'lastSeen', direction: 'DESC' }, expected: ['f1', 'f2', 'f3', 'f4'] },
      { name: 'firstSeen ASC', orderBy: { field: 'firstSeen', direction: 'ASC' }, expected: ['f1', 'f2', 'f3', 'f4'] },
      {
        name: 'firstSeen DESC',
        orderBy: { field: 'firstSeen', direction: 'DESC' },
        expected: ['f4', 'f3', 'f2', 'f1'],
      },
      {
        name: 'confidence ASC puts unknown lowest then suspected < probable < confirmed',
        orderBy: { field: 'confidence', direction: 'ASC' },
        expected: ['f4', 'f3', 'f2', 'f1'],
      },
      {
        name: 'confidence DESC puts confirmed first and unknown last',
        orderBy: { field: 'confidence', direction: 'DESC' },
        expected: ['f1', 'f2', 'f3', 'f4'],
      },
    ]

    it.each(cases)('$name', async ({ orderBy, expected }) => {
      await seedDistinctFindings()

      const connection = await buildLoader()({ domainId: DOMAIN_ID, first: 10, orderBy })

      expect(keysOf(connection)).toEqual(expected)
    })

    it.each([
      { direction: 'ASC', expected: ['k1', 'k2', 'k3'] },
      { direction: 'DESC', expected: ['k3', 'k2', 'k1'] },
    ])('breaks ties on _key when sort values are equal ($direction)', async ({ direction, expected }) => {
      await saveFinding({ _key: 'k2' })
      await saveFinding({ _key: 'k3' })
      await saveFinding({ _key: 'k1' })

      const connection = await buildLoader()({
        domainId: DOMAIN_ID,
        first: 10,
        orderBy: { field: 'lastSeen', direction },
      })

      expect(keysOf(connection)).toEqual(expected)
    })

    it('treats an unrecognised confidence value as lowest', async () => {
      await saveFinding({ _key: 'low', confidence: 'bogus' })
      await saveFinding({ _key: 'high', confidence: 'suspected' })

      const connection = await buildLoader()({
        domainId: DOMAIN_ID,
        first: 10,
        orderBy: { field: 'confidence', direction: 'DESC' },
      })

      expect(keysOf(connection)).toEqual(['high', 'low'])
    })
  })

  describe('pagination', () => {
    const seedSevenTiedFindings = async () => {
      for (const n of [1, 2, 3, 4, 5, 6, 7]) {
        // identical lastSeen so every page boundary falls on the _key tiebreaker
        await saveFinding({ _key: `k${n}` })
      }
    }

    it('walks forward through every finding exactly once with first/after', async () => {
      await seedSevenTiedFindings()
      const loader = buildLoader()
      const seen = []
      const pageInfos = []
      let after

      for (let guard = 0; guard < 10; guard++) {
        const connection = await loader({ domainId: DOMAIN_ID, first: 3, after })
        seen.push(...keysOf(connection))
        pageInfos.push(connection.pageInfo)
        expect(connection.totalCount).toBe(7)
        if (!connection.pageInfo.hasNextPage) break
        after = connection.pageInfo.endCursor
      }

      expect(seen).toEqual(['k7', 'k6', 'k5', 'k4', 'k3', 'k2', 'k1'])
      expect(pageInfos.map(({ hasNextPage, hasPreviousPage }) => ({ hasNextPage, hasPreviousPage }))).toEqual([
        { hasNextPage: true, hasPreviousPage: false },
        { hasNextPage: true, hasPreviousPage: true },
        { hasNextPage: false, hasPreviousPage: true },
      ])
    })

    it('walks backward through every finding exactly once with last/before', async () => {
      await seedSevenTiedFindings()
      const loader = buildLoader()
      const everything = await loader({ domainId: DOMAIN_ID, first: 7 })
      const seen = []
      const pageInfos = []
      // paging before the last finding (k1) yields every other finding
      let before = everything.pageInfo.endCursor

      for (let guard = 0; guard < 10; guard++) {
        const connection = await loader({ domainId: DOMAIN_ID, last: 3, before })
        seen.unshift(...keysOf(connection))
        pageInfos.push(connection.pageInfo)
        if (!connection.pageInfo.hasPreviousPage) break
        before = connection.pageInfo.startCursor
      }

      expect(seen).toEqual(['k7', 'k6', 'k5', 'k4', 'k3', 'k2'])
      expect(pageInfos.map(({ hasPreviousPage }) => hasPreviousPage)).toEqual([true, false])
    })

    it('treats limit as the page size', async () => {
      await seedSevenTiedFindings()

      const connection = await buildLoader()({ domainId: DOMAIN_ID, limit: 2 })

      expect(keysOf(connection)).toEqual(['k7', 'k6'])
      expect(connection.pageInfo.hasNextPage).toBe(true)
      expect(connection.totalCount).toBe(7)
    })

    it('accepts the boundary page sizes 1 and 100', async () => {
      await seedSevenTiedFindings()
      const loader = buildLoader()

      const one = await loader({ domainId: DOMAIN_ID, first: 1 })
      const hundred = await loader({ domainId: DOMAIN_ID, first: 100 })

      expect(keysOf(one)).toEqual(['k7'])
      expect(keysOf(hundred)).toHaveLength(7)
      expect(hundred.pageInfo.hasNextPage).toBe(false)
    })

    it('paginates without duplicates or skips when ordering by confidence ascending', async () => {
      await seedDistinctFindings()
      const loader = buildLoader()
      const orderBy = { field: 'confidence', direction: 'ASC' }

      const pageOne = await loader({ domainId: DOMAIN_ID, first: 2, orderBy })
      const pageTwo = await loader({
        domainId: DOMAIN_ID,
        first: 2,
        orderBy,
        after: pageOne.pageInfo.endCursor,
      })

      expect([...keysOf(pageOne), ...keysOf(pageTwo)]).toEqual(['f4', 'f3', 'f2', 'f1'])
      expect(pageTwo.pageInfo).toMatchObject({ hasNextPage: false, hasPreviousPage: true })
    })

    it('returns a cursor that a following page can resume from', async () => {
      await seedSevenTiedFindings()
      const loader = buildLoader()

      const first = await loader({ domainId: DOMAIN_ID, first: 2 })
      const second = await loader({ domainId: DOMAIN_ID, first: 2, after: first.edges[0].cursor })

      expect(keysOf(second)).toEqual(['k6', 'k5'])
    })
  })

  describe('error handling', () => {
    const englishErrorCases = [
      {
        name: 'missing domainId',
        args: { first: 5 },
        message: "You must provide a `domainId` to retrieve a domain's additional findings.",
      },
      {
        name: 'no page size',
        args: { domainId: DOMAIN_ID },
        message:
          'You must provide a `first`, `last` or `limit` value to properly paginate the `AdditionalFinding` connection.',
      },
      {
        name: 'page size 0',
        args: { domainId: DOMAIN_ID, first: 0 },
        message:
          'You must provide a `first`, `last` or `limit` value in the range of 1-100 to properly paginate the `AdditionalFinding` connection.',
      },
      {
        name: 'page size 101',
        args: { domainId: DOMAIN_ID, limit: 101 },
        message:
          'You must provide a `first`, `last` or `limit` value in the range of 1-100 to properly paginate the `AdditionalFinding` connection.',
      },
      {
        name: 'both first and last',
        args: { domainId: DOMAIN_ID, first: 1, last: 1 },
        message: 'Passing both `first` and `last` to paginate the `AdditionalFinding` connection is not supported.',
      },
      {
        name: 'both after and before',
        args: { domainId: DOMAIN_ID, first: 1, after: 'YQ==', before: 'Yg==' },
        message:
          'You must provide at most one pagination method (`before`, `after`) value to properly paginate the `AdditionalFinding` connection.',
      },
      {
        name: 'cursor that is not base64 JSON',
        args: { domainId: DOMAIN_ID, first: 1, after: 'not-a-cursor' },
        message: 'Unable to load additional findings. Please try again.',
      },
      {
        name: 'cursor with the wrong shape',
        args: { domainId: DOMAIN_ID, first: 1, after: encodeCursor('{"a":1}') },
        message: 'Unable to load additional findings. Please try again.',
      },
      {
        name: 'cursor whose key is not a string',
        args: { domainId: DOMAIN_ID, first: 1, before: encodeCursor('["2024-01-01",5]') },
        message: 'Unable to load additional findings. Please try again.',
      },
    ]

    it.each(englishErrorCases)('rejects with $message for $name', async ({ args, message }) => {
      const failingQuery = jest.fn()

      await expect(buildLoader({ query: failingQuery })(args)).rejects.toEqual(new Error(message))

      expect(failingQuery).not.toHaveBeenCalled()
    })

    it('reports a friendly error and logs when the database query fails', async () => {
      const query = jest.fn().mockRejectedValue(new Error('Database error occurred.'))

      await expect(buildLoader({ query })({ domainId: DOMAIN_ID, first: 5 })).rejects.toEqual(
        new Error('Unable to load additional findings. Please try again.'),
      )

      expect(consoleOutput).toEqual([
        `Database error occurred while user: 1 was trying to get additional findings for domain '${DOMAIN_ID}' with cursor 'undefined', error: Error: Database error occurred.`,
      ])
    })

    it('reports a friendly error and logs when reading the cursor fails', async () => {
      const cursor = {
        next() {
          throw new Error('Cursor error occurred.')
        },
      }
      const query = jest.fn().mockReturnValueOnce(cursor)

      await expect(buildLoader({ query })({ domainId: DOMAIN_ID, first: 5 })).rejects.toEqual(
        new Error('Unable to load additional findings. Please try again.'),
      )

      expect(consoleOutput).toEqual([
        `Cursor error occurred while user: 1 was trying to get additional findings for domain '${DOMAIN_ID}', error: Error: Cursor error occurred.`,
      ])
    })
  })
})
