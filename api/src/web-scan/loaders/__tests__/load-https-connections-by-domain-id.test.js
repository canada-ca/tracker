import { stringify } from 'jest-matcher-utils'
import { ensure, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput } from '../../../validators'
import { loadHttpsConnectionsByDomainId, loadHttpsByKey } from '../index'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the load https connection function', () => {
  let query,
    drop,
    truncate,
    collections,
    user,
    domain,
    i18n,
    httpsScan1,
    httpsScan2

  const consoleWarnOutput = []
  const mockedWarn = (output) => consoleWarnOutput.push(output)

  const consoleErrorOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)

  beforeAll(() => {
    console.warn = mockedWarn
    console.error = mockedError
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

  afterEach(() => {
    consoleWarnOutput.length = 0
    consoleErrorOutput.length = 0
  })

  describe('given a successful load', () => {
    beforeAll(async () => {
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
    })
    beforeEach(async () => {
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
      httpsScan1 = await collections.https.save({
        timestamp: '2020-10-02T12:43:39Z',
      })
      httpsScan2 = await collections.https.save({
        timestamp: '2020-10-03T12:43:39Z',
      })
      await collections.domainsHTTPS.save({
        _to: httpsScan1._id,
        _from: domain._id,
      })
      await collections.domainsHTTPS.save({
        _to: httpsScan2._id,
        _from: domain._id,
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('using after cursor', () => {
      it('returns https scan(s) after a given node id', async () => {
        const connectionLoader = loadHttpsConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const httpsLoader = loadHttpsByKey({ query, i18n })
        const expectedHttpsScans = await httpsLoader.loadMany([
          httpsScan1._key,
          httpsScan2._key,
        ])

        expectedHttpsScans[0].id = expectedHttpsScans[0]._key
        expectedHttpsScans[0].domainId = domain._id

        expectedHttpsScans[1].id = expectedHttpsScans[1]._key
        expectedHttpsScans[1].domainId = domain._id

        const connectionArgs = {
          first: 5,
          after: toGlobalId('https', expectedHttpsScans[0]._key),
        }

        const httpsScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('https', expectedHttpsScans[1]._key),
              node: {
                ...expectedHttpsScans[1],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('https', expectedHttpsScans[1]._key),
            endCursor: toGlobalId('https', expectedHttpsScans[1]._key),
          },
        }

        expect(httpsScans).toEqual(expectedStructure)
      })
    })
    describe('using before cursor', () => {
      it('returns https scan(s) before a given node id', async () => {
        const connectionLoader = loadHttpsConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const httpsLoader = loadHttpsByKey({ query, i18n })
        const expectedHttpsScans = await httpsLoader.loadMany([
          httpsScan1._key,
          httpsScan2._key,
        ])

        expectedHttpsScans[0].id = expectedHttpsScans[0]._key
        expectedHttpsScans[0].domainId = domain._id

        expectedHttpsScans[1].id = expectedHttpsScans[1]._key
        expectedHttpsScans[1].domainId = domain._id

        const connectionArgs = {
          first: 5,
          before: toGlobalId('https', expectedHttpsScans[1]._key),
        }

        const httpsScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('https', expectedHttpsScans[0]._key),
              node: {
                ...expectedHttpsScans[0],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('https', expectedHttpsScans[0]._key),
            endCursor: toGlobalId('https', expectedHttpsScans[0]._key),
          },
        }

        expect(httpsScans).toEqual(expectedStructure)
      })
    })
    describe('using first limit', () => {
      it('returns the first n amount of https scan(s)', async () => {
        const connectionLoader = loadHttpsConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const httpsLoader = loadHttpsByKey({ query, i18n })
        const expectedHttpsScans = await httpsLoader.loadMany([
          httpsScan1._key,
          httpsScan2._key,
        ])

        expectedHttpsScans[0].id = expectedHttpsScans[0]._key
        expectedHttpsScans[0].domainId = domain._id

        expectedHttpsScans[1].id = expectedHttpsScans[1]._key
        expectedHttpsScans[1].domainId = domain._id

        const connectionArgs = {
          first: 1,
        }

        const httpsScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('https', expectedHttpsScans[0]._key),
              node: {
                ...expectedHttpsScans[0],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('https', expectedHttpsScans[0]._key),
            endCursor: toGlobalId('https', expectedHttpsScans[0]._key),
          },
        }

        expect(httpsScans).toEqual(expectedStructure)
      })
    })
    describe('using last limit', () => {
      it('returns the last n amount of https scan(s)', async () => {
        const connectionLoader = loadHttpsConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const httpsLoader = loadHttpsByKey({ query, i18n })
        const expectedHttpsScans = await httpsLoader.loadMany([
          httpsScan1._key,
          httpsScan2._key,
        ])

        expectedHttpsScans[0].id = expectedHttpsScans[0]._key
        expectedHttpsScans[0].domainId = domain._id

        expectedHttpsScans[1].id = expectedHttpsScans[1]._key
        expectedHttpsScans[1].domainId = domain._id

        const connectionArgs = {
          last: 1,
        }

        const httpsScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('https', expectedHttpsScans[1]._key),
              node: {
                ...expectedHttpsScans[1],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('https', expectedHttpsScans[1]._key),
            endCursor: toGlobalId('https', expectedHttpsScans[1]._key),
          },
        }

        expect(httpsScans).toEqual(expectedStructure)
      })
    })
    describe('using date filter', () => {
      let httpsScan3
      beforeEach(async () => {
        httpsScan3 = await collections.https.save({
          timestamp: '2020-10-04T12:43:39Z',
        })
        await collections.domainsHTTPS.save({
          _to: httpsScan3._id,
          _from: domain._id,
        })
      })
      describe('using start date filter', () => {
        it('returns https scans at and after the start date', async () => {
          const connectionLoader = loadHttpsConnectionsByDomainId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const httpsLoader = loadHttpsByKey({ query, i18n })
          const expectedHttpsScans = await httpsLoader.loadMany([
            httpsScan2._key,
            httpsScan3._key,
          ])

          expectedHttpsScans[0].id = expectedHttpsScans[0]._key
          expectedHttpsScans[0].domainId = domain._id

          expectedHttpsScans[1].id = expectedHttpsScans[1]._key
          expectedHttpsScans[1].domainId = domain._id

          const connectionArgs = {
            first: 5,
            startDate: '2020-10-03',
          }

          const httpsScans = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('https', expectedHttpsScans[0]._key),
                node: {
                  ...expectedHttpsScans[0],
                },
              },
              {
                cursor: toGlobalId('https', expectedHttpsScans[1]._key),
                node: {
                  ...expectedHttpsScans[1],
                },
              },
            ],
            totalCount: 3,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId('https', expectedHttpsScans[0]._key),
              endCursor: toGlobalId('https', expectedHttpsScans[1]._key),
            },
          }

          expect(httpsScans).toEqual(expectedStructure)
        })
      })
      describe('using end date filter', () => {
        it('returns https scans at and before the end date', async () => {
          const connectionLoader = loadHttpsConnectionsByDomainId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const httpsLoader = await loadHttpsByKey({ query, i18n })
          const expectedHttpsScans = await httpsLoader.loadMany([
            httpsScan1._key,
            httpsScan2._key,
          ])

          expectedHttpsScans[0].id = expectedHttpsScans[0]._key
          expectedHttpsScans[0].domainId = domain._id

          expectedHttpsScans[1].id = expectedHttpsScans[1]._key
          expectedHttpsScans[1].domainId = domain._id

          const connectionArgs = {
            first: 5,
            endDate: '2020-10-03T13:50:00Z',
          }

          const httpsScans = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('https', expectedHttpsScans[0]._key),
                node: {
                  ...expectedHttpsScans[0],
                },
              },
              {
                cursor: toGlobalId('https', expectedHttpsScans[1]._key),
                node: {
                  ...expectedHttpsScans[1],
                },
              },
            ],
            totalCount: 3,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: toGlobalId('https', expectedHttpsScans[0]._key),
              endCursor: toGlobalId('https', expectedHttpsScans[1]._key),
            },
          }

          expect(httpsScans).toEqual(expectedStructure)
        })
      })
      describe('using start and end date filters', () => {
        it('returns a scan on a specific date', async () => {
          const connectionLoader = loadHttpsConnectionsByDomainId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const httpsLoader = loadHttpsByKey({ query, i18n })
          const expectedHttpsScans = await httpsLoader.loadMany([
            httpsScan2._key,
          ])

          expectedHttpsScans[0].id = expectedHttpsScans[0]._key
          expectedHttpsScans[0].domainId = domain._id

          const connectionArgs = {
            first: 5,
            startDate: '2020-10-03T00:00:00Z',
            endDate: '2020-10-03T23:59:59Z',
          }

          const httpsScans = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('https', expectedHttpsScans[0]._key),
                node: {
                  ...expectedHttpsScans[0],
                },
              },
            ],
            totalCount: 3,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: true,
              startCursor: toGlobalId('https', expectedHttpsScans[0]._key),
              endCursor: toGlobalId('https', expectedHttpsScans[0]._key),
            },
          }

          expect(httpsScans).toEqual(expectedStructure)
        })
      })
    })
    describe('using the orderBy field', () => {
      let httpsOne, httpsTwo, httpsThree
      beforeEach(async () => {
        await truncate()
        domain = await collections.domains.save({
          domain: 'test.domain.gc.ca',
          slug: 'test-domain-gc-ca',
        })
        httpsOne = await collections.https.save({
          timestamp: '2021-01-26 23:24:34.506578Z',
          implementation: 'Bad Chain',
          enforced: 'Moderate',
          hsts: 'HSTS Fully Implemented',
          hstsAge: 31536000,
          preloaded: 'HSTS Not Preloaded',
        })
        httpsTwo = await collections.https.save({
          timestamp: '2021-01-27 23:24:34.506578Z',
          implementation: 'Bad Hostname',
          enforced: 'Strict',
          hsts: 'HSTS Max Age Too Short',
          hstsAge: 31536001,
          preloaded: 'HSTS Preload Ready',
        })
        httpsThree = await collections.https.save({
          timestamp: '2021-01-28 23:24:34.506578Z',
          implementation: 'Valid HTTPS',
          enforced: 'Weak',
          hsts: 'No HSTS',
          hstsAge: 31536002,
          preloaded: 'HSTS Preloaded',
        })
        await collections.domainsHTTPS.save({
          _to: httpsOne._id,
          _from: domain._id,
        })
        await collections.domainsHTTPS.save({
          _to: httpsTwo._id,
          _from: domain._id,
        })
        await collections.domainsHTTPS.save({
          _to: httpsThree._id,
          _from: domain._id,
        })
      })
      describe('ordering on TIMESTAMP', () => {
        describe('direction is set to ASC', () => {
          it('returns https scans', async () => {
            const loader = loadHttpsByKey({ query, userKey: user._key, i18n })
            const expectedHttpsScan = await loader.load(httpsTwo._key)

            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('https', httpsOne._key),
              before: toGlobalId('https', httpsThree._key),
              orderBy: {
                field: 'timestamp',
                direction: 'ASC',
              },
            }

            const httpsScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('https', expectedHttpsScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedHttpsScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('https', expectedHttpsScan._key),
                endCursor: toGlobalId('https', expectedHttpsScan._key),
              },
            }

            expect(httpsScans).toEqual(expectedStructure)
          })
        })
        describe('direction is set to DESC', () => {
          it('returns https scans', async () => {
            const loader = loadHttpsByKey({ query, userKey: user._key, i18n })
            const expectedHttpsScan = await loader.load(httpsTwo._key)

            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('https', httpsThree._key),
              before: toGlobalId('https', httpsOne._key),
              orderBy: {
                field: 'timestamp',
                direction: 'DESC',
              },
            }

            const httpsScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('https', expectedHttpsScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedHttpsScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('https', expectedHttpsScan._key),
                endCursor: toGlobalId('https', expectedHttpsScan._key),
              },
            }

            expect(httpsScans).toEqual(expectedStructure)
          })
        })
      })
      describe('order on IMPLEMENTATION', () => {
        describe('direction is set to ASC', () => {
          it('returns https scans', async () => {
            const loader = loadHttpsByKey({ query, userKey: user._key, i18n })
            const expectedHttpsScan = await loader.load(httpsTwo._key)

            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('https', httpsOne._key),
              before: toGlobalId('https', httpsThree._key),
              orderBy: {
                field: 'implementation',
                direction: 'ASC',
              },
            }

            const httpsScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('https', expectedHttpsScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedHttpsScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('https', expectedHttpsScan._key),
                endCursor: toGlobalId('https', expectedHttpsScan._key),
              },
            }

            expect(httpsScans).toEqual(expectedStructure)
          })
        })
        describe('direction is set to DESC', () => {
          it('returns https scans', async () => {
            const loader = loadHttpsByKey({ query, userKey: user._key, i18n })
            const expectedHttpsScan = await loader.load(httpsTwo._key)

            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('https', httpsThree._key),
              before: toGlobalId('https', httpsOne._key),
              orderBy: {
                field: 'implementation',
                direction: 'DESC',
              },
            }

            const httpsScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('https', expectedHttpsScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedHttpsScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('https', expectedHttpsScan._key),
                endCursor: toGlobalId('https', expectedHttpsScan._key),
              },
            }

            expect(httpsScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on ENFORCED', () => {
        describe('direction is set to ASC', () => {
          it('returns https scans', async () => {
            const loader = loadHttpsByKey({ query, userKey: user._key, i18n })
            const expectedHttpsScan = await loader.load(httpsTwo._key)

            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('https', httpsOne._key),
              before: toGlobalId('https', httpsThree._key),
              orderBy: {
                field: 'enforced',
                direction: 'ASC',
              },
            }

            const httpsScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('https', expectedHttpsScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedHttpsScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('https', expectedHttpsScan._key),
                endCursor: toGlobalId('https', expectedHttpsScan._key),
              },
            }

            expect(httpsScans).toEqual(expectedStructure)
          })
        })
        describe('direction is set to DESC', () => {
          it('returns https scans', async () => {
            const loader = loadHttpsByKey({ query, userKey: user._key, i18n })
            const expectedHttpsScan = await loader.load(httpsTwo._key)

            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('https', httpsThree._key),
              before: toGlobalId('https', httpsOne._key),
              orderBy: {
                field: 'enforced',
                direction: 'DESC',
              },
            }

            const httpsScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('https', expectedHttpsScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedHttpsScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('https', expectedHttpsScan._key),
                endCursor: toGlobalId('https', expectedHttpsScan._key),
              },
            }

            expect(httpsScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on HSTS', () => {
        describe('direction is set to ASC', () => {
          it('returns https scans', async () => {
            const loader = loadHttpsByKey({ query, userKey: user._key, i18n })
            const expectedHttpsScan = await loader.load(httpsTwo._key)

            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('https', httpsOne._key),
              before: toGlobalId('https', httpsThree._key),
              orderBy: {
                field: 'hsts',
                direction: 'ASC',
              },
            }

            const httpsScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('https', expectedHttpsScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedHttpsScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('https', expectedHttpsScan._key),
                endCursor: toGlobalId('https', expectedHttpsScan._key),
              },
            }

            expect(httpsScans).toEqual(expectedStructure)
          })
        })
        describe('direction is set to DESC', () => {
          it('returns https scans', async () => {
            const loader = loadHttpsByKey({ query, userKey: user._key, i18n })
            const expectedHttpsScan = await loader.load(httpsTwo._key)

            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('https', httpsThree._key),
              before: toGlobalId('https', httpsOne._key),
              orderBy: {
                field: 'hsts',
                direction: 'DESC',
              },
            }

            const httpsScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('https', expectedHttpsScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedHttpsScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('https', expectedHttpsScan._key),
                endCursor: toGlobalId('https', expectedHttpsScan._key),
              },
            }

            expect(httpsScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on HSTS_AGE', () => {
        describe('direction is set to ASC', () => {
          it('returns https scans', async () => {
            const loader = loadHttpsByKey({ query, userKey: user._key, i18n })
            const expectedHttpsScan = await loader.load(httpsTwo._key)

            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('https', httpsOne._key),
              before: toGlobalId('https', httpsThree._key),
              orderBy: {
                field: 'hsts-age',
                direction: 'ASC',
              },
            }

            const httpsScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('https', expectedHttpsScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedHttpsScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('https', expectedHttpsScan._key),
                endCursor: toGlobalId('https', expectedHttpsScan._key),
              },
            }

            expect(httpsScans).toEqual(expectedStructure)
          })
        })
        describe('direction is set to DESC', () => {
          it('returns https scans', async () => {
            const loader = loadHttpsByKey({ query, userKey: user._key, i18n })
            const expectedHttpsScan = await loader.load(httpsTwo._key)

            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('https', httpsThree._key),
              before: toGlobalId('https', httpsOne._key),
              orderBy: {
                field: 'hsts-age',
                direction: 'DESC',
              },
            }

            const httpsScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('https', expectedHttpsScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedHttpsScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('https', expectedHttpsScan._key),
                endCursor: toGlobalId('https', expectedHttpsScan._key),
              },
            }

            expect(httpsScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on PRELOADED', () => {
        describe('direction is set to ASC', () => {
          it('returns https scans', async () => {
            const loader = loadHttpsByKey({ query, userKey: user._key, i18n })
            const expectedHttpsScan = await loader.load(httpsTwo._key)

            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('https', httpsOne._key),
              before: toGlobalId('https', httpsThree._key),
              orderBy: {
                field: 'preloaded',
                direction: 'ASC',
              },
            }

            const httpsScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('https', expectedHttpsScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedHttpsScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('https', expectedHttpsScan._key),
                endCursor: toGlobalId('https', expectedHttpsScan._key),
              },
            }

            expect(httpsScans).toEqual(expectedStructure)
          })
        })
        describe('direction is set to DESC', () => {
          it('returns https scans', async () => {
            const loader = loadHttpsByKey({ query, userKey: user._key, i18n })
            const expectedHttpsScan = await loader.load(httpsTwo._key)

            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('https', httpsThree._key),
              before: toGlobalId('https', httpsOne._key),
              orderBy: {
                field: 'preloaded',
                direction: 'DESC',
              },
            }

            const httpsScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('https', expectedHttpsScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedHttpsScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('https', expectedHttpsScan._key),
                endCursor: toGlobalId('https', expectedHttpsScan._key),
              },
            }

            expect(httpsScans).toEqual(expectedStructure)
          })
        })
      })
    })
    describe('no https scans are found', () => {
      it('returns an empty structure', async () => {
        await truncate()

        const connectionLoader = loadHttpsConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const connectionArgs = {
          first: 5,
        }

        const httpsScans = await connectionLoader({
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

        expect(httpsScans).toEqual(expectedStructure)
      })
    })
  })
  describe('language is set to english', () => {
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
    describe('given an unsuccessful load', () => {
      describe('both limits are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadHttpsConnectionsByDomainId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {}

          try {
            await connectionLoader({
              domainId: domain._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'You must provide a `first` or `last` value to properly paginate the `HTTPS` connection.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadHttpsConnectionsByDomainId.`,
          ])
        })
      })
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadHttpsConnectionsByDomainId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

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
                'Passing both `first` and `last` to paginate the `HTTPS` connection is not supported.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} tried to have \`first\` and \`last\` arguments set for: loadHttpsConnectionsByDomainId.`,
          ])
        })
      })
      describe('limits are below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

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
                  '`first` on the `HTTPS` connection cannot be less than zero.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadHttpsConnectionsByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

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
                  '`last` on the `HTTPS` connection cannot be less than zero.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadHttpsConnectionsByDomainId.`,
            ])
          })
        })
      })
      describe('limits are above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              first: 101,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting 101 records on the `HTTPS` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 101 for: loadHttpsConnectionsByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

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
                  'Requesting 500 records on the `HTTPS` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: loadHttpsConnectionsByDomainId.`,
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
              const connectionLoader = loadHttpsConnectionsByDomainId({
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                first: invalidInput,
              }

              try {
                await connectionLoader({
                  domainId: domain._id,
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
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadHttpsConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = loadHttpsConnectionsByDomainId({
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                last: invalidInput,
              }

              try {
                await connectionLoader({
                  domainId: domain._id,
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
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadHttpsConnectionsByDomainId.`,
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

        const connectionLoader = loadHttpsConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

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
            new Error('Unable to load HTTPS scan(s). Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to get https information for ${domain._id}, error: Error: Database Error Occurred.`,
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

        const connectionLoader = loadHttpsConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

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
            new Error('Unable to load HTTPS scan(s). Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to get https information for ${domain._id}, error: Error: Cursor Error Occurred.`,
        ])
      })
    })
  })
  describe('language is set to french', () => {
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
    describe('given an unsuccessful load', () => {
      describe('both limits are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadHttpsConnectionsByDomainId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {}

          try {
            await connectionLoader({
              domainId: domain._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Vous devez fournir une valeur `first` ou `last` pour paginer correctement la connexion `HTTPS`.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadHttpsConnectionsByDomainId.`,
          ])
        })
      })
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadHttpsConnectionsByDomainId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

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
                "Passer à la fois `first` et `last` pour paginer la connexion `HTTPS` n'est pas supporté.",
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} tried to have \`first\` and \`last\` arguments set for: loadHttpsConnectionsByDomainId.`,
          ])
        })
      })
      describe('limits are below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

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
                  '`first` sur la connexion `HTTPS` ne peut être inférieur à zéro.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadHttpsConnectionsByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

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
                  '`last` sur la connexion `HTTPS` ne peut être inférieur à zéro.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadHttpsConnectionsByDomainId.`,
            ])
          })
        })
      })
      describe('limits are above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              first: 101,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'La demande de 101 enregistrements sur la connexion `HTTPS` dépasse la limite `first` de 100 enregistrements.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 101 for: loadHttpsConnectionsByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadHttpsConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

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
                  'La demande de 500 enregistrements sur la connexion `HTTPS` dépasse la limite `last` de 100 enregistrements.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: loadHttpsConnectionsByDomainId.`,
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
              const connectionLoader = loadHttpsConnectionsByDomainId({
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                first: invalidInput,
              }

              try {
                await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(
                  new Error(
                    `\`first\` doit être de type \`number\` et non \`${typeof invalidInput}\`.`,
                  ),
                )
              }
              expect(consoleWarnOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadHttpsConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = loadHttpsConnectionsByDomainId({
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                last: invalidInput,
              }

              try {
                await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(
                  new Error(
                    `\`last\` doit être de type \`number\` et non \`${typeof invalidInput}\`.`,
                  ),
                )
              }
              expect(consoleWarnOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadHttpsConnectionsByDomainId.`,
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

        const connectionLoader = loadHttpsConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

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
            new Error(
              'Impossible de charger le(s) scan(s) HTTPS. Veuillez réessayer.',
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to get https information for ${domain._id}, error: Error: Database Error Occurred.`,
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

        const connectionLoader = loadHttpsConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

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
            new Error(
              'Impossible de charger le(s) scan(s) HTTPS. Veuillez réessayer.',
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to get https information for ${domain._id}, error: Error: Cursor Error Occurred.`,
        ])
      })
    })
  })
})
