require('dotenv-safe').config({
  allowEmptyValues: true,
})

const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { toGlobalId } = require('graphql-relay')
const { makeMigrations } = require('../../migrations')
const { cleanseInput } = require('../validators')
const { spfLoaderConnectionsByDomainId, spfLoaderByKey } = require('../loaders')

describe('when given the load spf connection function', () => {
  let query, drop, truncate, migrate, collections, user, domain

  const consoleWarnOutput = []
  const mockedWarn = (output) => consoleWarnOutput.push(output)

  const consoleErrorOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)

  beforeAll(async () => {
    console.warn = mockedWarn
    console.error = mockedError
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
  })

  beforeEach(async () => {
    await truncate()
    consoleWarnOutput.length = 0
    consoleErrorOutput.length = 0

    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
    })
    domain = await collections.domains.save({
      domain: 'test.domain.gc.ca',
      slug: 'test-domain-gc-ca',
    })
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful load', () => {
    let spfScan1, spfScan2
    beforeEach(async () => {
      spfScan1 = await collections.spf.save({
        timestamp: '2020-10-02T12:43:39Z',
      })
      spfScan2 = await collections.spf.save({
        timestamp: '2020-10-03T12:43:39Z',
      })
      await collections.domainsSPF.save({
        _to: spfScan1._id,
        _from: domain._id,
      })
      await collections.domainsSPF.save({
        _to: spfScan2._id,
        _from: domain._id,
      })
    })
    describe('using no cursor', () => {
      it('returns multiple spf scans', async () => {
        const connectionLoader = spfLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const connectionArgs = {}

        const spfScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const spfLoader = spfLoaderByKey(query)
        const expectedSpfScans = await spfLoader.loadMany([
          spfScan1._key,
          spfScan2._key,
        ])

        expectedSpfScans[0].id = expectedSpfScans[0]._key
        expectedSpfScans[1].id = expectedSpfScans[1]._key

        expectedSpfScans[0].domainId = domain._id
        expectedSpfScans[1].domainId = domain._id

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('spf', expectedSpfScans[0]._key),
              node: {
                ...expectedSpfScans[0],
              },
            },
            {
              cursor: toGlobalId('spf', expectedSpfScans[1]._key),
              node: {
                ...expectedSpfScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('spf', expectedSpfScans[0]._key),
            endCursor: toGlobalId('spf', expectedSpfScans[1]._key),
          },
        }

        expect(spfScans).toEqual(expectedStructure)
      })
    })
    describe('using after cursor', () => {
      it('returns spf scan(s) after a given node id', async () => {
        const connectionLoader = spfLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const spfLoader = spfLoaderByKey(query)
        const expectedSpfScans = await spfLoader.loadMany([
          spfScan1._key,
          spfScan2._key,
        ])

        expectedSpfScans[0].id = expectedSpfScans[0]._key
        expectedSpfScans[1].id = expectedSpfScans[1]._key

        expectedSpfScans[0].domainId = domain._id
        expectedSpfScans[1].domainId = domain._id

        const connectionArgs = {
          after: toGlobalId('spf', expectedSpfScans[0]._key),
        }

        const spfScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('spf', expectedSpfScans[1]._key),
              node: {
                ...expectedSpfScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('spf', expectedSpfScans[1]._key),
            endCursor: toGlobalId('spf', expectedSpfScans[1]._key),
          },
        }

        expect(spfScans).toEqual(expectedStructure)
      })
    })
    describe('using before cursor', () => {
      it('returns spf scan(s) before a given node id', async () => {
        const connectionLoader = spfLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const spfLoader = spfLoaderByKey(query)
        const expectedSpfScans = await spfLoader.loadMany([
          spfScan1._key,
          spfScan2._key,
        ])

        expectedSpfScans[0].id = expectedSpfScans[0]._key
        expectedSpfScans[1].id = expectedSpfScans[1]._key

        expectedSpfScans[0].domainId = domain._id
        expectedSpfScans[1].domainId = domain._id

        const connectionArgs = {
          before: toGlobalId('spf', expectedSpfScans[1]._key),
        }

        const spfScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('spf', expectedSpfScans[0]._key),
              node: {
                ...expectedSpfScans[0],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('spf', expectedSpfScans[0]._key),
            endCursor: toGlobalId('spf', expectedSpfScans[0]._key),
          },
        }

        expect(spfScans).toEqual(expectedStructure)
      })
    })
    describe('using no limit', () => {
      it('returns multiple spf scans', async () => {
        const connectionLoader = spfLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const connectionArgs = {}

        const spfScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const spfLoader = spfLoaderByKey(query)
        const expectedSpfScans = await spfLoader.loadMany([
          spfScan1._key,
          spfScan2._key,
        ])

        expectedSpfScans[0].id = expectedSpfScans[0]._key
        expectedSpfScans[1].id = expectedSpfScans[1]._key

        expectedSpfScans[0].domainId = domain._id
        expectedSpfScans[1].domainId = domain._id

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('spf', expectedSpfScans[0]._key),
              node: {
                ...expectedSpfScans[0],
              },
            },
            {
              cursor: toGlobalId('spf', expectedSpfScans[1]._key),
              node: {
                ...expectedSpfScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('spf', expectedSpfScans[0]._key),
            endCursor: toGlobalId('spf', expectedSpfScans[1]._key),
          },
        }

        expect(spfScans).toEqual(expectedStructure)
      })
    })
    describe('using first limit', () => {
      it('returns the first n amount of item(s)', async () => {
        const connectionLoader = spfLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const spfLoader = spfLoaderByKey(query)
        const expectedSpfScans = await spfLoader.loadMany([
          spfScan1._key,
          spfScan2._key,
        ])

        expectedSpfScans[0].id = expectedSpfScans[0]._key
        expectedSpfScans[1].id = expectedSpfScans[1]._key

        expectedSpfScans[0].domainId = domain._id
        expectedSpfScans[1].domainId = domain._id

        const connectionArgs = {
          first: 1,
        }

        const spfScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('spf', expectedSpfScans[0]._key),
              node: {
                ...expectedSpfScans[0],
              },
            },
          ],
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('spf', expectedSpfScans[0]._key),
            endCursor: toGlobalId('spf', expectedSpfScans[0]._key),
          },
        }

        expect(spfScans).toEqual(expectedStructure)
      })
    })
    describe('using last limit', () => {
      it('returns the last n amount of item(s)', async () => {
        const connectionLoader = spfLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const spfLoader = spfLoaderByKey(query)
        const expectedSpfScans = await spfLoader.loadMany([
          spfScan1._key,
          spfScan2._key,
        ])

        expectedSpfScans[0].id = expectedSpfScans[0]._key
        expectedSpfScans[1].id = expectedSpfScans[1]._key

        expectedSpfScans[0].domainId = domain._id
        expectedSpfScans[1].domainId = domain._id

        const connectionArgs = {
          last: 1,
        }

        const spfScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('spf', expectedSpfScans[1]._key),
              node: {
                ...expectedSpfScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('spf', expectedSpfScans[1]._key),
            endCursor: toGlobalId('spf', expectedSpfScans[1]._key),
          },
        }

        expect(spfScans).toEqual(expectedStructure)
      })
    })
    describe('using date filters', () => {
      let spfScan3
      beforeEach(async () => {
        spfScan3 = await collections.spf.save({
          timestamp: '2020-10-04T12:43:39Z',
        })
        await collections.domainsSPF.save({
          _to: spfScan3._id,
          _from: domain._id,
        })
      })
      describe('using start date filter', () => {
        it('returns spf scans at and after the start date', async () => {
          const connectionLoader = spfLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
          )

          const spfLoader = spfLoaderByKey(query)
          const expectedSpfScans = await spfLoader.loadMany([
            spfScan2._key,
            spfScan3._key,
          ])

          expectedSpfScans[0].id = expectedSpfScans[0]._key
          expectedSpfScans[1].id = expectedSpfScans[1]._key

          expectedSpfScans[0].domainId = domain._id
          expectedSpfScans[1].domainId = domain._id

          const connectionArgs = {
            startDate: '2020-10-03',
          }

          const spfScans = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('spf', expectedSpfScans[0]._key),
                node: {
                  ...expectedSpfScans[0],
                },
              },
              {
                cursor: toGlobalId('spf', expectedSpfScans[1]._key),
                node: {
                  ...expectedSpfScans[1],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('spf', expectedSpfScans[0]._key),
              endCursor: toGlobalId('spf', expectedSpfScans[1]._key),
            },
          }

          expect(spfScans).toEqual(expectedStructure)
        })
      })
      describe('using end date filter', () => {
        it('returns spf scans at and before the end date', async () => {
          const connectionLoader = spfLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
          )

          const spfLoader = spfLoaderByKey(query)
          const expectedSpfScans = await spfLoader.loadMany([
            spfScan1._key,
            spfScan2._key,
          ])

          expectedSpfScans[0].id = expectedSpfScans[0]._key
          expectedSpfScans[1].id = expectedSpfScans[1]._key

          expectedSpfScans[0].domainId = domain._id
          expectedSpfScans[1].domainId = domain._id

          const connectionArgs = {
            endDate: '2020-10-03T13:50:00Z',
          }

          const spfScans = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('spf', expectedSpfScans[0]._key),
                node: {
                  ...expectedSpfScans[0],
                },
              },
              {
                cursor: toGlobalId('spf', expectedSpfScans[1]._key),
                node: {
                  ...expectedSpfScans[1],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('spf', expectedSpfScans[0]._key),
              endCursor: toGlobalId('spf', expectedSpfScans[1]._key),
            },
          }

          expect(spfScans).toEqual(expectedStructure)
        })
      })
      describe('using start and end filters', () => {
        it('returns a scan on a specific date', async () => {
          const connectionLoader = spfLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
          )

          const spfLoader = spfLoaderByKey(query)
          const expectedSpfScans = await spfLoader.loadMany([spfScan2._key])

          expectedSpfScans[0].id = expectedSpfScans[0]._key
          expectedSpfScans[0].domainId = domain._id

          const connectionArgs = {
            startDate: '2020-10-03T00:00:00Z',
            endDate: '2020-10-03T23:59:59Z',
          }

          const spfScans = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('spf', expectedSpfScans[0]._key),
                node: {
                  ...expectedSpfScans[0],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('spf', expectedSpfScans[0]._key),
              endCursor: toGlobalId('spf', expectedSpfScans[0]._key),
            },
          }

          expect(spfScans).toEqual(expectedStructure)
        })
      })
    })
    describe('no spf scans are found', () => {
      it('returns an empty structure', async () => {
        await truncate()
        const connectionLoader = spfLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const connectionArgs = {}

        const spfScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: '',
            endCursor: '',
          },
        }

        expect(spfScans).toEqual(expectedStructure)
      })
    })
  })
  describe('given a unsuccessful load', () => {
    describe('first and last arguments are set', () => {
      it('throws an error', async () => {
        const connectionLoader = spfLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const connectionArgs = {
          first: 1,
          last: 5,
        }

        try {
          await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Unable to have both first, and last arguments set at the same time.',
            ),
          )
        }
      })
    })
  })
  describe('database error occurs', () => {
    it('throws an error', async () => {
      const query = jest
        .fn()
        .mockRejectedValue(new Error('Database Error Occurred.'))

      const connectionLoader = spfLoaderConnectionsByDomainId(
        query,
        user._key,
        cleanseInput,
      )

      const connectionArgs = {}

      try {
        await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to load spf scans. Please try again.'),
        )
      }

      expect(consoleErrorOutput).toEqual([
        `Database error occurred while user: ${user._key} was trying to get spf information for ${domain._id}, error: Error: Database Error Occurred.`,
      ])
    })
  })
  describe('cursor error occurs', () => {
    it('throws an error', async () => {
      const cursor = {
        all() {
          throw new Error('Cursor Error Occurred.')
        },
      }
      const query = jest.fn().mockReturnValueOnce(cursor)

      const connectionLoader = spfLoaderConnectionsByDomainId(
        query,
        user._key,
        cleanseInput,
      )

      const connectionArgs = {}

      try {
        await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to load spf scans. Please try again.'),
        )
      }

      expect(consoleErrorOutput).toEqual([
        `Cursor error occurred while user: ${user._key} was trying to get spf information for ${domain._id}, error: Error: Cursor Error Occurred.`,
      ])
    })
  })
})
