import { stringify } from 'jest-matcher-utils'
import { ensure, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { cleanseInput } from '../../../validators'
import { spfLoaderConnectionsByDomainId, spfLoaderByKey } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('when given the load spf connection function', () => {
  let query, drop, truncate, collections, user, domain, i18n

  const consoleWarnOutput = []
  const mockedWarn = (output) => consoleWarnOutput.push(output)

  const consoleErrorOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)

  beforeAll(async () => {
    console.warn = mockedWarn
    console.error = mockedError
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
    i18n = setupI18n({
      locale: 'en',
      localeData: {
        en: { plurals: {} },
        fr: { plurals: {} },
      },
      locales: ['en', 'fr'],
      messages: {
        en: englishMessages.messages,
        fr: frenchMessages.messages,
      },
    })
  })

  beforeEach(async () => {
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

  afterEach(async () => {
    await truncate()
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
          i18n,
        )

        const connectionArgs = {
          first: 5,
        }

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
          totalCount: 2,
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
          i18n,
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
          first: 5,
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
          totalCount: 2,
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
    describe('using before cursor', () => {
      it('returns spf scan(s) before a given node id', async () => {
        const connectionLoader = spfLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          i18n,
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
          first: 5,
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
          totalCount: 2,
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
    describe('using first limit', () => {
      it('returns the first n amount of item(s)', async () => {
        const connectionLoader = spfLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          i18n,
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
          totalCount: 2,
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
          i18n,
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
          totalCount: 2,
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
            i18n,
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
            first: 5,
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
            totalCount: 3,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
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
            i18n,
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
            first: 5,
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
            totalCount: 3,
            pageInfo: {
              hasNextPage: true,
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
            i18n,
          )

          const spfLoader = spfLoaderByKey(query)
          const expectedSpfScans = await spfLoader.loadMany([spfScan2._key])

          expectedSpfScans[0].id = expectedSpfScans[0]._key
          expectedSpfScans[0].domainId = domain._id

          const connectionArgs = {
            first: 5,
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
            totalCount: 3,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: true,
              startCursor: toGlobalId('spf', expectedSpfScans[0]._key),
              endCursor: toGlobalId('spf', expectedSpfScans[0]._key),
            },
          }

          expect(spfScans).toEqual(expectedStructure)
        })
      })
    })
    describe('using orderBy field', () => {
      let spfOne, spfTwo, spfThree
      beforeEach(async () => {
        await truncate()
        domain = await collections.domains.save({
          domain: 'test.domain.gc.ca',
        })
        spfOne = await collections.spf.save({
          lookups: 1,
          record: 'a',
          spfDefault: 'a',
          timestamp: '2021-01-26 23:29:21.219962',
        })
        spfTwo = await collections.spf.save({
          lookups: 2,
          record: 'b',
          spfDefault: 'b',
          timestamp: '2021-01-27 23:29:21.219962',
        })
        spfThree = await collections.spf.save({
          lookups: 3,
          record: 'c',
          spfDefault: 'c',
          timestamp: '2021-01-28 23:29:21.219962',
        })
        await collections.domainsSPF.save({
          _to: spfOne._id,
          _from: domain._id,
        })
        await collections.domainsSPF.save({
          _to: spfTwo._id,
          _from: domain._id,
        })
        await collections.domainsSPF.save({
          _to: spfThree._id,
          _from: domain._id,
        })
      })
      describe('ordering on TIMESTAMP', () => {
        describe('direction is set to ASC', () => {
          it('returns spf scan', async () => {
            const loader = spfLoaderByKey(query, user._key, i18n)
            const expectedSpfScan = await loader.load(spfTwo._key)

            const connectionLoader = spfLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('spf', spfOne._key),
              before: toGlobalId('spf', spfThree._key),
              orderBy: {
                field: 'timestamp',
                direction: 'ASC',
              },
            }

            const spfScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('spf', expectedSpfScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSpfScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('spf', expectedSpfScan._key),
                endCursor: toGlobalId('spf', expectedSpfScan._key),
              },
            }

            expect(spfScans).toEqual(expectedStructure)
          })
        })
        describe('direction is set to DESC', () => {
          it('returns spf scan', async () => {
            const loader = spfLoaderByKey(query, user._key, i18n)
            const expectedSpfScan = await loader.load(spfTwo._key)

            const connectionLoader = spfLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('spf', spfThree._key),
              before: toGlobalId('spf', spfOne._key),
              orderBy: {
                field: 'timestamp',
                direction: 'DESC',
              },
            }

            const spfScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('spf', expectedSpfScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSpfScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('spf', expectedSpfScan._key),
                endCursor: toGlobalId('spf', expectedSpfScan._key),
              },
            }

            expect(spfScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on LOOKUPS', () => {
        describe('direction is set to ASC', () => {
          it('returns spf scan', async () => {
            const loader = spfLoaderByKey(query, user._key, i18n)
            const expectedSpfScan = await loader.load(spfTwo._key)

            const connectionLoader = spfLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('spf', spfOne._key),
              before: toGlobalId('spf', spfThree._key),
              orderBy: {
                field: 'lookups',
                direction: 'ASC',
              },
            }

            const spfScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('spf', expectedSpfScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSpfScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('spf', expectedSpfScan._key),
                endCursor: toGlobalId('spf', expectedSpfScan._key),
              },
            }

            expect(spfScans).toEqual(expectedStructure)
          })
        })
        describe('direction is set to DESC', () => {
          it('returns spf scan', async () => {
            const loader = spfLoaderByKey(query, user._key, i18n)
            const expectedSpfScan = await loader.load(spfTwo._key)

            const connectionLoader = spfLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('spf', spfThree._key),
              before: toGlobalId('spf', spfOne._key),
              orderBy: {
                field: 'lookups',
                direction: 'DESC',
              },
            }

            const spfScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('spf', expectedSpfScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSpfScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('spf', expectedSpfScan._key),
                endCursor: toGlobalId('spf', expectedSpfScan._key),
              },
            }

            expect(spfScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on RECORD', () => {
        describe('direction is set to ASC', () => {
          it('returns spf scan', async () => {
            const loader = spfLoaderByKey(query, user._key, i18n)
            const expectedSpfScan = await loader.load(spfTwo._key)

            const connectionLoader = spfLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('spf', spfOne._key),
              before: toGlobalId('spf', spfThree._key),
              orderBy: {
                field: 'record',
                direction: 'ASC',
              },
            }

            const spfScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('spf', expectedSpfScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSpfScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('spf', expectedSpfScan._key),
                endCursor: toGlobalId('spf', expectedSpfScan._key),
              },
            }

            expect(spfScans).toEqual(expectedStructure)
          })
        })
        describe('direction is set to DESC', () => {
          it('returns spf scan', async () => {
            const loader = spfLoaderByKey(query, user._key, i18n)
            const expectedSpfScan = await loader.load(spfTwo._key)

            const connectionLoader = spfLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('spf', spfThree._key),
              before: toGlobalId('spf', spfOne._key),
              orderBy: {
                field: 'record',
                direction: 'DESC',
              },
            }

            const spfScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('spf', expectedSpfScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSpfScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('spf', expectedSpfScan._key),
                endCursor: toGlobalId('spf', expectedSpfScan._key),
              },
            }

            expect(spfScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on SPF_DEFAULT', () => {
        describe('direction is set to ASC', () => {
          it('returns spf scan', async () => {
            const loader = spfLoaderByKey(query, user._key, i18n)
            const expectedSpfScan = await loader.load(spfTwo._key)

            const connectionLoader = spfLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('spf', spfOne._key),
              before: toGlobalId('spf', spfThree._key),
              orderBy: {
                field: 'spf-default',
                direction: 'ASC',
              },
            }

            const spfScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('spf', expectedSpfScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSpfScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('spf', expectedSpfScan._key),
                endCursor: toGlobalId('spf', expectedSpfScan._key),
              },
            }

            expect(spfScans).toEqual(expectedStructure)
          })
        })
        describe('direction is set to DESC', () => {
          it('returns spf scan', async () => {
            const loader = spfLoaderByKey(query, user._key, i18n)
            const expectedSpfScan = await loader.load(spfTwo._key)

            const connectionLoader = spfLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('spf', spfThree._key),
              before: toGlobalId('spf', spfOne._key),
              orderBy: {
                field: 'spf-default',
                direction: 'DESC',
              },
            }

            const spfScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('spf', expectedSpfScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSpfScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('spf', expectedSpfScan._key),
                endCursor: toGlobalId('spf', expectedSpfScan._key),
              },
            }

            expect(spfScans).toEqual(expectedStructure)
          })
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
          i18n,
        )

        const connectionArgs = {
          first: 5,
        }

        const spfScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [],
          totalCount: 0,
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
  describe('users language is set to english', () => {
    beforeAll(() => {
      i18n = setupI18n({
        locale: 'en',
        localeData: {
          en: { plurals: {} },
          fr: { plurals: {} },
        },
        locales: ['en', 'fr'],
        messages: {
          en: englishMessages.messages,
          fr: frenchMessages.messages,
        },
      })
    })
    describe('given a unsuccessful load', () => {
      describe('first and last arguments are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = spfLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {}

          try {
            await connectionLoader({
              domainId: domain._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'You must provide a `first` or `last` value to properly paginate the `spf` connection.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: spfLoaderConnectionsByDomainId.`,
          ])
        })
      })
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = spfLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
            i18n,
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
                'Passing both `first` and `last` to paginate the `spf` connection is not supported.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: spfLoaderConnectionsByDomainId.`,
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = spfLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              first: -1,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`first` on the `spf` connection cannot be less than zero.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: spfLoaderConnectionsByDomainId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = spfLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              last: -5,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`last` on the `spf` connection cannot be less than zero.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: spfLoaderConnectionsByDomainId.`,
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = spfLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              first: 1000,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting 1000 records on the `spf` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 1000 for: spfLoaderConnectionsByDomainId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = spfLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              last: 500,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting 500 records on the `spf` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: spfLoaderConnectionsByDomainId.`,
            ])
          })
        })
      })
      describe('limits are not set to numbers', () => {
        describe('first limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when first set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = spfLoaderConnectionsByDomainId(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

              const connectionArgs = {
                first: invalidInput,
              }

              try {
                await connectionLoader({
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(
                  new Error(
                    `\`first\` must be of type \`number\` not \`${typeof invalidInput}\`.`,
                  ),
                )
              }
              expect(consoleWarnOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: spfLoaderConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = spfLoaderConnectionsByDomainId(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

              const connectionArgs = {
                last: invalidInput,
              }

              try {
                await connectionLoader({
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(
                  new Error(
                    `\`last\` must be of type \`number\` not \`${typeof invalidInput}\`.`,
                  ),
                )
              }
              expect(consoleWarnOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: spfLoaderConnectionsByDomainId.`,
              ])
            })
          })
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
          i18n,
        )

        const connectionArgs = {
          first: 5,
        }

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
          next() {
            throw new Error('Cursor Error Occurred.')
          },
        }
        const query = jest.fn().mockReturnValueOnce(cursor)

        const connectionLoader = spfLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const connectionArgs = {
          first: 5,
        }

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
  describe('users language is set to french', () => {
    beforeAll(() => {
      i18n = setupI18n({
        locale: 'fr',
        localeData: {
          en: { plurals: {} },
          fr: { plurals: {} },
        },
        locales: ['en', 'fr'],
        messages: {
          en: englishMessages.messages,
          fr: frenchMessages.messages,
        },
      })
    })
    describe('given a unsuccessful load', () => {
      describe('first and last arguments are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = spfLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {}

          try {
            await connectionLoader({
              domainId: domain._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: spfLoaderConnectionsByDomainId.`,
          ])
        })
      })
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = spfLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
            i18n,
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
            expect(err).toEqual(new Error('todo'))
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: spfLoaderConnectionsByDomainId.`,
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = spfLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              first: -1,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: spfLoaderConnectionsByDomainId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = spfLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              last: -5,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: spfLoaderConnectionsByDomainId.`,
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = spfLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              first: 1000,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 1000 for: spfLoaderConnectionsByDomainId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = spfLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              last: 500,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: spfLoaderConnectionsByDomainId.`,
            ])
          })
        })
      })
      describe('limits are not set to numbers', () => {
        describe('first limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when first set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = spfLoaderConnectionsByDomainId(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

              const connectionArgs = {
                first: invalidInput,
              }

              try {
                await connectionLoader({
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error(`todo`))
              }
              expect(consoleWarnOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: spfLoaderConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = spfLoaderConnectionsByDomainId(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

              const connectionArgs = {
                last: invalidInput,
              }

              try {
                await connectionLoader({
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error(`todo`))
              }
              expect(consoleWarnOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: spfLoaderConnectionsByDomainId.`,
              ])
            })
          })
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
          i18n,
        )

        const connectionArgs = {
          first: 5,
        }

        try {
          await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to get spf information for ${domain._id}, error: Error: Database Error Occurred.`,
        ])
      })
    })
    describe('cursor error occurs', () => {
      it('throws an error', async () => {
        const cursor = {
          next() {
            throw new Error('Cursor Error Occurred.')
          },
        }
        const query = jest.fn().mockReturnValueOnce(cursor)

        const connectionLoader = spfLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const connectionArgs = {
          first: 5,
        }

        try {
          await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to get spf information for ${domain._id}, error: Error: Cursor Error Occurred.`,
        ])
      })
    })
  })
})
