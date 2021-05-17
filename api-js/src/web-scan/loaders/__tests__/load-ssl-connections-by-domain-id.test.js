import { stringify } from 'jest-matcher-utils'
import { ensure, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { cleanseInput } from '../../../validators'
import { loadSslByKey, loadSslConnectionByDomainId } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the load ssl connection function', () => {
  let query, drop, truncate, collections, user, domain, i18n, sslScan1, sslScan2

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
        type: 'database',
        name: dbNameFromFile(__filename),
        url,
        rootPassword: rootPass,
        options: databaseOptions({ rootPass }),
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
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('using after cursor', () => {
      it('returns ssl scan(s) after a given node id', async () => {
        const connectionLoader = loadSslConnectionByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const sslLoader = loadSslByKey({ query, i18n })
        const expectedSslScans = await sslLoader.loadMany([
          sslScan1._key,
          sslScan2._key,
        ])

        expectedSslScans[0].id = expectedSslScans[0]._key
        expectedSslScans[0].domainId = domain._id

        expectedSslScans[1].id = expectedSslScans[1]._key
        expectedSslScans[1].domainId = domain._id

        const connectionArgs = {
          first: 5,
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
          totalCount: 2,
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
    describe('using before cursor', () => {
      it('returns ssl scan(s) before a given node id', async () => {
        const connectionLoader = loadSslConnectionByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const sslLoader = loadSslByKey({ query, i18n })
        const expectedSslScans = await sslLoader.loadMany([
          sslScan1._key,
          sslScan2._key,
        ])

        expectedSslScans[0].id = expectedSslScans[0]._key
        expectedSslScans[0].domainId = domain._id

        expectedSslScans[1].id = expectedSslScans[1]._key
        expectedSslScans[1].domainId = domain._id

        const connectionArgs = {
          first: 5,
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
          totalCount: 2,
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
    describe('using first limit', () => {
      it('returns the first n amount of ssl scan(s)', async () => {
        const connectionLoader = loadSslConnectionByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const sslLoader = loadSslByKey({ query, i18n })
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
          totalCount: 2,
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
        const connectionLoader = loadSslConnectionByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const sslLoader = loadSslByKey({ query, i18n })
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
          totalCount: 2,
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
          const connectionLoader = loadSslConnectionByDomainId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const sslLoader = loadSslByKey({ query })
          const expectedSslScans = await sslLoader.loadMany([
            sslScan2._key,
            sslScan3._key,
          ])

          expectedSslScans[0].id = expectedSslScans[0]._key
          expectedSslScans[0].domainId = domain._id

          expectedSslScans[1].id = expectedSslScans[1]._key
          expectedSslScans[1].domainId = domain._id

          const connectionArgs = {
            first: 5,
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
            totalCount: 3,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId('ssl', expectedSslScans[0]._key),
              endCursor: toGlobalId('ssl', expectedSslScans[1]._key),
            },
          }

          expect(sslScans).toEqual(expectedStructure)
        })
      })
      describe('using end date filter', () => {
        it('returns ssl scans at and before the end date', async () => {
          const connectionLoader = loadSslConnectionByDomainId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const sslLoader = loadSslByKey({ query, i18n })
          const expectedSslScans = await sslLoader.loadMany([
            sslScan1._key,
            sslScan2._key,
          ])

          expectedSslScans[0].id = expectedSslScans[0]._key
          expectedSslScans[0].domainId = domain._id

          expectedSslScans[1].id = expectedSslScans[1]._key
          expectedSslScans[1].domainId = domain._id

          const connectionArgs = {
            first: 5,
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
            totalCount: 3,
            pageInfo: {
              hasNextPage: true,
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
          const connectionLoader = loadSslConnectionByDomainId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const sslLoader = loadSslByKey({ query, i18n })
          const expectedSslScans = await sslLoader.loadMany([sslScan2._key])

          expectedSslScans[0].id = expectedSslScans[0]._key
          expectedSslScans[0].domainId = domain._id

          const connectionArgs = {
            first: 5,
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
            totalCount: 3,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: true,
              startCursor: toGlobalId('ssl', expectedSslScans[0]._key),
              endCursor: toGlobalId('ssl', expectedSslScans[0]._key),
            },
          }

          expect(sslScans).toEqual(expectedStructure)
        })
      })
    })
    describe('using the orderBy field', () => {
      let sslOne, sslTwo, sslThree
      beforeEach(async () => {
        await truncate()
        domain = await collections.domains.save({
          domain: 'test.domain.gc.ca',
        })
        sslOne = await collections.ssl.save({
          acceptable_ciphers: ['a'],
          acceptable_curves: ['a'],
          ccs_injection_vulnerable: false,
          heartbleed_vulnerable: false,
          strong_ciphers: ['a'],
          strong_curves: ['a'],
          supports_ecdh_key_exchange: false,
          timestamp: '2021-01-26 23:29:19.652119',
          weak_ciphers: ['a'],
          weak_curves: ['a'],
        })
        sslTwo = await collections.ssl.save({
          acceptable_ciphers: ['b'],
          acceptable_curves: ['b'],
          ccs_injection_vulnerable: false,
          heartbleed_vulnerable: false,
          strong_ciphers: ['b'],
          strong_curves: ['b'],
          supports_ecdh_key_exchange: false,
          timestamp: '2021-01-27 23:29:19.652119',
          weak_ciphers: ['b'],
          weak_curves: ['b'],
        })
        sslThree = await collections.ssl.save({
          acceptable_ciphers: ['c'],
          acceptable_curves: ['c'],
          ccs_injection_vulnerable: false,
          heartbleed_vulnerable: false,
          strong_ciphers: ['c'],
          strong_curves: ['c'],
          supports_ecdh_key_exchange: false,
          timestamp: '2021-01-28 23:29:19.652119',
          weak_ciphers: ['c'],
          weak_curves: ['c'],
        })
        await collections.domainsSSL.save({
          _to: sslOne._id,
          _from: domain._id,
        })
        await collections.domainsSSL.save({
          _to: sslTwo._id,
          _from: domain._id,
        })
        await collections.domainsSSL.save({
          _to: sslThree._id,
          _from: domain._id,
        })
      })
      describe('ordering on ACCEPTABLE_CIPHERS', () => {
        describe('direction is set to ASC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslOne._key),
              before: toGlobalId('ssl', sslThree._key),
              orderBy: {
                field: 'acceptable-ciphers',
                direction: 'ASC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
        describe('ordering is set to DESC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslThree._key),
              before: toGlobalId('ssl', sslOne._key),
              orderBy: {
                field: 'acceptable-ciphers',
                direction: 'DESC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on ACCEPTABLE_CURVES', () => {
        describe('direction is set to ASC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslOne._key),
              before: toGlobalId('ssl', sslThree._key),
              orderBy: {
                field: 'acceptable-curves',
                direction: 'ASC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
        describe('ordering is set to DESC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslThree._key),
              before: toGlobalId('ssl', sslOne._key),
              orderBy: {
                field: 'acceptable-curves',
                direction: 'DESC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on CCS_INJECTION_VULNERABLE', () => {
        describe('direction is set to ASC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslOne._key),
              before: toGlobalId('ssl', sslThree._key),
              orderBy: {
                field: 'ccs-injection-vulnerable',
                direction: 'ASC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
        describe('ordering is set to DESC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslOne._key),
              before: toGlobalId('ssl', sslThree._key),
              orderBy: {
                field: 'ccs-injection-vulnerable',
                direction: 'DESC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on HEARTBLEED_VULNERABLE', () => {
        describe('direction is set to ASC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslOne._key),
              before: toGlobalId('ssl', sslThree._key),
              orderBy: {
                field: 'heartbleed-vulnerable',
                direction: 'ASC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
        describe('ordering is set to DESC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslOne._key),
              before: toGlobalId('ssl', sslThree._key),
              orderBy: {
                field: 'heartbleed-vulnerable',
                direction: 'DESC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on STRONG_CIPHERS', () => {
        describe('direction is set to ASC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslOne._key),
              before: toGlobalId('ssl', sslThree._key),
              orderBy: {
                field: 'strong-ciphers',
                direction: 'ASC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
        describe('ordering is set to DESC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslThree._key),
              before: toGlobalId('ssl', sslOne._key),
              orderBy: {
                field: 'strong-ciphers',
                direction: 'DESC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on STRONG_CURVES', () => {
        describe('direction is set to ASC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslOne._key),
              before: toGlobalId('ssl', sslThree._key),
              orderBy: {
                field: 'strong-curves',
                direction: 'ASC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
        describe('ordering is set to DESC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslThree._key),
              before: toGlobalId('ssl', sslOne._key),
              orderBy: {
                field: 'strong-curves',
                direction: 'DESC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on SUPPORTS_ECDH_KEY_EXCHANGE', () => {
        describe('direction is set to ASC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslOne._key),
              before: toGlobalId('ssl', sslThree._key),
              orderBy: {
                field: 'supports-ecdh-key-exchange',
                direction: 'ASC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
        describe('ordering is set to DESC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslOne._key),
              before: toGlobalId('ssl', sslThree._key),
              orderBy: {
                field: 'supports-ecdh-key-exchange',
                direction: 'DESC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on TIMESTAMP', () => {
        describe('direction is set to ASC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslOne._key),
              before: toGlobalId('ssl', sslThree._key),
              orderBy: {
                field: 'timestamp',
                direction: 'ASC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
        describe('ordering is set to DESC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslThree._key),
              before: toGlobalId('ssl', sslOne._key),
              orderBy: {
                field: 'timestamp',
                direction: 'DESC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on WEAK_CIPHERS', () => {
        describe('direction is set to ASC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslOne._key),
              before: toGlobalId('ssl', sslThree._key),
              orderBy: {
                field: 'weak-ciphers',
                direction: 'ASC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
        describe('ordering is set to DESC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslThree._key),
              before: toGlobalId('ssl', sslOne._key),
              orderBy: {
                field: 'weak-ciphers',
                direction: 'DESC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on WEAK_CURVES', () => {
        describe('direction is set to ASC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslOne._key),
              before: toGlobalId('ssl', sslThree._key),
              orderBy: {
                field: 'weak-curves',
                direction: 'ASC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
        describe('ordering is set to DESC', () => {
          it('returns ssl scan', async () => {
            const loader = loadSslByKey({ query, userKey: user._key, i18n })
            const expectedSslScan = await loader.load(sslTwo._key)

            const connectionLoader = loadSslConnectionByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('ssl', sslThree._key),
              before: toGlobalId('ssl', sslOne._key),
              orderBy: {
                field: 'weak-curves',
                direction: 'DESC',
              },
            }

            const sslScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('ssl', expectedSslScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedSslScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('ssl', expectedSslScan._key),
                endCursor: toGlobalId('ssl', expectedSslScan._key),
              },
            }

            expect(sslScans).toEqual(expectedStructure)
          })
        })
      })
    })
    describe('no ssl scans are found', () => {
      it('returns an empty structure', async () => {
        await truncate()

        const connectionLoader = loadSslConnectionByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const connectionArgs = {
          first: 5,
        }

        const sslScans = await connectionLoader({
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

        expect(sslScans).toEqual(expectedStructure)
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
          const connectionLoader = loadSslConnectionByDomainId({
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
                'You must provide a `first` or `last` value to properly paginate the `SSL` connection.',
              ),
            )
          }

          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadSslConnectionByDomainId.`,
          ])
        })
      })
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadSslConnectionByDomainId({
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
                'Passing both `first` and `last` to paginate the `SSL` connection is not supported.',
              ),
            )
          }

          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} tried to have \`first\` and \`last\` arguments set for: loadSslConnectionByDomainId.`,
          ])
        })
      })
      describe('both limits are below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadSslConnectionByDomainId({
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
                  '`first` on the `SSL` connection cannot be less than zero.',
                ),
              )
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadSslConnectionByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadSslConnectionByDomainId({
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
                  '`last` on the `SSL` connection cannot be less than zero.',
                ),
              )
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadSslConnectionByDomainId.`,
            ])
          })
        })
      })
      describe('both limits are above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadSslConnectionByDomainId({
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
                  'Requesting 101 records on the `SSL` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 101 for: loadSslConnectionByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadSslConnectionByDomainId({
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
                  'Requesting 500 records on the `SSL` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: loadSslConnectionByDomainId.`,
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
              const connectionLoader = loadSslConnectionByDomainId({
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
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadSslConnectionByDomainId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = loadSslConnectionByDomainId({
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
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadSslConnectionByDomainId.`,
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

        const connectionLoader = loadSslConnectionByDomainId({
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
            new Error('Unable to load SSL scan(s). Please try again.'),
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
          next() {
            throw new Error('Cursor Error Occurred.')
          },
        }
        const query = jest.fn().mockReturnValueOnce(cursor)

        const connectionLoader = loadSslConnectionByDomainId({
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
            new Error('Unable to load SSL scan(s). Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to get ssl information for ${domain._id}, error: Error: Cursor Error Occurred.`,
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
          const connectionLoader = loadSslConnectionByDomainId({
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
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadSslConnectionByDomainId.`,
          ])
        })
      })
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadSslConnectionByDomainId({
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
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} tried to have \`first\` and \`last\` arguments set for: loadSslConnectionByDomainId.`,
          ])
        })
      })
      describe('both limits are below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadSslConnectionByDomainId({
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
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadSslConnectionByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadSslConnectionByDomainId({
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
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadSslConnectionByDomainId.`,
            ])
          })
        })
      })
      describe('both limits are above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadSslConnectionByDomainId({
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
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 101 for: loadSslConnectionByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadSslConnectionByDomainId({
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
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: loadSslConnectionByDomainId.`,
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
              const connectionLoader = loadSslConnectionByDomainId({
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
                expect(err).toEqual(new Error(`todo`))
              }
              expect(consoleWarnOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadSslConnectionByDomainId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = loadSslConnectionByDomainId({
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
                expect(err).toEqual(new Error(`todo`))
              }
              expect(consoleWarnOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadSslConnectionByDomainId.`,
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

        const connectionLoader = loadSslConnectionByDomainId({
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
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to get ssl information for ${domain._id}, error: Error: Database Error Occurred.`,
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

        const connectionLoader = loadSslConnectionByDomainId({
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
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to get ssl information for ${domain._id}, error: Error: Cursor Error Occurred.`,
        ])
      })
    })
  })
})
