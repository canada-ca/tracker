import { stringify } from 'jest-matcher-utils'
import { ensure, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { cleanseInput } from '../../../validators'
import { loadDkimConnectionsByDomainId, loadDkimByKey } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('when given the load dkim connection function', () => {
  let query,
    drop,
    truncate,
    collections,
    user,
    domain,
    dkimScan1,
    dkimScan2,
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
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('using after cursor', () => {
      it('returns dkim scan(s) after a given node id', async () => {
        const connectionLoader = loadDkimConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const dkimLoader = loadDkimByKey({ query })
        const expectedDkimScans = await dkimLoader.loadMany([
          dkimScan1._key,
          dkimScan2._key,
        ])

        expectedDkimScans[0].id = expectedDkimScans[0]._key
        expectedDkimScans[0].domainId = domain._id

        expectedDkimScans[1].id = expectedDkimScans[1]._key
        expectedDkimScans[1].domainId = domain._id

        const connectionArgs = {
          first: 5,
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
          totalCount: 2,
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
    describe('using before cursor', () => {
      it('returns dkim scan(s) before a given node id', async () => {
        const connectionLoader = loadDkimConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const dkimLoader = loadDkimByKey({ query })
        const expectedDkimScans = await dkimLoader.loadMany([
          dkimScan1._key,
          dkimScan2._key,
        ])

        expectedDkimScans[0].id = expectedDkimScans[0]._key
        expectedDkimScans[0].domainId = domain._id

        expectedDkimScans[1].id = expectedDkimScans[1]._key
        expectedDkimScans[1].domainId = domain._id

        const connectionArgs = {
          first: 5,
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
          totalCount: 2,
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
    describe('using first limit', () => {
      it('returns the first n amount of item(s)', async () => {
        const connectionLoader = loadDkimConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const dkimLoader = loadDkimByKey({ query })
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
          totalCount: 2,
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
        const connectionLoader = loadDkimConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const dkimLoader = loadDkimByKey({ query })
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
          totalCount: 2,
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
          const connectionLoader = loadDkimConnectionsByDomainId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const dkimLoader = loadDkimByKey({ query })
          const expectedDkimScans = await dkimLoader.loadMany([
            dkimScan2._key,
            dkimScan3._key,
          ])

          expectedDkimScans[0].id = expectedDkimScans[0]._key
          expectedDkimScans[0].domainId = domain._id

          expectedDkimScans[1].id = expectedDkimScans[1]._key
          expectedDkimScans[1].domainId = domain._id

          const connectionArgs = {
            first: 5,
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
            totalCount: 3,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId('dkim', expectedDkimScans[0]._key),
              endCursor: toGlobalId('dkim', expectedDkimScans[1]._key),
            },
          }

          expect(dkimScans).toEqual(expectedStructure)
        })
      })
      describe('using end date filter', () => {
        it('returns dkim scans at and before the end date', async () => {
          const connectionLoader = loadDkimConnectionsByDomainId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const dkimLoader = loadDkimByKey({ query })
          const expectedDkimScans = await dkimLoader.loadMany([
            dkimScan1._key,
            dkimScan2._key,
          ])

          expectedDkimScans[0].id = expectedDkimScans[0]._key
          expectedDkimScans[0].domainId = domain._id

          expectedDkimScans[1].id = expectedDkimScans[1]._key
          expectedDkimScans[1].domainId = domain._id

          const connectionArgs = {
            first: 5,
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
            totalCount: 3,
            pageInfo: {
              hasNextPage: true,
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
          const connectionLoader = loadDkimConnectionsByDomainId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const dkimLoader = loadDkimByKey({ query })
          const expectedDkimScans = await dkimLoader.loadMany([dkimScan2._key])

          expectedDkimScans[0].id = expectedDkimScans[0]._key
          expectedDkimScans[0].domainId = domain._id

          const connectionArgs = {
            first: 5,
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
            totalCount: 3,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: true,
              startCursor: toGlobalId('dkim', expectedDkimScans[0]._key),
              endCursor: toGlobalId('dkim', expectedDkimScans[0]._key),
            },
          }

          expect(dkimScans).toEqual(expectedStructure)
        })
      })
    })
    describe('using orderBy field', () => {
      let dkimScanOne, dkimScanTwo, dkimScanThree
      beforeEach(async () => {
        await truncate()
        domain = await collections.domains.save({
          domain: 'test.domain.gc.ca',
          slug: 'test-domain-gc-ca',
        })
        dkimScanOne = await collections.dkim.save({
          timestamp: '2021-01-26 23:24:34.506578Z',
        })
        dkimScanTwo = await collections.dkim.save({
          timestamp: '2021-01-27 23:24:34.506578Z',
        })
        dkimScanThree = await collections.dkim.save({
          timestamp: '2021-01-28 23:24:34.506578Z',
        })
        await collections.domainsDKIM.save({
          _to: dkimScanOne._id,
          _from: domain._id,
        })
        await collections.domainsDKIM.save({
          _to: dkimScanTwo._id,
          _from: domain._id,
        })
        await collections.domainsDKIM.save({
          _to: dkimScanThree._id,
          _from: domain._id,
        })
      })
      describe('ordering on TIMESTAMP', () => {
        describe('direction set to ASC', () => {
          it('returns dkim scan', async () => {
            const loader = loadDkimByKey({ query, userKey: user._key, i18n })
            const expectedDkimScan = await loader.load(dkimScanTwo._key)

            const connectionLoader = loadDkimConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('dkim', dkimScanOne._key),
              before: toGlobalId('dkim', dkimScanThree._key),
              orderBy: {
                field: 'timestamp',
                direction: 'ASC',
              },
            }

            const dkimScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('dkim', expectedDkimScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedDkimScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('dkim', expectedDkimScan._key),
                endCursor: toGlobalId('dkim', expectedDkimScan._key),
              },
            }

            expect(dkimScans).toEqual(expectedStructure)
          })
        })
        describe('direction set to DESC', () => {
          it('returns dkim scan', async () => {
            const loader = loadDkimByKey({ query, userKey: user._key, i18n })
            const expectedDkimScan = await loader.load(dkimScanTwo._key)

            const connectionLoader = loadDkimConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              domainId: domain._id,
              first: 5,
              after: toGlobalId('dkim', dkimScanThree._key),
              before: toGlobalId('dkim', dkimScanOne._key),
              orderBy: {
                field: 'timestamp',
                direction: 'DESC',
              },
            }

            const dkimScans = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('dkim', expectedDkimScan._key),
                  node: {
                    domainId: domain._id,
                    ...expectedDkimScan,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('dkim', expectedDkimScan._key),
                endCursor: toGlobalId('dkim', expectedDkimScan._key),
              },
            }

            expect(dkimScans).toEqual(expectedStructure)
          })
        })
      })
    })
    describe('no dkim scans are found', () => {
      it('returns an empty structure', async () => {
        await truncate()
        const connectionLoader = loadDkimConnectionsByDomainId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const connectionArgs = {
          first: 5,
        }

        const dkimScans = await connectionLoader({
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

        expect(dkimScans).toEqual(expectedStructure)
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
      describe('limits are not set', () => {
        it('throws an error', async () => {
          const connectionLoader = loadDkimConnectionsByDomainId({
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
                'You must provide a `first` or `last` value to properly paginate the `DKIM` connection.',
              ),
            )
          }

          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadDkimConnectionsByDomainId.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadDkimConnectionsByDomainId({
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
                'Passing both `first` and `last` to paginate the `DKIM` connection is not supported.',
              ),
            )
          }

          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadDkimConnectionsByDomainId.`,
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              first: -5,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`first` on the `DKIM` connection cannot be less than zero.',
                ),
              )
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadDkimConnectionsByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimConnectionsByDomainId({
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
                  '`last` on the `DKIM` connection cannot be less than zero.',
                ),
              )
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadDkimConnectionsByDomainId.`,
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              first: 500,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting 500 records on the `DKIM` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 500 for: loadDkimConnectionsByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimConnectionsByDomainId({
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
                  'Requesting 500 records on the `DKIM` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: loadDkimConnectionsByDomainId.`,
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
              const connectionLoader = loadDkimConnectionsByDomainId({
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
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadDkimConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = loadDkimConnectionsByDomainId({
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
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadDkimConnectionsByDomainId.`,
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

        const connectionLoader = loadDkimConnectionsByDomainId({
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
            new Error('Unable to load DKIM scan(s). Please try again.'),
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
          next() {
            throw new Error('Cursor Error Occurred.')
          },
        }
        const query = jest.fn().mockReturnValueOnce(cursor)

        const connectionLoader = loadDkimConnectionsByDomainId({
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
            new Error('Unable to load DKIM scan(s). Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to get dkim information for ${domain._id}, error: Error: Cursor Error Occurred.`,
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
      describe('limits are not set', () => {
        it('throws an error', async () => {
          const connectionLoader = loadDkimConnectionsByDomainId({
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
                'Vous devez fournir une valeur `first` ou `last` pour paginer correctement la connexion `DKIM`.',
              ),
            )
          }

          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadDkimConnectionsByDomainId.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadDkimConnectionsByDomainId({
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
                "Passer à la fois `first` et `last` pour paginer la connexion `DKIMResults` n'est pas supporté.",
              ),
            )
          }

          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadDkimConnectionsByDomainId.`,
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              first: -5,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`first` sur la connexion `DKIM` ne peut être inférieur à zéro.',
                ),
              )
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadDkimConnectionsByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimConnectionsByDomainId({
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
                  '`last` sur la connexion `DKIM` ne peut être inférieur à zéro.',
                ),
              )
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadDkimConnectionsByDomainId.`,
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimConnectionsByDomainId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              first: 500,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'La demande de 500 enregistrements sur la connexion `DKIM` dépasse la limite `first` de 100 enregistrements.',
                ),
              )
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 500 for: loadDkimConnectionsByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimConnectionsByDomainId({
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
                  'La demande de 500 enregistrements sur la connexion `DKIM` dépasse la limite `last` de 100 enregistrements.',
                ),
              )
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: loadDkimConnectionsByDomainId.`,
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
              const connectionLoader = loadDkimConnectionsByDomainId({
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
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadDkimConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = loadDkimConnectionsByDomainId({
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
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadDkimConnectionsByDomainId.`,
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

        const connectionLoader = loadDkimConnectionsByDomainId({
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
              'Impossible de charger le(s) scan(s) DKIM. Veuillez réessayer.',
            ),
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
          next() {
            throw new Error('Cursor Error Occurred.')
          },
        }
        const query = jest.fn().mockReturnValueOnce(cursor)

        const connectionLoader = loadDkimConnectionsByDomainId({
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
              'Impossible de charger le(s) scan(s) DKIM. Veuillez réessayer.',
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to get dkim information for ${domain._id}, error: Error: Cursor Error Occurred.`,
        ])
      })
    })
  })
})
