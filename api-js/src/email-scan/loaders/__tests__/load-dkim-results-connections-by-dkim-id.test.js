import { stringify } from 'jest-matcher-utils'
import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { cleanseInput } from '../../../validators'
import {
  dkimResultsLoaderConnectionByDkimId,
  dkimResultLoaderByKey,
} from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('when given the load dkim results connection function', () => {
  let query, drop, truncate, migrate, collections, user, dkimScan, i18n

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
    dkimScan = await collections.dkim.save({
      timestamp: '2020-10-02T12:43:39Z',
    })
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful load', () => {
    let dkimResult1, dkimResult2
    beforeEach(async () => {
      dkimResult1 = await collections.dkimResults.save({})
      dkimResult2 = await collections.dkimResults.save({})

      await collections.dkimToDkimResults.save({
        _from: dkimScan._id,
        _to: dkimResult1._id,
      })
      await collections.dkimToDkimResults.save({
        _from: dkimScan._id,
        _to: dkimResult2._id,
      })
    })

    describe('using no cursor', () => {
      it('returns multiple dkim results', async () => {
        const connectionLoader = dkimResultsLoaderConnectionByDkimId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const connectionArgs = {
          first: 5,
        }

        const dkimResults = await connectionLoader({
          dkimId: dkimScan._id,
          ...connectionArgs,
        })

        const dkimResultLoader = dkimResultLoaderByKey(query)
        const expectedDkimResults = await dkimResultLoader.loadMany([
          dkimResult1._key,
          dkimResult2._key,
        ])

        expectedDkimResults[0].id = expectedDkimResults[0]._key
        expectedDkimResults[1].id = expectedDkimResults[1]._key

        expectedDkimResults[0].dkimId = dkimScan._id
        expectedDkimResults[1].dkimId = dkimScan._id

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dkimResult', expectedDkimResults[0]._key),
              node: {
                ...expectedDkimResults[0],
              },
            },
            {
              cursor: toGlobalId('dkimResult', expectedDkimResults[1]._key),
              node: {
                ...expectedDkimResults[1],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('dkimResult', expectedDkimResults[0]._key),
            endCursor: toGlobalId('dkimResult', expectedDkimResults[1]._key),
          },
        }

        expect(dkimResults).toEqual(expectedStructure)
      })
    })
    describe('using after cursor', () => {
      it('returns dkim result(s) after a given node id', async () => {
        const connectionLoader = dkimResultsLoaderConnectionByDkimId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dkimResultLoader = dkimResultLoaderByKey(query)
        const expectedDkimResults = await dkimResultLoader.loadMany([
          dkimResult1._key,
          dkimResult2._key,
        ])

        expectedDkimResults[0].id = expectedDkimResults[0]._key
        expectedDkimResults[0].dkimId = dkimScan._id

        expectedDkimResults[1].id = expectedDkimResults[1]._key
        expectedDkimResults[1].dkimId = dkimScan._id

        const connectionArgs = {
          first: 5,
          after: toGlobalId('dkimResult', expectedDkimResults[0]._key),
        }

        const dkimResults = await connectionLoader({
          dkimId: dkimScan._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dkimResult', expectedDkimResults[1]._key),
              node: {
                ...expectedDkimResults[1],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('dkimResult', expectedDkimResults[1]._key),
            endCursor: toGlobalId('dkimResult', expectedDkimResults[1]._key),
          },
        }

        expect(dkimResults).toEqual(expectedStructure)
      })
    })
    describe('using before cursor', () => {
      it('returns dkim result(s) before a given node id', async () => {
        const connectionLoader = dkimResultsLoaderConnectionByDkimId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dkimResultLoader = dkimResultLoaderByKey(query)
        const expectedDkimResults = await dkimResultLoader.loadMany([
          dkimResult1._key,
          dkimResult2._key,
        ])

        expectedDkimResults[0].id = expectedDkimResults[0]._key
        expectedDkimResults[0].dkimId = dkimScan._id

        expectedDkimResults[1].id = expectedDkimResults[1]._key
        expectedDkimResults[1].dkimId = dkimScan._id

        const connectionArgs = {
          first: 5,
          before: toGlobalId('dkimResult', expectedDkimResults[1]._key),
        }

        const dkimResults = await connectionLoader({
          dkimId: dkimScan._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dkimResult', expectedDkimResults[0]._key),
              node: {
                ...expectedDkimResults[0],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('dkimResult', expectedDkimResults[0]._key),
            endCursor: toGlobalId('dkimResult', expectedDkimResults[0]._key),
          },
        }

        expect(dkimResults).toEqual(expectedStructure)
      })
    })
    describe('using first limit', () => {
      it('returns the first n amount of item(s)', async () => {
        const connectionLoader = dkimResultsLoaderConnectionByDkimId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dkimResultLoader = dkimResultLoaderByKey(query)
        const expectedDkimResults = await dkimResultLoader.loadMany([
          dkimResult1._key,
          dkimResult2._key,
        ])

        expectedDkimResults[0].id = expectedDkimResults[0]._key
        expectedDkimResults[0].dkimId = dkimScan._id

        expectedDkimResults[1].id = expectedDkimResults[1]._key
        expectedDkimResults[1].dkimId = dkimScan._id

        const connectionArgs = {
          first: 1,
        }

        const dkimResults = await connectionLoader({
          dkimId: dkimScan._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dkimResult', expectedDkimResults[0]._key),
              node: {
                ...expectedDkimResults[0],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('dkimResult', expectedDkimResults[0]._key),
            endCursor: toGlobalId('dkimResult', expectedDkimResults[0]._key),
          },
        }

        expect(dkimResults).toEqual(expectedStructure)
      })
    })
    describe('using last limit', () => {
      it('returns the last n amount of item(s)', async () => {
        const connectionLoader = dkimResultsLoaderConnectionByDkimId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dkimResultLoader = dkimResultLoaderByKey(query)
        const expectedDkimResults = await dkimResultLoader.loadMany([
          dkimResult1._key,
          dkimResult2._key,
        ])

        expectedDkimResults[0].id = expectedDkimResults[0]._key
        expectedDkimResults[0].dkimId = dkimScan._id

        expectedDkimResults[1].id = expectedDkimResults[1]._key
        expectedDkimResults[1].dkimId = dkimScan._id

        const connectionArgs = {
          last: 1,
        }

        const dkimResults = await connectionLoader({
          dkimId: dkimScan._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('dkimResult', expectedDkimResults[1]._key),
              node: {
                ...expectedDkimResults[1],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('dkimResult', expectedDkimResults[1]._key),
            endCursor: toGlobalId('dkimResult', expectedDkimResults[1]._key),
          },
        }

        expect(dkimResults).toEqual(expectedStructure)
      })
    })
    describe('no dkim results are found', () => {
      it('returns an empty structure', async () => {
        await truncate()
        const connectionLoader = dkimResultsLoaderConnectionByDkimId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const connectionArgs = {
          first: 5,
        }

        const dkimResults = await connectionLoader({
          dkimId: dkimScan._id,
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

        expect(dkimResults).toEqual(expectedStructure)
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
    describe('given a unsuccessful load', () => {
      describe('both limits are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = dkimResultsLoaderConnectionByDkimId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {}

          try {
            await connectionLoader({
              dkimId: dkimScan._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'You must provide a `first` or `last` value to properly paginate the `dkimResults` connection.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: dkimResultsLoaderConnectionByDkimId.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = dkimResultsLoaderConnectionByDkimId(
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
              dkimId: dkimScan._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Passing both `first` and `last` to paginate the `dkimResults` connection is not supported.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: dkimResultsLoaderConnectionByDkimId.`,
          ])
        })
      })
      describe('limits are below minimum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dkimResultsLoaderConnectionByDkimId(
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
                dkimId: dkimScan._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`first` on the `dkimResults` connection cannot be less than zero.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: dkimResultsLoaderConnectionByDkimId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dkimResultsLoaderConnectionByDkimId(
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
                dkimId: dkimScan._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`last` on the `dkimResults` connection cannot be less than zero.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: dkimResultsLoaderConnectionByDkimId.`,
            ])
          })
        })
      })
      describe('limits are above maximum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dkimResultsLoaderConnectionByDkimId(
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
                dkimId: dkimScan._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting 1000 records on the `dkimResults` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 1000 for: dkimResultsLoaderConnectionByDkimId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dkimResultsLoaderConnectionByDkimId(
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
                dkimId: dkimScan._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting 500 records on the `dkimResults` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: dkimResultsLoaderConnectionByDkimId.`,
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
              const connectionLoader = dkimResultsLoaderConnectionByDkimId(
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
                } attempted to have \`first\` set as a ${typeof invalidInput} for: dkimResultsLoaderConnectionByDkimId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = dkimResultsLoaderConnectionByDkimId(
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
                } attempted to have \`last\` set as a ${typeof invalidInput} for: dkimResultsLoaderConnectionByDkimId.`,
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

        const connectionLoader = dkimResultsLoaderConnectionByDkimId(
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
            dkimId: dkimScan._id,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to load dkim results. Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to get dkim result information for ${dkimScan._id}, error: Error: Database Error Occurred.`,
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

        const connectionLoader = dkimResultsLoaderConnectionByDkimId(
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
            dkimId: dkimScan._id,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to load dkim results. Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to get dkim result information for ${dkimScan._id}, error: Error: Cursor Error Occurred.`,
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
    describe('given a unsuccessful load', () => {
      describe('both limits are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = dkimResultsLoaderConnectionByDkimId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {}

          try {
            await connectionLoader({
              dkimId: dkimScan._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: dkimResultsLoaderConnectionByDkimId.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = dkimResultsLoaderConnectionByDkimId(
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
              dkimId: dkimScan._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: dkimResultsLoaderConnectionByDkimId.`,
          ])
        })
      })
      describe('limits are below minimum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dkimResultsLoaderConnectionByDkimId(
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
                dkimId: dkimScan._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: dkimResultsLoaderConnectionByDkimId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dkimResultsLoaderConnectionByDkimId(
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
                dkimId: dkimScan._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: dkimResultsLoaderConnectionByDkimId.`,
            ])
          })
        })
      })
      describe('limits are above maximum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dkimResultsLoaderConnectionByDkimId(
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
                dkimId: dkimScan._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 1000 for: dkimResultsLoaderConnectionByDkimId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dkimResultsLoaderConnectionByDkimId(
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
                dkimId: dkimScan._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: dkimResultsLoaderConnectionByDkimId.`,
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
              const connectionLoader = dkimResultsLoaderConnectionByDkimId(
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
                } attempted to have \`first\` set as a ${typeof invalidInput} for: dkimResultsLoaderConnectionByDkimId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = dkimResultsLoaderConnectionByDkimId(
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
                } attempted to have \`last\` set as a ${typeof invalidInput} for: dkimResultsLoaderConnectionByDkimId.`,
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

        const connectionLoader = dkimResultsLoaderConnectionByDkimId(
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
            dkimId: dkimScan._id,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to get dkim result information for ${dkimScan._id}, error: Error: Database Error Occurred.`,
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

        const connectionLoader = dkimResultsLoaderConnectionByDkimId(
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
            dkimId: dkimScan._id,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to get dkim result information for ${dkimScan._id}, error: Error: Cursor Error Occurred.`,
        ])
      })
    })
  })
})
