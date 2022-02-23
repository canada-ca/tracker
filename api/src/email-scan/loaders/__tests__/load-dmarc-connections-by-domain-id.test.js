import { stringify } from 'jest-matcher-utils'
import { ensure, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput } from '../../../validators'
import { loadDmarcConnectionsByDomainId, loadDmarcByKey } from '../index'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('when given the load dmarc connection function', () => {
  let query,
    drop,
    truncate,
    collections,
    user,
    domain,
    dmarcScan1,
    dmarcScan2,
    i18n

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

  beforeEach(() => {
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
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('using after cursor', () => {
      it('returns dmarc scan(s) after a given node id', async () => {
        const connectionLoader = loadDmarcConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const dkimLoader = loadDmarcByKey({ query })
        const expectedDmarcScans = await dkimLoader.loadMany([
          dmarcScan1._key,
          dmarcScan2._key,
        ])

        expectedDmarcScans[0].id = expectedDmarcScans[0]._key
        expectedDmarcScans[0].domainId = domain._id

        expectedDmarcScans[1].id = expectedDmarcScans[1]._key
        expectedDmarcScans[1].domainId = domain._id

        const connectionArgs = {
          first: 5,
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
          totalCount: 2,
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
    describe('using before cursor', () => {
      it('returns dmarc scan(s) before a given node id', async () => {
        const connectionLoader = loadDmarcConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const dkimLoader = loadDmarcByKey({ query })
        const expectedDmarcScans = await dkimLoader.loadMany([
          dmarcScan1._key,
          dmarcScan2._key,
        ])

        expectedDmarcScans[0].id = expectedDmarcScans[0]._key
        expectedDmarcScans[0].domainId = domain._id

        expectedDmarcScans[1].id = expectedDmarcScans[1]._key
        expectedDmarcScans[1].domainId = domain._id

        const connectionArgs = {
          first: 5,
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
          totalCount: 2,
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
    describe('using first limit', () => {
      it('returns the first n amount of item(s)', async () => {
        const connectionLoader = loadDmarcConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const dkimLoader = loadDmarcByKey({ query })
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
          totalCount: 2,
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
        const connectionLoader = loadDmarcConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const dkimLoader = loadDmarcByKey({ query })
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
          totalCount: 2,
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
          const connectionLoader = loadDmarcConnectionsByDomainId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const dmarcLoader = loadDmarcByKey({ query })
          const expectedDmarcScans = await dmarcLoader.loadMany([
            dmarcScan2._key,
            dmarcScan3._key,
          ])

          expectedDmarcScans[0].id = expectedDmarcScans[0]._key
          expectedDmarcScans[0].domainId = domain._id

          expectedDmarcScans[1].id = expectedDmarcScans[1]._key
          expectedDmarcScans[1].domainId = domain._id

          const connectionArgs = {
            first: 5,
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
            totalCount: 3,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
              endCursor: toGlobalId('dmarc', expectedDmarcScans[1]._key),
            },
          }

          expect(dmarcScans).toEqual(expectedStructure)
        })
      })
      describe('using end date filter', () => {
        it('returns dkim scans at and before the end date', async () => {
          const connectionLoader = loadDmarcConnectionsByDomainId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const dmarcLoader = loadDmarcByKey({ query })
          const expectedDmarcScans = await dmarcLoader.loadMany([
            dmarcScan1._key,
            dmarcScan2._key,
          ])

          expectedDmarcScans[0].id = expectedDmarcScans[0]._key
          expectedDmarcScans[0].domainId = domain._id

          expectedDmarcScans[1].id = expectedDmarcScans[1]._key
          expectedDmarcScans[1].domainId = domain._id

          const connectionArgs = {
            first: 5,
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
            totalCount: 3,
            pageInfo: {
              hasNextPage: true,
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
          const connectionLoader = loadDmarcConnectionsByDomainId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const dmarcLoader = loadDmarcByKey({ query })
          const expectedDmarcScans = await dmarcLoader.loadMany([
            dmarcScan2._key,
          ])

          expectedDmarcScans[0].id = expectedDmarcScans[0]._key
          expectedDmarcScans[0].domainId = domain._id

          const connectionArgs = {
            first: 5,
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
            totalCount: 3,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: true,
              startCursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
              endCursor: toGlobalId('dmarc', expectedDmarcScans[0]._key),
            },
          }

          expect(dmarcScans).toEqual(expectedStructure)
        })
      })
    })
    describe('using orderBy field', () => {
      let dmarcScanOne, dmarcScanTwo, dmarcScanThree
      beforeEach(async () => {
        await truncate()
        domain = await collections.domains.save({
          domain: 'test.domain.gc.ca',
          slug: 'test-domain-gc-ca',
        })
        dmarcScanOne = await collections.dmarc.save({
          timestamp: '2021-01-26 23:24:34.506578Z',
          record: 'a',
          pPolicy: 'a',
          spPolicy: 'a',
          pct: 1,
        })
        dmarcScanTwo = await collections.dmarc.save({
          timestamp: '2021-01-27 23:24:34.506578Z',
          record: 'b',
          pPolicy: 'b',
          spPolicy: 'b',
          pct: 2,
        })
        dmarcScanThree = await collections.dmarc.save({
          timestamp: '2021-01-28 23:24:34.506578Z',
          record: 'c',
          pPolicy: 'c',
          spPolicy: 'c',
          pct: 3,
        })
        await collections.domainsDMARC.save({
          _to: dmarcScanOne._id,
          _from: domain._id,
        })
        await collections.domainsDMARC.save({
          _to: dmarcScanTwo._id,
          _from: domain._id,
        })
        await collections.domainsDMARC.save({
          _to: dmarcScanThree._id,
          _from: domain._id,
        })
      })
      describe('ordering on TIMESTAMP', () => {
        describe('direction is set to ASC', () => {
          it('returns the dmarc scan', async () => {
            const loader = loadDmarcByKey({ query, userKey: user._key, i18n })
            const expectedDmarcScan = await loader.load(dmarcScanTwo._key)

            const connectionLoader = loadDmarcConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('dkim', dmarcScanOne._key),
              before: toGlobalId('dkim', dmarcScanThree._key),
              orderBy: {
                field: 'timestamp',
                direction: 'ASC',
              },
            }

            const dmarcScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('dmarc', expectedDmarcScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedDmarcScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('dmarc', expectedDmarcScan._key),
                endCursor: toGlobalId('dmarc', expectedDmarcScan._key),
              },
            }

            expect(dmarcScans).toEqual(expectedStructure)
          })
        })
        describe('direction is set to DESC', () => {
          it('returns the dmarc scan', async () => {
            const loader = loadDmarcByKey({ query, userKey: user._key, i18n })
            const expectedDmarcScan = await loader.load(dmarcScanTwo._key)

            const connectionLoader = loadDmarcConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('dkim', dmarcScanThree._key),
              before: toGlobalId('dkim', dmarcScanOne._key),
              orderBy: {
                field: 'timestamp',
                direction: 'DESC',
              },
            }

            const dmarcScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('dmarc', expectedDmarcScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedDmarcScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('dmarc', expectedDmarcScan._key),
                endCursor: toGlobalId('dmarc', expectedDmarcScan._key),
              },
            }

            expect(dmarcScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on RECORD', () => {
        describe('direction is set to ASC', () => {
          it('returns the dmarc scan', async () => {
            const loader = loadDmarcByKey({ query, userKey: user._key, i18n })
            const expectedDmarcScan = await loader.load(dmarcScanTwo._key)

            const connectionLoader = loadDmarcConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('dkim', dmarcScanOne._key),
              before: toGlobalId('dkim', dmarcScanThree._key),
              orderBy: {
                field: 'record',
                direction: 'ASC',
              },
            }

            const dmarcScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('dmarc', expectedDmarcScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedDmarcScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('dmarc', expectedDmarcScan._key),
                endCursor: toGlobalId('dmarc', expectedDmarcScan._key),
              },
            }

            expect(dmarcScans).toEqual(expectedStructure)
          })
        })
        describe('direction is set to DESC', () => {
          it('returns the dmarc scan', async () => {
            const loader = loadDmarcByKey({ query, userKey: user._key, i18n })
            const expectedDmarcScan = await loader.load(dmarcScanTwo._key)

            const connectionLoader = loadDmarcConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('dkim', dmarcScanThree._key),
              before: toGlobalId('dkim', dmarcScanOne._key),
              orderBy: {
                field: 'record',
                direction: 'DESC',
              },
            }

            const dmarcScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('dmarc', expectedDmarcScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedDmarcScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('dmarc', expectedDmarcScan._key),
                endCursor: toGlobalId('dmarc', expectedDmarcScan._key),
              },
            }

            expect(dmarcScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on P_POLICY', () => {
        describe('direction is set to ASC', () => {
          it('returns the dmarc scan', async () => {
            const loader = loadDmarcByKey({ query, userKey: user._key, i18n })
            const expectedDmarcScan = await loader.load(dmarcScanTwo._key)

            const connectionLoader = loadDmarcConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('dkim', dmarcScanOne._key),
              before: toGlobalId('dkim', dmarcScanThree._key),
              orderBy: {
                field: 'p-policy',
                direction: 'ASC',
              },
            }

            const dmarcScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('dmarc', expectedDmarcScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedDmarcScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('dmarc', expectedDmarcScan._key),
                endCursor: toGlobalId('dmarc', expectedDmarcScan._key),
              },
            }

            expect(dmarcScans).toEqual(expectedStructure)
          })
        })
        describe('direction is set to DESC', () => {
          it('returns the dmarc scan', async () => {
            const loader = loadDmarcByKey({ query, userKey: user._key, i18n })
            const expectedDmarcScan = await loader.load(dmarcScanTwo._key)

            const connectionLoader = loadDmarcConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('dkim', dmarcScanThree._key),
              before: toGlobalId('dkim', dmarcScanOne._key),
              orderBy: {
                field: 'p-policy',
                direction: 'DESC',
              },
            }

            const dmarcScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('dmarc', expectedDmarcScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedDmarcScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('dmarc', expectedDmarcScan._key),
                endCursor: toGlobalId('dmarc', expectedDmarcScan._key),
              },
            }

            expect(dmarcScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on SP_POLICY', () => {
        describe('direction is set to ASC', () => {
          it('returns the dmarc scan', async () => {
            const loader = loadDmarcByKey({ query, userKey: user._key, i18n })
            const expectedDmarcScan = await loader.load(dmarcScanTwo._key)

            const connectionLoader = loadDmarcConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('dkim', dmarcScanOne._key),
              before: toGlobalId('dkim', dmarcScanThree._key),
              orderBy: {
                field: 'sp-policy',
                direction: 'ASC',
              },
            }

            const dmarcScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('dmarc', expectedDmarcScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedDmarcScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('dmarc', expectedDmarcScan._key),
                endCursor: toGlobalId('dmarc', expectedDmarcScan._key),
              },
            }

            expect(dmarcScans).toEqual(expectedStructure)
          })
        })
        describe('direction is set to DESC', () => {
          it('returns the dmarc scan', async () => {
            const loader = loadDmarcByKey({ query, userKey: user._key, i18n })
            const expectedDmarcScan = await loader.load(dmarcScanTwo._key)

            const connectionLoader = loadDmarcConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('dkim', dmarcScanThree._key),
              before: toGlobalId('dkim', dmarcScanOne._key),
              orderBy: {
                field: 'sp-policy',
                direction: 'DESC',
              },
            }

            const dmarcScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('dmarc', expectedDmarcScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedDmarcScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('dmarc', expectedDmarcScan._key),
                endCursor: toGlobalId('dmarc', expectedDmarcScan._key),
              },
            }

            expect(dmarcScans).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on PCT', () => {
        describe('direction is set to ASC', () => {
          it('returns the dmarc scan', async () => {
            const loader = loadDmarcByKey({ query, userKey: user._key, i18n })
            const expectedDmarcScan = await loader.load(dmarcScanTwo._key)

            const connectionLoader = loadDmarcConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('dkim', dmarcScanOne._key),
              before: toGlobalId('dkim', dmarcScanThree._key),
              orderBy: {
                field: 'pct',
                direction: 'ASC',
              },
            }

            const dmarcScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('dmarc', expectedDmarcScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedDmarcScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('dmarc', expectedDmarcScan._key),
                endCursor: toGlobalId('dmarc', expectedDmarcScan._key),
              },
            }

            expect(dmarcScans).toEqual(expectedStructure)
          })
        })
        describe('direction is set to DESC', () => {
          it('returns the dmarc scan', async () => {
            const loader = loadDmarcByKey({ query, userKey: user._key, i18n })
            const expectedDmarcScan = await loader.load(dmarcScanTwo._key)

            const connectionLoader = loadDmarcConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('dkim', dmarcScanThree._key),
              before: toGlobalId('dkim', dmarcScanOne._key),
              orderBy: {
                field: 'pct',
                direction: 'DESC',
              },
            }

            const dmarcScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('dmarc', expectedDmarcScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedDmarcScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('dmarc', expectedDmarcScan._key),
                endCursor: toGlobalId('dmarc', expectedDmarcScan._key),
              },
            }

            expect(dmarcScans).toEqual(expectedStructure)
          })
        })
      })
    })
    describe('no dmarc scans are found', () => {
      it('returns an empty structure', async () => {
        await truncate()
        const connectionLoader = loadDmarcConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const connectionArgs = {
          first: 5,
        }

        const dmarcScans = await connectionLoader({
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

        expect(dmarcScans).toEqual(expectedStructure)
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
          const connectionLoader = loadDmarcConnectionsByDomainId({
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
                'You must provide a `first` or `last` value to properly paginate the `DMARC` connection.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadDmarcConnectionsByDomainId.`,
          ])
        })
      })
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadDmarcConnectionsByDomainId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

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
                'Passing both `first` and `last` to paginate the `DMARC` connection is not supported.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadDmarcConnectionsByDomainId.`,
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDmarcConnectionsByDomainId({
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
                  '`first` on the `DMARC` connection cannot be less than zero.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadDmarcConnectionsByDomainId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDmarcConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              last: -2,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`last` on the `DMARC` connection cannot be less than zero.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadDmarcConnectionsByDomainId.`,
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDmarcConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

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
                  'Requesting 1000 records on the `DMARC` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 1000 for: loadDmarcConnectionsByDomainId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDmarcConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              last: 200,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting 200 records on the `DMARC` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 200 for: loadDmarcConnectionsByDomainId.`,
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
              const connectionLoader = loadDmarcConnectionsByDomainId({
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
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadDmarcConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = loadDmarcConnectionsByDomainId({
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
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadDmarcConnectionsByDomainId.`,
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

        const connectionLoader = loadDmarcConnectionsByDomainId({
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
            new Error('Unable to load DMARC scan(s). Please try again.'),
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
          next() {
            throw new Error('Cursor Error Occurred.')
          },
        }
        const query = jest.fn().mockReturnValueOnce(cursor)

        const connectionLoader = loadDmarcConnectionsByDomainId({
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
            new Error('Unable to load DMARC scan(s). Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to get dmarc information for ${domain._id}, error: Error: Cursor Error Occurred.`,
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
          const connectionLoader = loadDmarcConnectionsByDomainId({
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
                'Vous devez fournir une valeur `first` ou `last` pour paginer correctement la connexion `DMARC`.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadDmarcConnectionsByDomainId.`,
          ])
        })
      })
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadDmarcConnectionsByDomainId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

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
                "Passer à la fois `first` et `last` pour paginer la connexion `DMARC` n'est pas supporté.",
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadDmarcConnectionsByDomainId.`,
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDmarcConnectionsByDomainId({
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
                  '`first` sur la connexion `DMARC` ne peut être inférieur à zéro.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadDmarcConnectionsByDomainId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDmarcConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              last: -2,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`last` sur la connexion `DMARC` ne peut être inférieur à zéro.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadDmarcConnectionsByDomainId.`,
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDmarcConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

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
                  'La demande de 1000 enregistrements sur la connexion `DMARC` dépasse la limite `first` de 100 enregistrements.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 1000 for: loadDmarcConnectionsByDomainId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDmarcConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              last: 200,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'La demande de 200 enregistrements sur la connexion `DMARC` dépasse la limite `last` de 100 enregistrements.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 200 for: loadDmarcConnectionsByDomainId.`,
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
              const connectionLoader = loadDmarcConnectionsByDomainId({
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
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadDmarcConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = loadDmarcConnectionsByDomainId({
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
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadDmarcConnectionsByDomainId.`,
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

        const connectionLoader = loadDmarcConnectionsByDomainId({
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
              'Impossible de charger le(s) scan(s) DMARC. Veuillez réessayer.',
            ),
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
          next() {
            throw new Error('Cursor Error Occurred.')
          },
        }
        const query = jest.fn().mockReturnValueOnce(cursor)

        const connectionLoader = loadDmarcConnectionsByDomainId({
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
              'Impossible de charger le(s) scan(s) DMARC. Veuillez réessayer.',
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to get dmarc information for ${domain._id}, error: Error: Cursor Error Occurred.`,
        ])
      })
    })
  })
})
