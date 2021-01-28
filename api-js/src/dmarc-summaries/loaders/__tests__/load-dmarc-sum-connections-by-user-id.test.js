import { stringify } from 'jest-matcher-utils'
import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { cleanseInput } from '../../../validators'
import {
  dmarcSumLoaderConnectionsByUserId,
  dmarcSumLoaderByKey,
} from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the dmarcSumLoaderConnectionsByUserId function', () => {
  let query,
    drop,
    truncate,
    migrate,
    collections,
    org,
    i18n,
    user,
    domain1,
    domain2,
    dmarcSummary1,
    dmarcSummary2

  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.error = mockedError
    console.warn = mockedWarn
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
  })

  beforeEach(async () => {
    await truncate()
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
    })
    org = await collections.organizations.save({
      orgDetails: {
        en: {
          slug: 'treasury-board-secretariat',
          acronym: 'TBS',
          name: 'Treasury Board of Canada Secretariat',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'secretariat-conseil-tresor',
          acronym: 'SCT',
          name: 'Secrétariat du Conseil Trésor du Canada',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
    })
    await collections.affiliations.save({
      _from: org._id,
      _to: user._id,
      permission: 'user',
    })
    domain1 = await collections.domains.save({
      domain: 'test1.gc.ca',
      lastRan: null,
      selectors: ['selector1._domainkey', 'selector2._domainkey'],
    })
    await collections.ownership.save({
      _to: domain1._id,
      _from: org._id,
    })
    domain2 = await collections.domains.save({
      domain: 'test2.gc.ca',
      lastRan: null,
      selectors: ['selector1._domainkey', 'selector2._domainkey'],
    })
    await collections.ownership.save({
      _to: domain2._id,
      _from: org._id,
    })
    dmarcSummary1 = await collections.dmarcSummaries.save({
      detailTables: {
        dkimFailure: [],
        dmarcFailure: [],
        fullPass: [],
        spfFailure: [],
      },
      categoryTotals: {
        pass: 0,
        fail: 0,
        passDkimOnly: 0,
        passSpfOnly: 0,
      },
    })
    dmarcSummary2 = await collections.dmarcSummaries.save({
      detailTables: {
        dkimFailure: [],
        dmarcFailure: [],
        fullPass: [],
        spfFailure: [],
      },
      categoryTotals: {
        pass: 0,
        fail: 0,
        passDkimOnly: 0,
        passSpfOnly: 0,
      },
    })
    await collections.domainsToDmarcSummaries.save({
      _from: domain1._id,
      _to: dmarcSummary1._id,
      startDate: 'thirtyDays',
    })
    await collections.domainsToDmarcSummaries.save({
      _from: domain2._id,
      _to: dmarcSummary2._id,
      startDate: 'thirtyDays',
    })
    consoleOutput.length = 0
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given there are dmarc summary connections to be returned', () => {
    describe('using no cursor', () => {
      it('returns a dmarc summary', async () => {
        const summaryLoader = dmarcSumLoaderByKey(query)
        const expectedSummaries = await summaryLoader.loadMany([
          dmarcSummary1._key,
          dmarcSummary2._key,
        ])

        const connectionLoader = dmarcSumLoaderConnectionsByUserId(
          query,
          user._key,
          cleanseInput,
          {},
          jest.fn().mockReturnValueOnce('thirtyDays'),
        )

        const connectionArgs = {
          first: 10,
          period: 'thirtyDays',
          year: '2021',
        }

        const summaries = await connectionLoader({ ...connectionArgs })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dmarcSummaries', expectedSummaries[0]._key),
              node: {
                ...expectedSummaries[0],
              },
            },
            {
              cursor: toGlobalId('dmarcSummaries', expectedSummaries[1]._key),
              node: {
                ...expectedSummaries[1],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId(
              'dmarcSummaries',
              expectedSummaries[0]._key,
            ),
            endCursor: toGlobalId('dmarcSummaries', expectedSummaries[1]._key),
          },
        }

        expect(summaries).toEqual(expectedStructure)
      })
    })
    describe('using after cursor', () => {
      it('returns a dmarc summary', async () => {
        const summaryLoader = dmarcSumLoaderByKey(query)
        const expectedSummaries = await summaryLoader.loadMany([
          dmarcSummary1._key,
          dmarcSummary2._key,
        ])

        const connectionLoader = dmarcSumLoaderConnectionsByUserId(
          query,
          user._key,
          cleanseInput,
          {},
          jest.fn().mockReturnValueOnce('thirtyDays'),
        )

        const connectionArgs = {
          first: 10,
          period: 'thirtyDays',
          year: '2021',
          after: toGlobalId('dmarcSummaries', expectedSummaries[0]._key),
        }

        const summaries = await connectionLoader({ ...connectionArgs })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dmarcSummaries', expectedSummaries[1]._key),
              node: {
                ...expectedSummaries[1],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId(
              'dmarcSummaries',
              expectedSummaries[1]._key,
            ),
            endCursor: toGlobalId('dmarcSummaries', expectedSummaries[1]._key),
          },
        }

        expect(summaries).toEqual(expectedStructure)
      })
    })
    describe('using before cursor', () => {
      it('returns a dmarc summary', async () => {
        const summaryLoader = dmarcSumLoaderByKey(query)
        const expectedSummaries = await summaryLoader.loadMany([
          dmarcSummary1._key,
          dmarcSummary2._key,
        ])

        const connectionLoader = dmarcSumLoaderConnectionsByUserId(
          query,
          user._key,
          cleanseInput,
          {},
          jest.fn().mockReturnValueOnce('thirtyDays'),
        )

        const connectionArgs = {
          first: 10,
          period: 'thirtyDays',
          year: '2021',
          before: toGlobalId('dmarcSummaries', expectedSummaries[1]._key),
        }

        const summaries = await connectionLoader({ ...connectionArgs })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dmarcSummaries', expectedSummaries[0]._key),
              node: {
                ...expectedSummaries[0],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId(
              'dmarcSummaries',
              expectedSummaries[0]._key,
            ),
            endCursor: toGlobalId('dmarcSummaries', expectedSummaries[0]._key),
          },
        }

        expect(summaries).toEqual(expectedStructure)
      })
    })
    describe('using first limit', () => {
      it('returns a dmarc summary', async () => {
        const summaryLoader = dmarcSumLoaderByKey(query)
        const expectedSummaries = await summaryLoader.loadMany([
          dmarcSummary1._key,
          dmarcSummary2._key,
        ])

        const connectionLoader = dmarcSumLoaderConnectionsByUserId(
          query,
          user._key,
          cleanseInput,
          {},
          jest.fn().mockReturnValueOnce('thirtyDays'),
        )

        const connectionArgs = {
          first: 1,
          period: 'thirtyDays',
          year: '2021',
        }

        const summaries = await connectionLoader({ ...connectionArgs })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dmarcSummaries', expectedSummaries[0]._key),
              node: {
                ...expectedSummaries[0],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId(
              'dmarcSummaries',
              expectedSummaries[0]._key,
            ),
            endCursor: toGlobalId('dmarcSummaries', expectedSummaries[0]._key),
          },
        }

        expect(summaries).toEqual(expectedStructure)
      })
    })
    describe('using last limit', () => {
      it('returns a dmarc summary', async () => {
        const summaryLoader = dmarcSumLoaderByKey(query)
        const expectedSummaries = await summaryLoader.loadMany([
          dmarcSummary1._key,
          dmarcSummary2._key,
        ])

        const connectionLoader = dmarcSumLoaderConnectionsByUserId(
          query,
          user._key,
          cleanseInput,
          {},
          jest.fn().mockReturnValueOnce('thirtyDays'),
        )

        const connectionArgs = {
          last: 1,
          period: 'thirtyDays',
          year: '2021',
        }

        const summaries = await connectionLoader({ ...connectionArgs })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dmarcSummaries', expectedSummaries[1]._key),
              node: {
                ...expectedSummaries[1],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId(
              'dmarcSummaries',
              expectedSummaries[1]._key,
            ),
            endCursor: toGlobalId('dmarcSummaries', expectedSummaries[1]._key),
          },
        }

        expect(summaries).toEqual(expectedStructure)
      })
    })
  })
  describe('given there are no dmarc summaries to be returned', () => {
    it('returns no dmarc summary connections', async () => {
      const connectionLoader = dmarcSumLoaderConnectionsByUserId(
        query,
        user._key,
        cleanseInput,
        {},
        jest.fn().mockReturnValueOnce('2021-01-01'),
      )

      const connectionArgs = {
        last: 1,
        period: 'january',
        year: '2021',
      }

      const summaries = await connectionLoader({ ...connectionArgs })

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

      expect(summaries).toEqual(expectedStructure)
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
    describe('given an unsuccessful load', () => {
      describe('first and last arguments are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = dmarcSumLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
            i18n,
            jest.fn().mockReturnValueOnce('thirtyDays'),
          )

          const connectionArgs = {
            period: 'thirtyDays',
            year: '2021',
          }

          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'You must provide a `first` or `last` value to properly paginate the `dmarcSummaries` connection.',
              ),
            )
          }
          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: dmarcSumLoaderConnectionsByUserId.`,
          ])
        })
      })
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = dmarcSumLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
            i18n,
            jest.fn().mockReturnValueOnce('thirtyDays'),
          )

          const connectionArgs = {
            period: 'thirtyDays',
            year: '2021',
            first: 1,
            last: 1,
          }

          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Passing both `first` and `last` to paginate the `dmarcSummaries` connection is not supported.',
              ),
            )
          }
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: dmarcSumLoaderConnectionsByUserId.`,
          ])
        })
      })
      describe('first or last argument exceeds maximum', () => {
        describe('first argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dmarcSumLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              i18n,
              jest.fn().mockReturnValueOnce('thirtyDays'),
            )

            const connectionArgs = {
              period: 'thirtyDays',
              year: '2021',
              first: 101,
            }

            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting `101` records on the `dmarcSummaries` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 101 for: dmarcSumLoaderConnectionsByUserId.`,
            ])
          })
        })
        describe('last argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dmarcSumLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              i18n,
              jest.fn().mockReturnValueOnce('thirtyDays'),
            )

            const connectionArgs = {
              period: 'thirtyDays',
              year: '2021',
              last: 101,
            }

            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting `101` records on the `dmarcSummaries` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 101 for: dmarcSumLoaderConnectionsByUserId.`,
            ])
          })
        })
      })
      describe('first or last argument exceeds minimum', () => {
        describe('first argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dmarcSumLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              i18n,
              jest.fn().mockReturnValueOnce('thirtyDays'),
            )

            const connectionArgs = {
              period: 'thirtyDays',
              year: '2021',
              first: -1,
            }

            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`first` on the `dmarcSummaries` connection cannot be less than zero.',
                ),
              )
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: dmarcSumLoaderConnectionsByUserId.`,
            ])
          })
        })
        describe('last argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dmarcSumLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              i18n,
              jest.fn().mockReturnValueOnce('thirtyDays'),
            )

            const connectionArgs = {
              period: 'thirtyDays',
              year: '2021',
              last: -1,
            }

            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`last` on the `dmarcSummaries` connection cannot be less than zero.',
                ),
              )
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: dmarcSumLoaderConnectionsByUserId.`,
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
              const connectionLoader = dmarcSumLoaderConnectionsByUserId(
                query,
                user._key,
                cleanseInput,
                i18n,
                jest.fn().mockReturnValueOnce('thirtyDays'),
              )

              const connectionArgs = {
                first: invalidInput,
                period: 'thirtyDays',
                year: '2021',
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
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: dmarcSumLoaderConnectionsByUserId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = dmarcSumLoaderConnectionsByUserId(
                query,
                user._key,
                cleanseInput,
                i18n,
                jest.fn().mockReturnValueOnce('thirtyDays'),
              )

              const connectionArgs = {
                last: invalidInput,
                period: 'thirtyDays',
                year: '2021',
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
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: dmarcSumLoaderConnectionsByUserId.`,
              ])
            })
          })
        })
      })
      describe('period argument is not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = dmarcSumLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
            i18n,
            jest.fn().mockReturnValueOnce('thirtyDays'),
          )

          const connectionArgs = {
            first: 1,
            year: '2021',
          }

          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'You must provide a `period` value to access the `dmarcSummaries` connection.',
              ),
            )
          }
          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have \`period\` argument set for: dmarcSumLoaderConnectionsByUserId.`,
          ])
        })
      })
      describe('year argument is not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = dmarcSumLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
            i18n,
            jest.fn().mockReturnValueOnce('thirtyDays'),
          )

          const connectionArgs = {
            first: 1,
            period: 'january',
          }

          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'You must provide a `year` value to access the `dmarcSummaries` connection.',
              ),
            )
          }
          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have \`year\` argument set for: dmarcSumLoaderConnectionsByUserId.`,
          ])
        })
      })
      describe('given a database error', () => {
        describe('while querying for domain information', () => {
          it('returns an error message', async () => {
            const query = jest
              .fn()
              .mockRejectedValue(new Error('Database error occurred.'))

            const connectionLoader = dmarcSumLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              i18n,
              jest.fn().mockReturnValueOnce('thirtyDays'),
            )

            const connectionArgs = {
              first: 50,
              period: 'thirtyDays',
              year: '2021',
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error('Unable to load dmarc summaries. Please try again.'),
              )
            }

            expect(consoleOutput).toEqual([
              `Database error occurred while user: ${user._key} was trying to gather dmarc summaries in dmarcSumLoaderConnectionsByUserId, error: Error: Database error occurred.`,
            ])
          })
        })
      })
      describe('given a cursor error', () => {
        describe('while gathering domains', () => {
          it('returns an error message', async () => {
            const cursor = {
              next() {
                throw new Error('Cursor error occurred.')
              },
            }
            const query = jest.fn().mockReturnValueOnce(cursor)

            const connectionLoader = dmarcSumLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              i18n,
              jest.fn().mockReturnValueOnce('thirtyDays'),
            )

            const connectionArgs = {
              first: 50,
              period: 'thirtyDays',
              year: '2021',
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error('Unable to load dmarc summaries. Please try again.'),
              )
            }

            expect(consoleOutput).toEqual([
              `Cursor error occurred while user: ${user._key} was trying to gather dmarc summaries in dmarcSumLoaderConnectionsByUserId, error: Error: Cursor error occurred.`,
            ])
          })
        })
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
    describe('given an unsuccessful load', () => {
      describe('first and last arguments are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = dmarcSumLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
            i18n,
            jest.fn().mockReturnValueOnce('thirtyDays'),
          )

          const connectionArgs = {
            period: 'thirtyDays',
            year: '2021',
          }

          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }
          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: dmarcSumLoaderConnectionsByUserId.`,
          ])
        })
      })
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = dmarcSumLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
            i18n,
            jest.fn().mockReturnValueOnce('thirtyDays'),
          )

          const connectionArgs = {
            period: 'thirtyDays',
            year: '2021',
            first: 1,
            last: 1,
          }

          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: dmarcSumLoaderConnectionsByUserId.`,
          ])
        })
      })
      describe('first or last argument exceeds maximum', () => {
        describe('first argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dmarcSumLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              i18n,
              jest.fn().mockReturnValueOnce('thirtyDays'),
            )

            const connectionArgs = {
              period: 'thirtyDays',
              year: '2021',
              first: 101,
            }

            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 101 for: dmarcSumLoaderConnectionsByUserId.`,
            ])
          })
        })
        describe('last argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dmarcSumLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              i18n,
              jest.fn().mockReturnValueOnce('thirtyDays'),
            )

            const connectionArgs = {
              period: 'thirtyDays',
              year: '2021',
              last: 101,
            }

            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 101 for: dmarcSumLoaderConnectionsByUserId.`,
            ])
          })
        })
      })
      describe('first or last argument exceeds minimum', () => {
        describe('first argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dmarcSumLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              i18n,
              jest.fn().mockReturnValueOnce('thirtyDays'),
            )

            const connectionArgs = {
              period: 'thirtyDays',
              year: '2021',
              first: -1,
            }

            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: dmarcSumLoaderConnectionsByUserId.`,
            ])
          })
        })
        describe('last argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dmarcSumLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              i18n,
              jest.fn().mockReturnValueOnce('thirtyDays'),
            )

            const connectionArgs = {
              period: 'thirtyDays',
              year: '2021',
              last: -1,
            }

            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: dmarcSumLoaderConnectionsByUserId.`,
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
              const connectionLoader = dmarcSumLoaderConnectionsByUserId(
                query,
                user._key,
                cleanseInput,
                i18n,
                jest.fn().mockReturnValueOnce('thirtyDays'),
              )

              const connectionArgs = {
                first: invalidInput,
                period: 'thirtyDays',
                year: '2021',
              }

              try {
                await connectionLoader({
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error(`todo`))
              }
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: dmarcSumLoaderConnectionsByUserId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = dmarcSumLoaderConnectionsByUserId(
                query,
                user._key,
                cleanseInput,
                i18n,
                jest.fn().mockReturnValueOnce('thirtyDays'),
              )

              const connectionArgs = {
                last: invalidInput,
                period: 'thirtyDays',
                year: '2021',
              }

              try {
                await connectionLoader({
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error(`todo`))
              }
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: dmarcSumLoaderConnectionsByUserId.`,
              ])
            })
          })
        })
      })
      describe('period argument is not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = dmarcSumLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
            i18n,
            jest.fn().mockReturnValueOnce('thirtyDays'),
          )

          const connectionArgs = {
            first: 1,
            year: '2021',
          }

          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }
          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have \`period\` argument set for: dmarcSumLoaderConnectionsByUserId.`,
          ])
        })
      })
      describe('year argument is not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = dmarcSumLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
            i18n,
            jest.fn().mockReturnValueOnce('thirtyDays'),
          )

          const connectionArgs = {
            first: 1,
            period: 'january',
          }

          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }
          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have \`year\` argument set for: dmarcSumLoaderConnectionsByUserId.`,
          ])
        })
      })
      describe('given a database error', () => {
        describe('while querying for domain information', () => {
          it('returns an error message', async () => {
            const query = jest
              .fn()
              .mockRejectedValue(new Error('Database error occurred.'))

            const connectionLoader = dmarcSumLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              i18n,
              jest.fn().mockReturnValueOnce('thirtyDays'),
            )

            const connectionArgs = {
              first: 50,
              period: 'thirtyDays',
              year: '2021',
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `Database error occurred while user: ${user._key} was trying to gather dmarc summaries in dmarcSumLoaderConnectionsByUserId, error: Error: Database error occurred.`,
            ])
          })
        })
      })
      describe('given a cursor error', () => {
        describe('while gathering domains', () => {
          it('returns an error message', async () => {
            const cursor = {
              next() {
                throw new Error('Cursor error occurred.')
              },
            }
            const query = jest.fn().mockReturnValueOnce(cursor)

            const connectionLoader = dmarcSumLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              i18n,
              jest.fn().mockReturnValueOnce('thirtyDays'),
            )

            const connectionArgs = {
              first: 50,
              period: 'thirtyDays',
              year: '2021',
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `Cursor error occurred while user: ${user._key} was trying to gather dmarc summaries in dmarcSumLoaderConnectionsByUserId, error: Error: Cursor error occurred.`,
            ])
          })
        })
      })
    })
  })
})
