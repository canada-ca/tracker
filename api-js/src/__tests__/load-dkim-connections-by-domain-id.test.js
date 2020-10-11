require('dotenv-safe').config({
  allowEmptyValues: true,
})

const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { toGlobalId } = require('graphql-relay')
const { makeMigrations } = require('../../migrations')
const { cleanseInput } = require('../validators')
const {
  dkimLoaderConnectionsByDomainId,
  dkimLoaderByKey,
} = require('../loaders')

describe('when given the load dkim connection function', () => {
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
    let dkimScan1, dkimScan2
    beforeEach(async () => {
      dkimScan1 = await collections.dkim.save({
        timestamp: '2020-10-02T12:43:39Z',
      })
      dkimScan2 = await collections.dkim.save({
        timestamp: '2020-10-03T12:43:39Z',
      })
      await collections.domainsDKIM.save({
        _to: dkimScan1._id,
        _from: domain._id,
      })
      await collections.domainsDKIM.save({
        _to: dkimScan2._id,
        _from: domain._id,
      })
    })
    describe('using no cursor', () => {
      it('returns multiple dkim scans', async () => {
        const connectionLoader = dkimLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const connectionArgs = {}

        const dkimScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const dkimLoader = dkimLoaderByKey(query)
        const expectedDkimScans = await dkimLoader.loadMany([
          dkimScan1._key,
          dkimScan2._key,
        ])

        expectedDkimScans[0].id = expectedDkimScans[0]._key
        expectedDkimScans[1].id = expectedDkimScans[1]._key

        expectedDkimScans[0].domainId = domain._id
        expectedDkimScans[1].domainId = domain._id

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dkim', expectedDkimScans[0]._key),
              node: {
                ...expectedDkimScans[0],
              },
            },
            {
              cursor: toGlobalId('dkim', expectedDkimScans[1]._key),
              node: {
                ...expectedDkimScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('dkim', expectedDkimScans[0]._key),
            endCursor: toGlobalId('dkim', expectedDkimScans[1]._key),
          },
        }

        expect(dkimScans).toEqual(expectedStructure)
      })
    })
    describe('using after cursor', () => {
      it('returns dkim scan(s) after a given node id', async () => {
        const connectionLoader = dkimLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const dkimLoader = dkimLoaderByKey(query)
        const expectedDkimScans = await dkimLoader.loadMany([
          dkimScan1._key,
          dkimScan2._key,
        ])

        expectedDkimScans[0].id = expectedDkimScans[0]._key
        expectedDkimScans[0].domainId = domain._id

        expectedDkimScans[1].id = expectedDkimScans[1]._key
        expectedDkimScans[1].domainId = domain._id

        const connectionArgs = {
          after: toGlobalId('dkim', expectedDkimScans[0]._key),
        }

        const dkimScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dkim', expectedDkimScans[1]._key),
              node: {
                ...expectedDkimScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('dkim', expectedDkimScans[1]._key),
            endCursor: toGlobalId('dkim', expectedDkimScans[1]._key),
          },
        }

        expect(dkimScans).toEqual(expectedStructure)
      })
    })
    describe('using before cursor', () => {
      it('returns dkim scan(s) before a given node id', async () => {
        const connectionLoader = dkimLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const dkimLoader = dkimLoaderByKey(query)
        const expectedDkimScans = await dkimLoader.loadMany([
          dkimScan1._key,
          dkimScan2._key,
        ])

        expectedDkimScans[0].id = expectedDkimScans[0]._key
        expectedDkimScans[0].domainId = domain._id

        expectedDkimScans[1].id = expectedDkimScans[1]._key
        expectedDkimScans[1].domainId = domain._id

        const connectionArgs = {
          before: toGlobalId('dkim', expectedDkimScans[1]._key),
        }

        const dkimScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dkim', expectedDkimScans[0]._key),
              node: {
                ...expectedDkimScans[0],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('dkim', expectedDkimScans[0]._key),
            endCursor: toGlobalId('dkim', expectedDkimScans[0]._key),
          },
        }

        expect(dkimScans).toEqual(expectedStructure)
      })
    })
    describe('using no limit', () => {
      it('returns multiple dkim scans', async () => {
        const connectionLoader = dkimLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const connectionArgs = {}

        const dkimScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const dkimLoader = dkimLoaderByKey(query)
        const expectedDkimScans = await dkimLoader.loadMany([
          dkimScan1._key,
          dkimScan2._key,
        ])

        expectedDkimScans[0].id = expectedDkimScans[0]._key
        expectedDkimScans[1].id = expectedDkimScans[1]._key

        expectedDkimScans[0].domainId = domain._id
        expectedDkimScans[1].domainId = domain._id

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dkim', expectedDkimScans[0]._key),
              node: {
                ...expectedDkimScans[0],
              },
            },
            {
              cursor: toGlobalId('dkim', expectedDkimScans[1]._key),
              node: {
                ...expectedDkimScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('dkim', expectedDkimScans[0]._key),
            endCursor: toGlobalId('dkim', expectedDkimScans[1]._key),
          },
        }

        expect(dkimScans).toEqual(expectedStructure)
      })
    })
    describe('using first limit', () => {
      it('returns the first n amount of item(s)', async () => {
        const connectionLoader = dkimLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const dkimLoader = dkimLoaderByKey(query)
        const expectedDkimScans = await dkimLoader.loadMany([
          dkimScan1._key,
          dkimScan2._key,
        ])

        expectedDkimScans[0].id = expectedDkimScans[0]._key
        expectedDkimScans[0].domainId = domain._id

        expectedDkimScans[1].id = expectedDkimScans[1]._key
        expectedDkimScans[1].domainId = domain._id

        const connectionArgs = {
          first: 1,
        }

        const dkimScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dkim', expectedDkimScans[0]._key),
              node: {
                ...expectedDkimScans[0],
              },
            },
          ],
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('dkim', expectedDkimScans[0]._key),
            endCursor: toGlobalId('dkim', expectedDkimScans[0]._key),
          },
        }

        expect(dkimScans).toEqual(expectedStructure)
      })
    })
    describe('using last limit', () => {
      it('returns the last n amount of item(s)', async () => {
        const connectionLoader = dkimLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const dkimLoader = dkimLoaderByKey(query)
        const expectedDkimScans = await dkimLoader.loadMany([
          dkimScan1._key,
          dkimScan2._key,
        ])

        expectedDkimScans[1].id = expectedDkimScans[1]._key
        expectedDkimScans[1].domainId = domain._id

        const connectionArgs = {
          last: 1,
        }

        const dkimScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dkim', expectedDkimScans[1]._key),
              node: {
                ...expectedDkimScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('dkim', expectedDkimScans[1]._key),
            endCursor: toGlobalId('dkim', expectedDkimScans[1]._key),
          },
        }

        expect(dkimScans).toEqual(expectedStructure)
      })
    })
    describe('use date filters', () => {
      let dkimScan3
      beforeEach(async () => {
        dkimScan3 = await collections.dkim.save({
          timestamp: '2020-10-04T12:43:39Z',
        })
        await collections.domainsDKIM.save({
          _to: dkimScan3._id,
          _from: domain._id,
        })
      })
      describe('using start date filter', () => {
        it('returns dkim scans at and after the start date', async () => {
          const connectionLoader = dkimLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
          )

          const dkimLoader = dkimLoaderByKey(query)
          const expectedDkimScans = await dkimLoader.loadMany([
            dkimScan2._key,
            dkimScan3._key,
          ])

          expectedDkimScans[0].id = expectedDkimScans[0]._key
          expectedDkimScans[0].domainId = domain._id

          expectedDkimScans[1].id = expectedDkimScans[1]._key
          expectedDkimScans[1].domainId = domain._id

          const connectionArgs = {
            startDate: '2020-10-03',
          }

          const dkimScans = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('dkim', expectedDkimScans[0]._key),
                node: {
                  ...expectedDkimScans[0],
                },
              },
              {
                cursor: toGlobalId('dkim', expectedDkimScans[1]._key),
                node: {
                  ...expectedDkimScans[1],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('dkim', expectedDkimScans[0]._key),
              endCursor: toGlobalId('dkim', expectedDkimScans[1]._key),
            },
          }

          expect(dkimScans).toEqual(expectedStructure)
        })
      })
      describe('using end date filter', () => {
        it('returns dkim scans at and before the end date', async () => {
          const connectionLoader = dkimLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
          )

          const dkimLoader = dkimLoaderByKey(query)
          const expectedDkimScans = await dkimLoader.loadMany([
            dkimScan1._key,
            dkimScan2._key,
          ])

          expectedDkimScans[0].id = expectedDkimScans[0]._key
          expectedDkimScans[0].domainId = domain._id

          expectedDkimScans[1].id = expectedDkimScans[1]._key
          expectedDkimScans[1].domainId = domain._id

          const connectionArgs = {
            endDate: '2020-10-03T13:50:00Z',
          }

          const dkimScans = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('dkim', expectedDkimScans[0]._key),
                node: {
                  ...expectedDkimScans[0],
                },
              },
              {
                cursor: toGlobalId('dkim', expectedDkimScans[1]._key),
                node: {
                  ...expectedDkimScans[1],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('dkim', expectedDkimScans[0]._key),
              endCursor: toGlobalId('dkim', expectedDkimScans[1]._key),
            },
          }

          expect(dkimScans).toEqual(expectedStructure)
        })
      })
      describe('using start and end date filters', () => {
        it('returns dkim scan on a specific date', async () => {
          const connectionLoader = dkimLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
          )

          const dkimLoader = dkimLoaderByKey(query)
          const expectedDkimScans = await dkimLoader.loadMany([dkimScan2._key])

          expectedDkimScans[0].id = expectedDkimScans[0]._key
          expectedDkimScans[0].domainId = domain._id

          const connectionArgs = {
            startDate: '2020-10-03T00:00:00Z',
            endDate: '2020-10-03T23:59:59Z',
          }

          const dkimScans = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('dkim', expectedDkimScans[0]._key),
                node: {
                  ...expectedDkimScans[0],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('dkim', expectedDkimScans[0]._key),
              endCursor: toGlobalId('dkim', expectedDkimScans[0]._key),
            },
          }

          expect(dkimScans).toEqual(expectedStructure)
        })
      })
    })
    describe('no dkim scans are found', () => {
      it('returns an empty structure', async () => {
        await truncate()
        const connectionLoader = dkimLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const connectionArgs = {}

        const dkimScans = await connectionLoader({
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

        expect(dkimScans).toEqual(expectedStructure)
      })
    })
  })
  describe('given a unsuccessful load', () => {
    describe('first and last arguments are set', () => {
      it('throws an error', async () => {
        const connectionLoader = dkimLoaderConnectionsByDomainId(
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

        expect(consoleWarnOutput).toEqual([
          `User: ${user._key} had first and last arguments set when trying to gather dkim scans for domain: ${domain._id}`,
        ])
      })
    })
  })
  describe('database error occurs', () => {
    it('throws an error', async () => {
      const query = jest
        .fn()
        .mockRejectedValue(new Error('Database Error Occurred.'))

      const connectionLoader = dkimLoaderConnectionsByDomainId(
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
          new Error('Unable to load dkim scans. Please try again.'),
        )
      }

      expect(consoleErrorOutput).toEqual([
        `Database error occurred while user: ${user._key} was trying to get dkim information for ${domain._id}, error: Error: Database Error Occurred.`,
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

      const connectionLoader = dkimLoaderConnectionsByDomainId(
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
          new Error('Unable to load dkim scans. Please try again.'),
        )
      }

      expect(consoleErrorOutput).toEqual([
        `Cursor error occurred while user: ${user._key} was trying to get dkim information for ${domain._id}, error: Error: Cursor Error Occurred.`,
      ])
    })
  })
})
