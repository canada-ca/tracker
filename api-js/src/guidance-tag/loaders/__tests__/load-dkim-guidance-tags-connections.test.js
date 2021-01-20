import { stringify } from 'jest-matcher-utils'
import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { cleanseInput } from '../../../validators'
import {
  dkimGuidanceTagConnectionsLoader,
  dkimGuidanceTagLoader,
} from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('when given the load dkim guidance tag connection function', () => {
  let query, drop, truncate, migrate, collections, user, i18n

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

    await collections.dkimGuidanceTags.save({
      _key: 'dkim1',
    })
    await collections.dkimGuidanceTags.save({
      _key: 'dkim2',
    })
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful load', () => {
    describe('using no cursor', () => {
      it('returns multiple dkim results', async () => {
        const connectionLoader = dkimGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dkimGuidanceTags = ['dkim1', 'dkim2']
        const connectionArgs = {
          first: 5,
        }

        const dkimTags = await connectionLoader({
          dkimGuidanceTags,
          ...connectionArgs,
        })

        const dkimTagLoader = dkimGuidanceTagLoader(query)
        const expectedDkimTags = await dkimTagLoader.loadMany(dkimGuidanceTags)

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', expectedDkimTags[0]._key),
              node: {
                ...expectedDkimTags[0],
              },
            },
            {
              cursor: toGlobalId('guidanceTags', expectedDkimTags[1]._key),
              node: {
                ...expectedDkimTags[1],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', expectedDkimTags[0]._key),
            endCursor: toGlobalId('guidanceTags', expectedDkimTags[1]._key),
          },
        }

        expect(dkimTags).toEqual(expectedStructure)
      })
    })
    describe('using after cursor', () => {
      it('returns dkim result(s) after a given node id', async () => {
        const connectionLoader = dkimGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dkimGuidanceTags = ['dkim1', 'dkim2']

        const dkimTagLoader = dkimGuidanceTagLoader(query)
        const expectedDkimTags = await dkimTagLoader.loadMany(dkimGuidanceTags)

        const connectionArgs = {
          first: 5,
          after: toGlobalId('guidanceTag', expectedDkimTags[0]._key),
        }

        const dkimTags = await connectionLoader({
          dkimGuidanceTags,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', expectedDkimTags[1]._key),
              node: {
                ...expectedDkimTags[1],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('guidanceTags', expectedDkimTags[1]._key),
            endCursor: toGlobalId('guidanceTags', expectedDkimTags[1]._key),
          },
        }

        expect(dkimTags).toEqual(expectedStructure)
      })
    })
    describe('using before cursor', () => {
      it('returns dkim result(s) before a given node id', async () => {
        const connectionLoader = dkimGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dkimGuidanceTags = ['dkim1', 'dkim2']

        const dkimTagLoader = dkimGuidanceTagLoader(query)
        const expectedDkimTags = await dkimTagLoader.loadMany(dkimGuidanceTags)

        const connectionArgs = {
          first: 5,
          before: toGlobalId('guidanceTags', expectedDkimTags[1]._key),
        }

        const dkimTags = await connectionLoader({
          dkimGuidanceTags,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', expectedDkimTags[0]._key),
              node: {
                ...expectedDkimTags[0],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', expectedDkimTags[0]._key),
            endCursor: toGlobalId('guidanceTags', expectedDkimTags[0]._key),
          },
        }

        expect(dkimTags).toEqual(expectedStructure)
      })
    })
    describe('using first limit', () => {
      it('returns the first n amount of item(s)', async () => {
        const connectionLoader = dkimGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dkimGuidanceTags = ['dkim1', 'dkim2']

        const dkimTagLoader = dkimGuidanceTagLoader(query)
        const expectedDkimTags = await dkimTagLoader.loadMany(dkimGuidanceTags)

        const connectionArgs = {
          first: 1,
        }

        const dkimTags = await connectionLoader({
          dkimGuidanceTags,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', expectedDkimTags[0]._key),
              node: {
                ...expectedDkimTags[0],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', expectedDkimTags[0]._key),
            endCursor: toGlobalId('guidanceTags', expectedDkimTags[0]._key),
          },
        }

        expect(dkimTags).toEqual(expectedStructure)
      })
    })
    describe('using last limit', () => {
      it('returns the last n amount of item(s)', async () => {
        const connectionLoader = dkimGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dkimGuidanceTags = ['dkim1', 'dkim2']

        const dkimTagLoader = dkimGuidanceTagLoader(query)
        const expectedDkimTags = await dkimTagLoader.loadMany(dkimGuidanceTags)

        const connectionArgs = {
          last: 1,
        }

        const dkimTags = await connectionLoader({
          dkimGuidanceTags,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', expectedDkimTags[1]._key),
              node: {
                ...expectedDkimTags[1],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('guidanceTags', expectedDkimTags[1]._key),
            endCursor: toGlobalId('guidanceTags', expectedDkimTags[1]._key),
          },
        }

        expect(dkimTags).toEqual(expectedStructure)
      })
    })
    describe('no dkim results are found', () => {
      it('returns an empty structure', async () => {
        await truncate()
        const connectionLoader = dkimGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const connectionArgs = {
          first: 5,
        }

        const dkimGuidanceTags = ['dkim1', 'dkim2']
        const dkimTags = await connectionLoader({
          dkimGuidanceTags,
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

        expect(dkimTags).toEqual(expectedStructure)
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
          const connectionLoader = dkimGuidanceTagConnectionsLoader(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const dkimGuidanceTags = ['dkim1', 'dkim2']
          const connectionArgs = {}

          try {
            await connectionLoader({
              dkimGuidanceTags,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'You must provide a `first` or `last` value to properly paginate the `guidanceTag` connection.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: dkimGuidanceTagConnectionsLoader.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = dkimGuidanceTagConnectionsLoader(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const dkimGuidanceTags = ['dkim1', 'dkim2']
          const connectionArgs = {
            first: 1,
            last: 5,
          }

          try {
            await connectionLoader({
              dkimGuidanceTags,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Passing both `first` and `last` to paginate the `guidanceTag` connection is not supported.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: dkimGuidanceTagConnectionsLoader.`,
          ])
        })
      })
      describe('limits are below minimum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dkimGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const dkimGuidanceTags = ['dkim1', 'dkim2']
            const connectionArgs = {
              first: -1,
            }

            try {
              await connectionLoader({
                dkimGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`first` on the `guidanceTag` connection cannot be less than zero.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: dkimGuidanceTagConnectionsLoader.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dkimGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const dkimGuidanceTags = ['dkim1', 'dkim2']
            const connectionArgs = {
              last: -5,
            }

            try {
              await connectionLoader({
                dkimGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`last` on the `guidanceTag` connection cannot be less than zero.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: dkimGuidanceTagConnectionsLoader.`,
            ])
          })
        })
      })
      describe('limits are above maximum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dkimGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const dkimGuidanceTags = ['dkim1', 'dkim2']
            const connectionArgs = {
              first: 1000,
            }

            try {
              await connectionLoader({
                dkimGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting `1000` records on the `guidanceTag` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 1000 for: dkimGuidanceTagConnectionsLoader.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dkimGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const dkimGuidanceTags = ['dkim1', 'dkim2']
            const connectionArgs = {
              last: 500,
            }

            try {
              await connectionLoader({
                dkimGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting `500` records on the `guidanceTag` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: dkimGuidanceTagConnectionsLoader.`,
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
              const connectionLoader = dkimGuidanceTagConnectionsLoader(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

              const dkimGuidanceTags = ['dkim1', 'dkim2']
              const connectionArgs = {
                first: invalidInput,
              }

              try {
                await connectionLoader({
                  dkimGuidanceTags,
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
                } attempted to have \`first\` set as a ${typeof invalidInput} for: dkimGuidanceTagConnectionsLoader.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = dkimGuidanceTagConnectionsLoader(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

              const dkimGuidanceTags = ['dkim1', 'dkim2']
              const connectionArgs = {
                last: invalidInput,
              }

              try {
                await connectionLoader({
                  dkimGuidanceTags,
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
                } attempted to have \`last\` set as a ${typeof invalidInput} for: dkimGuidanceTagConnectionsLoader.`,
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

        const connectionLoader = dkimGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dkimGuidanceTags = ['dkim1', 'dkim2']
        const connectionArgs = {
          first: 5,
        }
        try {
          await connectionLoader({
            dkimGuidanceTags,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to load dkim guidance tags. Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to gather orgs in dkimGuidanceTagConnectionsLoader, error: Error: Database Error Occurred.`,
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

        const connectionLoader = dkimGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dkimGuidanceTags = ['dkim1', 'dkim2']
        const connectionArgs = {
          first: 5,
        }
        try {
          await connectionLoader({
            dkimGuidanceTags,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to load dkim guidance tags. Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to gather orgs in dkimGuidanceTagConnectionsLoader, error: Error: Cursor Error Occurred.`,
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
          const connectionLoader = dkimGuidanceTagConnectionsLoader(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const dkimGuidanceTags = ['dkim1', 'dkim2']
          const connectionArgs = {}

          try {
            await connectionLoader({
              dkimGuidanceTags,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: dkimGuidanceTagConnectionsLoader.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = dkimGuidanceTagConnectionsLoader(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const dkimGuidanceTags = ['dkim1', 'dkim2']
          const connectionArgs = {
            first: 1,
            last: 5,
          }

          try {
            await connectionLoader({
              dkimGuidanceTags,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: dkimGuidanceTagConnectionsLoader.`,
          ])
        })
      })
      describe('limits are below minimum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dkimGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const dkimGuidanceTags = ['dkim1', 'dkim2']
            const connectionArgs = {
              first: -1,
            }

            try {
              await connectionLoader({
                dkimGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: dkimGuidanceTagConnectionsLoader.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dkimGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const dkimGuidanceTags = ['dkim1', 'dkim2']
            const connectionArgs = {
              last: -5,
            }

            try {
              await connectionLoader({
                dkimGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: dkimGuidanceTagConnectionsLoader.`,
            ])
          })
        })
      })
      describe('limits are above maximum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dkimGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const dkimGuidanceTags = ['dkim1', 'dkim2']
            const connectionArgs = {
              first: 1000,
            }

            try {
              await connectionLoader({
                dkimGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 1000 for: dkimGuidanceTagConnectionsLoader.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dkimGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const dkimGuidanceTags = ['dkim1', 'dkim2']
            const connectionArgs = {
              last: 500,
            }

            try {
              await connectionLoader({
                dkimGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: dkimGuidanceTagConnectionsLoader.`,
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
              const connectionLoader = dkimGuidanceTagConnectionsLoader(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

              const dkimGuidanceTags = ['dkim1', 'dkim2']
              const connectionArgs = {
                first: invalidInput,
              }

              try {
                await connectionLoader({
                  dkimGuidanceTags,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error(`todo`))
              }
              expect(consoleWarnOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: dkimGuidanceTagConnectionsLoader.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = dkimGuidanceTagConnectionsLoader(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

              const dkimGuidanceTags = ['dkim1', 'dkim2']
              const connectionArgs = {
                last: invalidInput,
              }

              try {
                await connectionLoader({
                  dkimGuidanceTags,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error(`todo`))
              }
              expect(consoleWarnOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: dkimGuidanceTagConnectionsLoader.`,
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

        const connectionLoader = dkimGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dkimGuidanceTags = ['dkim1', 'dkim2']
        const connectionArgs = {
          first: 5,
        }
        try {
          await connectionLoader({
            dkimGuidanceTags,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to gather orgs in dkimGuidanceTagConnectionsLoader, error: Error: Database Error Occurred.`,
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

        const connectionLoader = dkimGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dkimGuidanceTags = ['dkim1', 'dkim2']
        const connectionArgs = {
          first: 5,
        }
        try {
          await connectionLoader({
            dkimGuidanceTags,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to gather orgs in dkimGuidanceTagConnectionsLoader, error: Error: Cursor Error Occurred.`,
        ])
      })
    })
  })
})
