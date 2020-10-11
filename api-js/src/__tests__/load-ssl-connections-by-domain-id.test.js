require('dotenv-safe').config({
  allowEmptyValues: true,
})

const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { toGlobalId } = require('graphql-relay')
const { makeMigrations } = require('../../migrations')
const { cleanseInput } = require('../validators')
const { sslLoaderByKey, sslLoaderConnectionsByDomainId } = require('../loaders')

describe('given the load ssl connection function', () => {
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
    let sslScan1, sslScan2
    beforeEach(async () => {
      sslScan1 = await collections.ssl.save({
        timestamp: '2020-10-02T12:43:39Z',
      })
      sslScan2 = await collections.ssl.save({
        timestamp: '2020-10-03T12:43:39Z',
      })
      await collections.domainsSSL.save({
        _to: sslScan1._id,
        _from: domain._id,
      })
      await collections.domainsSSL.save({
        _to: sslScan2._id,
        _from: domain._id,
      })
    })

    describe('using no cursor', () => {
      it('returns multiple ssl scans', async () => {
        const connectionLoader = sslLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const sslLoader = await sslLoaderByKey(query)
        const expectedSslScans = await sslLoader.loadMany([
          sslScan1._key,
          sslScan2._key,
        ])

        expectedSslScans[0].id = expectedSslScans[0]._key
        expectedSslScans[0].domainId = domain._id

        expectedSslScans[1].id = expectedSslScans[1]._key
        expectedSslScans[1].domainId = domain._id

        const connectionArgs = {}

        const sslScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('ssl', expectedSslScans[0]._key),
              node: {
                ...expectedSslScans[0],
              },
            },
            {
              cursor: toGlobalId('ssl', expectedSslScans[1]._key),
              node: {
                ...expectedSslScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('ssl', expectedSslScans[0]._key),
            endCursor: toGlobalId('ssl', expectedSslScans[1]._key),
          },
        }

        expect(sslScans).toEqual(expectedStructure)
      })
    })
    describe('using after cursor', () => {
      it('returns ssl scan(s) after a given node id', async () => {
        const connectionLoader = sslLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const sslLoader = await sslLoaderByKey(query)
        const expectedSslScans = await sslLoader.loadMany([
          sslScan1._key,
          sslScan2._key,
        ])

        expectedSslScans[0].id = expectedSslScans[0]._key
        expectedSslScans[0].domainId = domain._id

        expectedSslScans[1].id = expectedSslScans[1]._key
        expectedSslScans[1].domainId = domain._id

        const connectionArgs = {
          after: toGlobalId('ssl', expectedSslScans[0]._key),
        }

        const sslScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('ssl', expectedSslScans[1]._key),
              node: {
                ...expectedSslScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('ssl', expectedSslScans[1]._key),
            endCursor: toGlobalId('ssl', expectedSslScans[1]._key),
          },
        }

        expect(sslScans).toEqual(expectedStructure)
      })
    })
    describe('using before cursor', () => {
      it('returns ssl scan(s) before a given node id', async () => {
        const connectionLoader = sslLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const sslLoader = await sslLoaderByKey(query)
        const expectedSslScans = await sslLoader.loadMany([
          sslScan1._key,
          sslScan2._key,
        ])

        expectedSslScans[0].id = expectedSslScans[0]._key
        expectedSslScans[0].domainId = domain._id

        expectedSslScans[1].id = expectedSslScans[1]._key
        expectedSslScans[1].domainId = domain._id

        const connectionArgs = {
          before: toGlobalId('ssl', expectedSslScans[1]._key),
        }

        const sslScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('ssl', expectedSslScans[0]._key),
              node: {
                ...expectedSslScans[0],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('ssl', expectedSslScans[0]._key),
            endCursor: toGlobalId('ssl', expectedSslScans[0]._key),
          },
        }

        expect(sslScans).toEqual(expectedStructure)
      })
    })
    describe('using no limit', () => {
      it('returns multiple ssl scans', async () => {
        const connectionLoader = sslLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const sslLoader = await sslLoaderByKey(query)
        const expectedSslScans = await sslLoader.loadMany([
          sslScan1._key,
          sslScan2._key,
        ])

        expectedSslScans[0].id = expectedSslScans[0]._key
        expectedSslScans[0].domainId = domain._id

        expectedSslScans[1].id = expectedSslScans[1]._key
        expectedSslScans[1].domainId = domain._id

        const connectionArgs = {}

        const sslScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('ssl', expectedSslScans[0]._key),
              node: {
                ...expectedSslScans[0],
              },
            },
            {
              cursor: toGlobalId('ssl', expectedSslScans[1]._key),
              node: {
                ...expectedSslScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('ssl', expectedSslScans[0]._key),
            endCursor: toGlobalId('ssl', expectedSslScans[1]._key),
          },
        }

        expect(sslScans).toEqual(expectedStructure)
      })
    })
    describe('using first limit', () => {
      it('returns the first n amount of ssl scan(s)', async () => {
        const connectionLoader = sslLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const sslLoader = await sslLoaderByKey(query)
        const expectedSslScans = await sslLoader.loadMany([
          sslScan1._key,
          sslScan2._key,
        ])

        expectedSslScans[0].id = expectedSslScans[0]._key
        expectedSslScans[0].domainId = domain._id

        expectedSslScans[1].id = expectedSslScans[1]._key
        expectedSslScans[1].domainId = domain._id

        const connectionArgs = {
          first: 1,
        }

        const sslScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('ssl', expectedSslScans[0]._key),
              node: {
                ...expectedSslScans[0],
              },
            },
          ],
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('ssl', expectedSslScans[0]._key),
            endCursor: toGlobalId('ssl', expectedSslScans[0]._key),
          },
        }

        expect(sslScans).toEqual(expectedStructure)
      })
    })
    describe('using last limit', () => {
      it('returns the last n amount of ssl scan(s)', async () => {
        const connectionLoader = sslLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const sslLoader = await sslLoaderByKey(query)
        const expectedSslScans = await sslLoader.loadMany([
          sslScan1._key,
          sslScan2._key,
        ])

        expectedSslScans[0].id = expectedSslScans[0]._key
        expectedSslScans[0].domainId = domain._id

        expectedSslScans[1].id = expectedSslScans[1]._key
        expectedSslScans[1].domainId = domain._id

        const connectionArgs = {
          last: 1,
        }

        const sslScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('ssl', expectedSslScans[1]._key),
              node: {
                ...expectedSslScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('ssl', expectedSslScans[1]._key),
            endCursor: toGlobalId('ssl', expectedSslScans[1]._key),
          },
        }

        expect(sslScans).toEqual(expectedStructure)
      })
    })
    describe('using date filter', () => {
      let sslScan3
      beforeEach(async () => {
        sslScan3 = await collections.ssl.save({
          timestamp: '2020-10-04T12:43:39Z',
        })
        await collections.domainsSSL.save({
          _to: sslScan3._id,
          _from: domain._id,
        })
      })
      describe('using start date filter', () => {
        it('returns ssl scans at and after the start date', async () => {
          const connectionLoader = sslLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
          )

          const sslLoader = await sslLoaderByKey(query)
          const expectedSslScans = await sslLoader.loadMany([
            sslScan2._key,
            sslScan3._key,
          ])

          expectedSslScans[0].id = expectedSslScans[0]._key
          expectedSslScans[0].domainId = domain._id

          expectedSslScans[1].id = expectedSslScans[1]._key
          expectedSslScans[1].domainId = domain._id

          const connectionArgs = {
            startDate: '2020-10-03',
          }

          const sslScans = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('ssl', expectedSslScans[0]._key),
                node: {
                  ...expectedSslScans[0],
                },
              },
              {
                cursor: toGlobalId('ssl', expectedSslScans[1]._key),
                node: {
                  ...expectedSslScans[1],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('ssl', expectedSslScans[0]._key),
              endCursor: toGlobalId('ssl', expectedSslScans[1]._key),
            },
          }

          expect(sslScans).toEqual(expectedStructure)
        })
      })
      describe('using end date filter', () => {
        it('returns ssl scans at and before the end date', async () => {
          const connectionLoader = sslLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
          )

          const sslLoader = await sslLoaderByKey(query)
          const expectedSslScans = await sslLoader.loadMany([
            sslScan1._key,
            sslScan2._key,
          ])

          expectedSslScans[0].id = expectedSslScans[0]._key
          expectedSslScans[0].domainId = domain._id

          expectedSslScans[1].id = expectedSslScans[1]._key
          expectedSslScans[1].domainId = domain._id

          const connectionArgs = {
            endDate: '2020-10-03T13:50:00Z',
          }

          const sslScans = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('ssl', expectedSslScans[0]._key),
                node: {
                  ...expectedSslScans[0],
                },
              },
              {
                cursor: toGlobalId('ssl', expectedSslScans[1]._key),
                node: {
                  ...expectedSslScans[1],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('ssl', expectedSslScans[0]._key),
              endCursor: toGlobalId('ssl', expectedSslScans[1]._key),
            },
          }

          expect(sslScans).toEqual(expectedStructure)
        })
      })
      describe('using start and end date filters', () => {
        it('returns a scan on a specific date', async () => {
          const connectionLoader = sslLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
          )

          const sslLoader = await sslLoaderByKey(query)
          const expectedSslScans = await sslLoader.loadMany([sslScan2._key])

          expectedSslScans[0].id = expectedSslScans[0]._key
          expectedSslScans[0].domainId = domain._id

          const connectionArgs = {
            startDate: '2020-10-03T00:00:00Z',
            endDate: '2020-10-03T23:59:59Z',
          }

          const sslScans = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('ssl', expectedSslScans[0]._key),
                node: {
                  ...expectedSslScans[0],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('ssl', expectedSslScans[0]._key),
              endCursor: toGlobalId('ssl', expectedSslScans[0]._key),
            },
          }

          expect(sslScans).toEqual(expectedStructure)
        })
      })
    })
    describe('no ssl scans are found', () => {
      it('returns an empty structure', async () => {
        await truncate()

        const connectionLoader = sslLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const connectionArgs = {}

        const sslScans = await connectionLoader({
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

        expect(sslScans).toEqual(expectedStructure)
      })
    })
  })
  describe('given an unsuccessful load', () => {
    describe('first and last arguments are set', () => {
      it('throws and error', async () => {
        const connectionLoader = sslLoaderConnectionsByDomainId(
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
          `User: ${user._key} had first and last arguments set when trying to gather ssl scans for domain: ${domain._id}`,
        ])
      })
    })
  })
  describe('database error occurs', () => {
    it('throws an error', async () => {
      const query = jest
        .fn()
        .mockRejectedValue(new Error('Database Error Occurred.'))

      const connectionLoader = sslLoaderConnectionsByDomainId(
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
          new Error('Unable to load ssl scans. Please try again.'),
        )
      }

      expect(consoleErrorOutput).toEqual([
        `Database error occurred while user: ${user._key} was trying to get ssl information for ${domain._id}, error: Error: Database Error Occurred.`,
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

      const connectionLoader = sslLoaderConnectionsByDomainId(
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
          new Error('Unable to load ssl scans. Please try again.'),
        )
      }

      expect(consoleErrorOutput).toEqual([
        `Cursor error occurred while user: ${user._key} was trying to get ssl information for ${domain._id}, error: Error: Cursor Error Occurred.`,
      ])
    })
  })
})
