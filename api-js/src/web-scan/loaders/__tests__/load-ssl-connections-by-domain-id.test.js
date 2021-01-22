import { stringify } from 'jest-matcher-utils'
import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { cleanseInput } from '../../../validators'
import { sslLoaderByKey, sslLoaderConnectionsByDomainId } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the load ssl connection function', () => {
  let query, drop, truncate, migrate, collections, user, domain, i18n

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
          i18n,
        )

        const sslLoader = sslLoaderByKey(query, i18n)
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
          totalCount: 2,
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
          i18n,
        )

        const sslLoader = sslLoaderByKey(query, i18n)
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
        const connectionLoader = sslLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const sslLoader = sslLoaderByKey(query, i18n)
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
        const connectionLoader = sslLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const sslLoader = sslLoaderByKey(query, i18n)
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
        const connectionLoader = sslLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const sslLoader = sslLoaderByKey(query, i18n)
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
          const connectionLoader = sslLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const sslLoader = sslLoaderByKey(query)
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
          const connectionLoader = sslLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const sslLoader = sslLoaderByKey(query, i18n)
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
          const connectionLoader = sslLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const sslLoader = sslLoaderByKey(query, i18n)
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
    describe('no ssl scans are found', () => {
      it('returns an empty structure', async () => {
        await truncate()

        const connectionLoader = sslLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

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
          const connectionLoader = sslLoaderConnectionsByDomainId(
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
                'You must provide a `first` or `last` value to properly paginate the `ssl` connection.',
              ),
            )
          }

          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: sslLoaderConnectionsByDomainId.`,
          ])
        })
      })
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = sslLoaderConnectionsByDomainId(
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
                'Passing both `first` and `last` to paginate the `ssl` connection is not supported.',
              ),
            )
          }

          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} tried to have \`first\` and \`last\` arguments set for: sslLoaderConnectionsByDomainId.`,
          ])
        })
      })
      describe('both limits are below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = sslLoaderConnectionsByDomainId(
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
                  '`first` on the `ssl` connection cannot be less than zero.',
                ),
              )
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: sslLoaderConnectionsByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = sslLoaderConnectionsByDomainId(
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
                  '`last` on the `ssl` connection cannot be less than zero.',
                ),
              )
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: sslLoaderConnectionsByDomainId.`,
            ])
          })
        })
      })
      describe('both limits are above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = sslLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

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
                  'Requesting 101 records on the `ssl` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 101 for: sslLoaderConnectionsByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = sslLoaderConnectionsByDomainId(
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
                  'Requesting 500 records on the `ssl` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }

            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: sslLoaderConnectionsByDomainId.`,
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
              const connectionLoader = sslLoaderConnectionsByDomainId(
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
                } attempted to have \`first\` set as a ${typeof invalidInput} for: sslLoaderConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = sslLoaderConnectionsByDomainId(
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
                } attempted to have \`last\` set as a ${typeof invalidInput} for: sslLoaderConnectionsByDomainId.`,
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

        const connectionLoader = sslLoaderConnectionsByDomainId(
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
          next() {
            throw new Error('Cursor Error Occurred.')
          },
        }
        const query = jest.fn().mockReturnValueOnce(cursor)

        const connectionLoader = sslLoaderConnectionsByDomainId(
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
            new Error('Unable to load ssl scans. Please try again.'),
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
          const connectionLoader = sslLoaderConnectionsByDomainId(
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
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: sslLoaderConnectionsByDomainId.`,
          ])
        })
      })
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = sslLoaderConnectionsByDomainId(
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
            `User: ${user._key} tried to have \`first\` and \`last\` arguments set for: sslLoaderConnectionsByDomainId.`,
          ])
        })
      })
      describe('both limits are below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = sslLoaderConnectionsByDomainId(
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
              `User: ${user._key} attempted to have \`first\` set below zero for: sslLoaderConnectionsByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = sslLoaderConnectionsByDomainId(
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
              `User: ${user._key} attempted to have \`last\` set below zero for: sslLoaderConnectionsByDomainId.`,
            ])
          })
        })
      })
      describe('both limits are above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = sslLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

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
              `User: ${user._key} attempted to have \`first\` set to 101 for: sslLoaderConnectionsByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = sslLoaderConnectionsByDomainId(
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
              `User: ${user._key} attempted to have \`last\` set to 500 for: sslLoaderConnectionsByDomainId.`,
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
              const connectionLoader = sslLoaderConnectionsByDomainId(
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
                  domainId: domain._id,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error(`todo`))
              }
              expect(consoleWarnOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: sslLoaderConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = sslLoaderConnectionsByDomainId(
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
                  domainId: domain._id,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error(`todo`))
              }
              expect(consoleWarnOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: sslLoaderConnectionsByDomainId.`,
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

        const connectionLoader = sslLoaderConnectionsByDomainId(
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

        const connectionLoader = sslLoaderConnectionsByDomainId(
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
          `Cursor error occurred while user: ${user._key} was trying to get ssl information for ${domain._id}, error: Error: Cursor Error Occurred.`,
        ])
      })
    })
  })
})
