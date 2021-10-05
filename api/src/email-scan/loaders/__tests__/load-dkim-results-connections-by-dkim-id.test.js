import { stringify } from 'jest-matcher-utils'
import { ensure, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { cleanseInput } from '../../../validators'
import {
  loadDkimResultConnectionsByDkimId,
  loadDkimResultByKey,
} from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('when given the load dkim results connection function', () => {
  let query,
    drop,
    truncate,
    collections,
    user,
    dkimScan,
    dkimResult1,
    dkimResult2,
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
      dkimResult1 = await collections.dkimResults.save({})
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
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('using after cursor', () => {
      it('returns dkim result(s) after a given node id', async () => {
        const connectionLoader = loadDkimResultConnectionsByDkimId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const dkimResultLoader = loadDkimResultByKey({ query })
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
        const connectionLoader = loadDkimResultConnectionsByDkimId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const dkimResultLoader = loadDkimResultByKey({ query })
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
        const connectionLoader = loadDkimResultConnectionsByDkimId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const dkimResultLoader = loadDkimResultByKey({ query })
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
        const connectionLoader = loadDkimResultConnectionsByDkimId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const dkimResultLoader = loadDkimResultByKey({ query })
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
    describe('using the orderBy argument', () => {
      let dkimResultOne, dkimResultTwo, dkimResultThree
      beforeEach(async () => {
        await truncate()
        dkimResultOne = await collections.dkimResults.save({
          selector: 'a.selector.key',
          record: 'a.record',
          keyLength: 1,
        })
        dkimResultTwo = await collections.dkimResults.save({
          selector: 'b.selector.key',
          record: 'b.record',
          keyLength: 2,
        })
        dkimResultThree = await collections.dkimResults.save({
          selector: 'c.selector.key',
          record: 'c.record',
          keyLength: 3,
        })
        await collections.dkimToDkimResults.save({
          _from: dkimScan._id,
          _to: dkimResultOne._id,
        })
        await collections.dkimToDkimResults.save({
          _from: dkimScan._id,
          _to: dkimResultTwo._id,
        })
        await collections.dkimToDkimResults.save({
          _from: dkimScan._id,
          _to: dkimResultThree._id,
        })
      })
      describe('ordering on SELECTOR', () => {
        describe('direction set to ASC', () => {
          it('returns the dkim result', async () => {
            const loader = loadDkimResultByKey({
              query,
              userKey: user._key,
              i18n,
            })
            const expectedDkimResult = await loader.load(dkimResultTwo._key)

            const connectionLoader = loadDkimResultConnectionsByDkimId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              dkimId: dkimScan._id,
              first: 5,
              after: toGlobalId('dkimResult', dkimResultOne._key),
              before: toGlobalId('dkimResult', dkimResultThree._key),
              orderBy: {
                field: 'selector',
                direction: 'ASC',
              },
            }

            const dkimResults = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('dkimResult', expectedDkimResult._key),
                  node: {
                    dkimId: dkimScan._id,
                    ...expectedDkimResult,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('dkimResult', expectedDkimResult._key),
                endCursor: toGlobalId('dkimResult', expectedDkimResult._key),
              },
            }

            expect(dkimResults).toEqual(expectedStructure)
          })
        })
        describe('direction set to DESC', () => {
          it('returns the dkim result', async () => {
            const loader = loadDkimResultByKey({
              query,
              userKey: user._key,
              i18n,
            })
            const expectedDkimResult = await loader.load(dkimResultTwo._key)

            const connectionLoader = loadDkimResultConnectionsByDkimId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              dkimId: dkimScan._id,
              first: 5,
              after: toGlobalId('dkimResult', dkimResultThree._key),
              before: toGlobalId('dkimResult', dkimResultOne._key),
              orderBy: {
                field: 'selector',
                direction: 'DESC',
              },
            }

            const dkimResults = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('dkimResult', expectedDkimResult._key),
                  node: {
                    dkimId: dkimScan._id,
                    ...expectedDkimResult,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('dkimResult', expectedDkimResult._key),
                endCursor: toGlobalId('dkimResult', expectedDkimResult._key),
              },
            }

            expect(dkimResults).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on RECORD', () => {
        describe('direction set to ASC', () => {
          it('returns the dkim result', async () => {
            const loader = loadDkimResultByKey({
              query,
              userKey: user._key,
              i18n,
            })
            const expectedDkimResult = await loader.load(dkimResultTwo._key)

            const connectionLoader = loadDkimResultConnectionsByDkimId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              dkimId: dkimScan._id,
              first: 5,
              after: toGlobalId('dkimResult', dkimResultOne._key),
              before: toGlobalId('dkimResult', dkimResultThree._key),
              orderBy: {
                field: 'record',
                direction: 'ASC',
              },
            }

            const dkimResults = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('dkimResult', expectedDkimResult._key),
                  node: {
                    dkimId: dkimScan._id,
                    ...expectedDkimResult,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('dkimResult', expectedDkimResult._key),
                endCursor: toGlobalId('dkimResult', expectedDkimResult._key),
              },
            }

            expect(dkimResults).toEqual(expectedStructure)
          })
        })
        describe('direction set to DESC', () => {
          it('returns the dkim result', async () => {
            const loader = loadDkimResultByKey({
              query,
              userKey: user._key,
              i18n,
            })
            const expectedDkimResult = await loader.load(dkimResultTwo._key)

            const connectionLoader = loadDkimResultConnectionsByDkimId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              dkimId: dkimScan._id,
              first: 5,
              after: toGlobalId('dkimResult', dkimResultThree._key),
              before: toGlobalId('dkimResult', dkimResultOne._key),
              orderBy: {
                field: 'record',
                direction: 'DESC',
              },
            }

            const dkimResults = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('dkimResult', expectedDkimResult._key),
                  node: {
                    dkimId: dkimScan._id,
                    ...expectedDkimResult,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('dkimResult', expectedDkimResult._key),
                endCursor: toGlobalId('dkimResult', expectedDkimResult._key),
              },
            }

            expect(dkimResults).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on KEY_LENGTH', () => {
        describe('direction set to ASC', () => {
          it('returns the dkim result', async () => {
            const loader = loadDkimResultByKey({
              query,
              userKey: user._key,
              i18n,
            })
            const expectedDkimResult = await loader.load(dkimResultTwo._key)

            const connectionLoader = loadDkimResultConnectionsByDkimId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              dkimId: dkimScan._id,
              first: 5,
              after: toGlobalId('dkimResult', dkimResultOne._key),
              before: toGlobalId('dkimResult', dkimResultThree._key),
              orderBy: {
                field: 'key-length',
                direction: 'ASC',
              },
            }

            const dkimResults = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('dkimResult', expectedDkimResult._key),
                  node: {
                    dkimId: dkimScan._id,
                    ...expectedDkimResult,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('dkimResult', expectedDkimResult._key),
                endCursor: toGlobalId('dkimResult', expectedDkimResult._key),
              },
            }

            expect(dkimResults).toEqual(expectedStructure)
          })
        })
        describe('direction set to DESC', () => {
          it('returns the dkim result', async () => {
            const loader = loadDkimResultByKey({
              query,
              userKey: user._key,
              i18n,
            })
            const expectedDkimResult = await loader.load(dkimResultTwo._key)

            const connectionLoader = loadDkimResultConnectionsByDkimId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              dkimId: dkimScan._id,
              first: 5,
              after: toGlobalId('dkimResult', dkimResultThree._key),
              before: toGlobalId('dkimResult', dkimResultOne._key),
              orderBy: {
                field: 'key-length',
                direction: 'DESC',
              },
            }

            const dkimResults = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('dkimResult', expectedDkimResult._key),
                  node: {
                    dkimId: dkimScan._id,
                    ...expectedDkimResult,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('dkimResult', expectedDkimResult._key),
                endCursor: toGlobalId('dkimResult', expectedDkimResult._key),
              },
            }

            expect(dkimResults).toEqual(expectedStructure)
          })
        })
      })
    })
    describe('no dkim results are found', () => {
      it('returns an empty structure', async () => {
        await truncate()
        const connectionLoader = loadDkimResultConnectionsByDkimId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

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
          const connectionLoader = loadDkimResultConnectionsByDkimId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {}

          try {
            await connectionLoader({
              dkimId: dkimScan._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'You must provide a `first` or `last` value to properly paginate the `DKIMResults` connection.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadDkimResultConnectionsByDkimId.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadDkimResultConnectionsByDkimId({
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
              dkimId: dkimScan._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Passing both `first` and `last` to paginate the `DKIMResults` connection is not supported.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadDkimResultConnectionsByDkimId.`,
          ])
        })
      })
      describe('limits are below minimum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimResultConnectionsByDkimId({
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
                dkimId: dkimScan._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`first` on the `DKIMResults` connection cannot be less than zero.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadDkimResultConnectionsByDkimId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimResultConnectionsByDkimId({
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
                dkimId: dkimScan._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`last` on the `DKIMResults` connection cannot be less than zero.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadDkimResultConnectionsByDkimId.`,
            ])
          })
        })
      })
      describe('limits are above maximum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimResultConnectionsByDkimId({
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
                dkimId: dkimScan._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting 1000 records on the `DKIMResults` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 1000 for: loadDkimResultConnectionsByDkimId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimResultConnectionsByDkimId({
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
                dkimId: dkimScan._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting 500 records on the `DKIMResults` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: loadDkimResultConnectionsByDkimId.`,
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
              const connectionLoader = loadDkimResultConnectionsByDkimId({
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
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadDkimResultConnectionsByDkimId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = loadDkimResultConnectionsByDkimId({
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
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadDkimResultConnectionsByDkimId.`,
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

        const connectionLoader = loadDkimResultConnectionsByDkimId({
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
            dkimId: dkimScan._id,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to load DKIM result(s). Please try again.'),
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

        const connectionLoader = loadDkimResultConnectionsByDkimId({
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
            dkimId: dkimScan._id,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to load DKIM result(s). Please try again.'),
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
          const connectionLoader = loadDkimResultConnectionsByDkimId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {}

          try {
            await connectionLoader({
              dkimId: dkimScan._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Vous devez fournir une valeur `first` ou `last` pour paginer correctement la connexion `DKIMResults`.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadDkimResultConnectionsByDkimId.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadDkimResultConnectionsByDkimId({
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
              dkimId: dkimScan._id,
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
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadDkimResultConnectionsByDkimId.`,
          ])
        })
      })
      describe('limits are below minimum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimResultConnectionsByDkimId({
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
                dkimId: dkimScan._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`first` sur la connexion `DKIMResults` ne peut être inférieur à zéro.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadDkimResultConnectionsByDkimId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimResultConnectionsByDkimId({
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
                dkimId: dkimScan._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`last` sur la connexion `DKIMResults` ne peut être inférieur à zéro.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadDkimResultConnectionsByDkimId.`,
            ])
          })
        })
      })
      describe('limits are above maximum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimResultConnectionsByDkimId({
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
                dkimId: dkimScan._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'La demande de 1000 enregistrements sur la connexion `DKIMResults` dépasse la limite `first` de 100 enregistrements.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 1000 for: loadDkimResultConnectionsByDkimId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimResultConnectionsByDkimId({
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
                dkimId: dkimScan._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'La demande de 500 enregistrements sur la connexion `DKIMResults` dépasse la limite `last` de 100 enregistrements.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: loadDkimResultConnectionsByDkimId.`,
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
              const connectionLoader = loadDkimResultConnectionsByDkimId({
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
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadDkimResultConnectionsByDkimId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = loadDkimResultConnectionsByDkimId({
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
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadDkimResultConnectionsByDkimId.`,
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

        const connectionLoader = loadDkimResultConnectionsByDkimId({
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
            dkimId: dkimScan._id,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Impossible de charger le(s) résultat(s) DKIM. Veuillez réessayer.',
            ),
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

        const connectionLoader = loadDkimResultConnectionsByDkimId({
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
            dkimId: dkimScan._id,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Impossible de charger le(s) résultat(s) DKIM. Veuillez réessayer.',
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to get dkim result information for ${dkimScan._id}, error: Error: Cursor Error Occurred.`,
        ])
      })
    })
  })
})
