require('dotenv-safe').config({
  allowEmptyValues: true,
})

const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { toGlobalId } = require('graphql-relay')
const { makeMigrations } = require('../../migrations')
const { cleanseInput } = require('../validators')
const {
  dmarcLoaderConnectionsByDomainId,
  dmarcLoaderByKey,
} = require('../loaders')

describe('when given the load dmarc connection function', () => {
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
    let dmarcScan1, dmarcScan2
    beforeEach(async () => {
      dmarcScan1 = await collections.dmarc.save({
        timestamp: '2020-10-02T12:43:39Z',
      })
      dmarcScan2 = await collections.dmarc.save({
        timestamp: '2020-10-03T12:43:39Z',
      })
      await collections.domainsDMARC.save({
        _to: dmarcScan1._id,
        _from: domain._id,
      })
      await collections.domainsDMARC.save({
        _to: dmarcScan2._id,
        _from: domain._id,
      })
    })
    describe('using no cursor', () => {
      it('returns multiple dmarc scans', async () => {
        const connectionLoader = dmarcLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const connectionArgs = {}

        const dmarcScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const dkimLoader = dmarcLoaderByKey(query)
        const expectedDmarcScans = await dkimLoader.loadMany([
          dmarcScan1._key,
          dmarcScan2._key,
        ])

        expectedDmarcScans[0].id = expectedDmarcScans[0]._key
        expectedDmarcScans[1].id = expectedDmarcScans[1]._key

        expectedDmarcScans[0].domainId = domain._id
        expectedDmarcScans[1].domainId = domain._id

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
              node: {
                ...expectedDmarcScans[0],
              },
            },
            {
              cursor: toGlobalId('dmarc', expectedDmarcScans[1]._key),
              node: {
                ...expectedDmarcScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
            endCursor: toGlobalId('dmarc', expectedDmarcScans[1]._key),
          },
        }

        expect(dmarcScans).toEqual(expectedStructure)
      })
    })
    describe('using after cursor', () => {
      it('returns dmarc scan(s) after a given node id', async () => {
        const connectionLoader = dmarcLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const dkimLoader = dmarcLoaderByKey(query)
        const expectedDmarcScans = await dkimLoader.loadMany([
          dmarcScan1._key,
          dmarcScan2._key,
        ])

        expectedDmarcScans[0].id = expectedDmarcScans[0]._key
        expectedDmarcScans[0].domainId = domain._id

        expectedDmarcScans[1].id = expectedDmarcScans[1]._key
        expectedDmarcScans[1].domainId = domain._id

        const connectionArgs = {
          after: toGlobalId('dmarc', expectedDmarcScans[0]._key),
        }

        const dmarcScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dmarc', expectedDmarcScans[1]._key),
              node: {
                ...expectedDmarcScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('dmarc', expectedDmarcScans[1]._key),
            endCursor: toGlobalId('dmarc', expectedDmarcScans[1]._key),
          },
        }

        expect(dmarcScans).toEqual(expectedStructure)
      })
    })
    describe('using before cursor', () => {
      it('returns dmarc scan(s) before a given node id', async () => {
        const connectionLoader = dmarcLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const dkimLoader = dmarcLoaderByKey(query)
        const expectedDmarcScans = await dkimLoader.loadMany([
          dmarcScan1._key,
          dmarcScan2._key,
        ])

        expectedDmarcScans[0].id = expectedDmarcScans[0]._key
        expectedDmarcScans[0].domainId = domain._id

        expectedDmarcScans[1].id = expectedDmarcScans[1]._key
        expectedDmarcScans[1].domainId = domain._id

        const connectionArgs = {
          before: toGlobalId('dmarc', expectedDmarcScans[1]._key),
        }

        const dmarcScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
              node: {
                ...expectedDmarcScans[0],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
            endCursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
          },
        }

        expect(dmarcScans).toEqual(expectedStructure)
      })
    })
    describe('using no limit', () => {
      it('returns multiple dmarc scans', async () => {
        const connectionLoader = dmarcLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const connectionArgs = {}

        const dmarcScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const dkimLoader = dmarcLoaderByKey(query)
        const expectedDmarcScans = await dkimLoader.loadMany([
          dmarcScan1._key,
          dmarcScan2._key,
        ])

        expectedDmarcScans[0].id = expectedDmarcScans[0]._key
        expectedDmarcScans[1].id = expectedDmarcScans[1]._key

        expectedDmarcScans[0].domainId = domain._id
        expectedDmarcScans[1].domainId = domain._id

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
              node: {
                ...expectedDmarcScans[0],
              },
            },
            {
              cursor: toGlobalId('dmarc', expectedDmarcScans[1]._key),
              node: {
                ...expectedDmarcScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
            endCursor: toGlobalId('dmarc', expectedDmarcScans[1]._key),
          },
        }

        expect(dmarcScans).toEqual(expectedStructure)
      })
    })
    describe('using first limit', () => {
      it('returns the first n amount of item(s)', async () => {
        const connectionLoader = dmarcLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const dkimLoader = dmarcLoaderByKey(query)
        const expectedDmarcScans = await dkimLoader.loadMany([
          dmarcScan1._key,
          dmarcScan2._key,
        ])

        expectedDmarcScans[0].id = expectedDmarcScans[0]._key
        expectedDmarcScans[0].domainId = domain._id

        expectedDmarcScans[1].id = expectedDmarcScans[1]._key
        expectedDmarcScans[1].domainId = domain._id

        const connectionArgs = {
          first: 1,
        }

        const dmarcScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
              node: {
                ...expectedDmarcScans[0],
              },
            },
          ],
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
            endCursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
          },
        }

        expect(dmarcScans).toEqual(expectedStructure)
      })
    })
    describe('using last limit', () => {
      it('returns the last n amount of item(s)', async () => {
        const connectionLoader = dmarcLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const dkimLoader = dmarcLoaderByKey(query)
        const expectedDmarcScans = await dkimLoader.loadMany([
          dmarcScan1._key,
          dmarcScan2._key,
        ])

        expectedDmarcScans[0].id = expectedDmarcScans[0]._key
        expectedDmarcScans[0].domainId = domain._id

        expectedDmarcScans[1].id = expectedDmarcScans[1]._key
        expectedDmarcScans[1].domainId = domain._id

        const connectionArgs = {
          last: 1,
        }

        const dmarcScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dmarc', expectedDmarcScans[1]._key),
              node: {
                ...expectedDmarcScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('dmarc', expectedDmarcScans[1]._key),
            endCursor: toGlobalId('dmarc', expectedDmarcScans[1]._key),
          },
        }

        expect(dmarcScans).toEqual(expectedStructure)
      })
    })
    describe('use date filters', () => {
      let dmarcScan3
      beforeEach(async () => {
        dmarcScan3 = await collections.dmarc.save({
          timestamp: '2020-10-04T12:43:39Z',
        })
        await collections.domainsDMARC.save({
          _to: dmarcScan3._id,
          _from: domain._id,
        })
      })
      describe('using start date filter', () => {
        it('returns dkim scans at and after the start date', async () => {
          const connectionLoader = dmarcLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
          )

          const dmarcLoader = dmarcLoaderByKey(query)
          const expectedDmarcScans = await dmarcLoader.loadMany([
            dmarcScan2._key,
            dmarcScan3._key,
          ])

          expectedDmarcScans[0].id = expectedDmarcScans[0]._key
          expectedDmarcScans[0].domainId = domain._id

          expectedDmarcScans[1].id = expectedDmarcScans[1]._key
          expectedDmarcScans[1].domainId = domain._id

          const connectionArgs = {
            startDate: '2020-10-03',
          }

          const dmarcScans = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
                node: {
                  ...expectedDmarcScans[0],
                },
              },
              {
                cursor: toGlobalId('dmarc', expectedDmarcScans[1]._key),
                node: {
                  ...expectedDmarcScans[1],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
              endCursor: toGlobalId('dmarc', expectedDmarcScans[1]._key),
            },
          }

          expect(dmarcScans).toEqual(expectedStructure)
        })
      })
      describe('using end date filter', () => {
        it('returns dkim scans at and before the end date', async () => {
          const connectionLoader = dmarcLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
          )

          const dmarcLoader = dmarcLoaderByKey(query)
          const expectedDmarcScans = await dmarcLoader.loadMany([
            dmarcScan1._key,
            dmarcScan2._key,
          ])

          expectedDmarcScans[0].id = expectedDmarcScans[0]._key
          expectedDmarcScans[0].domainId = domain._id

          expectedDmarcScans[1].id = expectedDmarcScans[1]._key
          expectedDmarcScans[1].domainId = domain._id

          const connectionArgs = {
            endDate: '2020-10-03T13:50:00Z',
          }

          const dmarcScans = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
                node: {
                  ...expectedDmarcScans[0],
                },
              },
              {
                cursor: toGlobalId('dmarc', expectedDmarcScans[1]._key),
                node: {
                  ...expectedDmarcScans[1],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
              endCursor: toGlobalId('dmarc', expectedDmarcScans[1]._key),
            },
          }

          expect(dmarcScans).toEqual(expectedStructure)
        })
      })
      describe('using start and end date filters', () => {
        it('returns dkim scan on a specific date', async () => {
          const connectionLoader = dmarcLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
          )

          const dmarcLoader = dmarcLoaderByKey(query)
          const expectedDmarcScans = await dmarcLoader.loadMany([
            dmarcScan2._key,
          ])

          expectedDmarcScans[0].id = expectedDmarcScans[0]._key
          expectedDmarcScans[0].domainId = domain._id

          const connectionArgs = {
            startDate: '2020-10-03T00:00:00Z',
            endDate: '2020-10-03T23:59:59Z',
          }

          const dmarcScans = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
                node: {
                  ...expectedDmarcScans[0],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
              endCursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
            },
          }

          expect(dmarcScans).toEqual(expectedStructure)
        })
      })
    })
    describe('no dmarc scans are found', () => {
      it('returns an empty structure', async () => {
        await truncate()
        const connectionLoader = dmarcLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const connectionArgs = {}

        const dmarcScans = await connectionLoader({
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

        expect(dmarcScans).toEqual(expectedStructure)
      })
    })
  })
  describe('given a unsuccessful load', () => {
    describe('first and last arguments are set', () => {
      it('throws an error', async () => {
        const connectionLoader = dmarcLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
        )

        const connectionArgs = {
          first: 1,
          last: 2,
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

      const connectionLoader = dmarcLoaderConnectionsByDomainId(
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
          new Error('Unable to load dmarc scans. Please try again.'),
        )
      }

      expect(consoleErrorOutput).toEqual([
        `Database error occurred while user: ${user._key} was trying to get dmarc information for ${domain._id}, error: Error: Database Error Occurred.`,
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

      const connectionLoader = dmarcLoaderConnectionsByDomainId(
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
          new Error('Unable to load dmarc scans. Please try again.'),
        )
      }

      expect(consoleErrorOutput).toEqual([
        `Cursor error occurred while user: ${user._key} was trying to get dmarc information for ${domain._id}, error: Error: Cursor Error Occurred.`,
      ])
    })
  })
})
