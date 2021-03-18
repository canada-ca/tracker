import { stringify } from 'jest-matcher-utils'
import { ensure, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { cleanseInput } from '../../../validators'
import {
  dmarcGuidanceTagConnectionsLoader,
  dmarcGuidanceTagLoader,
} from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('when given the load dmarc guidance tag connection function', () => {
  let query, drop, truncate, collections, user, i18n

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

    await collections.dmarcGuidanceTags.save({
      _key: 'dmarc1',
    })
    await collections.dmarcGuidanceTags.save({
      _key: 'dmarc2',
    })
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful load', () => {
    describe('using after cursor', () => {
      it('returns dmarc result(s) after a given node id', async () => {
        const connectionLoader = dmarcGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dmarcGuidanceTags = ['dmarc1', 'dmarc2']

        const dmarcTagLoader = dmarcGuidanceTagLoader(query)
        const expectedDmarcTags = await dmarcTagLoader.loadMany(
          dmarcGuidanceTags,
        )

        const connectionArgs = {
          first: 5,
          after: toGlobalId('guidanceTag', expectedDmarcTags[0]._key),
        }

        const dmarcTags = await connectionLoader({
          dmarcGuidanceTags,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', expectedDmarcTags[1]._key),
              node: {
                ...expectedDmarcTags[1],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('guidanceTags', expectedDmarcTags[1]._key),
            endCursor: toGlobalId('guidanceTags', expectedDmarcTags[1]._key),
          },
        }

        expect(dmarcTags).toEqual(expectedStructure)
      })
    })
    describe('using before cursor', () => {
      it('returns dmarc result(s) before a given node id', async () => {
        const connectionLoader = dmarcGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dmarcGuidanceTags = ['dmarc1', 'dmarc2']

        const dmarcTagLoader = dmarcGuidanceTagLoader(query)
        const expectedDmarcTags = await dmarcTagLoader.loadMany(
          dmarcGuidanceTags,
        )

        const connectionArgs = {
          first: 5,
          before: toGlobalId('guidanceTags', expectedDmarcTags[1]._key),
        }

        const dmarcTags = await connectionLoader({
          dmarcGuidanceTags,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', expectedDmarcTags[0]._key),
              node: {
                ...expectedDmarcTags[0],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', expectedDmarcTags[0]._key),
            endCursor: toGlobalId('guidanceTags', expectedDmarcTags[0]._key),
          },
        }

        expect(dmarcTags).toEqual(expectedStructure)
      })
    })
    describe('using first limit', () => {
      it('returns the first n amount of item(s)', async () => {
        const connectionLoader = dmarcGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dmarcGuidanceTags = ['dmarc1', 'dmarc2']

        const dmarcTagLoader = dmarcGuidanceTagLoader(query)
        const expectedDmarcTags = await dmarcTagLoader.loadMany(
          dmarcGuidanceTags,
        )

        const connectionArgs = {
          first: 1,
        }

        const dmarcTags = await connectionLoader({
          dmarcGuidanceTags,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', expectedDmarcTags[0]._key),
              node: {
                ...expectedDmarcTags[0],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('guidanceTags', expectedDmarcTags[0]._key),
            endCursor: toGlobalId('guidanceTags', expectedDmarcTags[0]._key),
          },
        }

        expect(dmarcTags).toEqual(expectedStructure)
      })
    })
    describe('using last limit', () => {
      it('returns the last n amount of item(s)', async () => {
        const connectionLoader = dmarcGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dmarcGuidanceTags = ['dmarc1', 'dmarc2']

        const dmarcTagLoader = dmarcGuidanceTagLoader(query)
        const expectedDmarcTags = await dmarcTagLoader.loadMany(
          dmarcGuidanceTags,
        )

        const connectionArgs = {
          last: 1,
        }

        const dmarcTags = await connectionLoader({
          dmarcGuidanceTags,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('guidanceTags', expectedDmarcTags[1]._key),
              node: {
                ...expectedDmarcTags[1],
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('guidanceTags', expectedDmarcTags[1]._key),
            endCursor: toGlobalId('guidanceTags', expectedDmarcTags[1]._key),
          },
        }

        expect(dmarcTags).toEqual(expectedStructure)
      })
    })
    describe('using orderBy field', () => {
      beforeEach(async () => {
        await truncate()
        await collections.dmarcGuidanceTags.save({
          _key: 'dmarc1',
          tagName: 'a',
          guidance: 'a',
        })
        await collections.dmarcGuidanceTags.save({
          _key: 'dmarc2',
          tagName: 'b',
          guidance: 'b',
        })
        await collections.dmarcGuidanceTags.save({
          _key: 'dmarc3',
          tagName: 'c',
          guidance: 'c',
        })
      })
      describe('ordering on TAG_ID', () => {
        describe('order is set to ASC', () => {
          it('returns guidance tag', async () => {
            const loader = dmarcGuidanceTagLoader(query)
            const expectedDmarcTag = await loader.load('dmarc2')

            const connectionLoader = dmarcGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              dmarcGuidanceTags: ['dmarc1', 'dmarc2', 'dmarc3'],
              first: 5,
              after: toGlobalId('guidanceTags', 'dmarc1'),
              before: toGlobalId('guidanceTags', 'dmarc3'),
              orderBy: {
                field: 'tag-id',
                direction: 'ASC',
              },
            }
            const dkimTags = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('guidanceTags', expectedDmarcTag._key),
                  node: {
                    ...expectedDmarcTag,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('guidanceTags', expectedDmarcTag._key),
                endCursor: toGlobalId('guidanceTags', expectedDmarcTag._key),
              },
            }

            expect(dkimTags).toEqual(expectedStructure)
          })
        })
        describe('ordering is set to DESC', () => {
          it('returns guidance tag', async () => {
            const loader = dmarcGuidanceTagLoader(query)
            const expectedDmarcTag = await loader.load('dmarc2')

            const connectionLoader = dmarcGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              dmarcGuidanceTags: ['dmarc1', 'dmarc2', 'dmarc3'],
              first: 5,
              after: toGlobalId('guidanceTags', 'dmarc3'),
              before: toGlobalId('guidanceTags', 'dmarc1'),
              orderBy: {
                field: 'tag-id',
                direction: 'DESC',
              },
            }
            const dmarcTags = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('guidanceTags', expectedDmarcTag._key),
                  node: {
                    ...expectedDmarcTag,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('guidanceTags', expectedDmarcTag._key),
                endCursor: toGlobalId('guidanceTags', expectedDmarcTag._key),
              },
            }

            expect(dmarcTags).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on TAG_NAME', () => {
        describe('order is set to ASC', () => {
          it('returns guidance tag', async () => {
            const loader = dmarcGuidanceTagLoader(query)
            const expectedDmarcTag = await loader.load('dmarc2')

            const connectionLoader = dmarcGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              dmarcGuidanceTags: ['dmarc1', 'dmarc2', 'dmarc3'],
              first: 5,
              after: toGlobalId('guidanceTags', 'dmarc1'),
              before: toGlobalId('guidanceTags', 'dmarc3'),
              orderBy: {
                field: 'tag-name',
                direction: 'ASC',
              },
            }
            const dkimTags = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('guidanceTags', expectedDmarcTag._key),
                  node: {
                    ...expectedDmarcTag,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('guidanceTags', expectedDmarcTag._key),
                endCursor: toGlobalId('guidanceTags', expectedDmarcTag._key),
              },
            }

            expect(dkimTags).toEqual(expectedStructure)
          })
        })
        describe('ordering is set to DESC', () => {
          it('returns guidance tag', async () => {
            const loader = dmarcGuidanceTagLoader(query)
            const expectedDmarcTag = await loader.load('dmarc2')

            const connectionLoader = dmarcGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              dmarcGuidanceTags: ['dmarc1', 'dmarc2', 'dmarc3'],
              first: 5,
              after: toGlobalId('guidanceTags', 'dmarc3'),
              before: toGlobalId('guidanceTags', 'dmarc1'),
              orderBy: {
                field: 'tag-name',
                direction: 'DESC',
              },
            }
            const dmarcTags = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('guidanceTags', expectedDmarcTag._key),
                  node: {
                    ...expectedDmarcTag,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('guidanceTags', expectedDmarcTag._key),
                endCursor: toGlobalId('guidanceTags', expectedDmarcTag._key),
              },
            }

            expect(dmarcTags).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on GUIDANCE', () => {
        describe('order is set to ASC', () => {
          it('returns guidance tag', async () => {
            const loader = dmarcGuidanceTagLoader(query)
            const expectedDmarcTag = await loader.load('dmarc2')

            const connectionLoader = dmarcGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              dmarcGuidanceTags: ['dmarc1', 'dmarc2', 'dmarc3'],
              first: 5,
              after: toGlobalId('guidanceTags', 'dmarc1'),
              before: toGlobalId('guidanceTags', 'dmarc3'),
              orderBy: {
                field: 'guidance',
                direction: 'ASC',
              },
            }
            const dkimTags = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('guidanceTags', expectedDmarcTag._key),
                  node: {
                    ...expectedDmarcTag,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('guidanceTags', expectedDmarcTag._key),
                endCursor: toGlobalId('guidanceTags', expectedDmarcTag._key),
              },
            }

            expect(dkimTags).toEqual(expectedStructure)
          })
        })
        describe('ordering is set to DESC', () => {
          it('returns guidance tag', async () => {
            const loader = dmarcGuidanceTagLoader(query)
            const expectedDmarcTag = await loader.load('dmarc2')

            const connectionLoader = dmarcGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              dmarcGuidanceTags: ['dmarc1', 'dmarc2', 'dmarc3'],
              first: 5,
              after: toGlobalId('guidanceTags', 'dmarc3'),
              before: toGlobalId('guidanceTags', 'dmarc1'),
              orderBy: {
                field: 'guidance',
                direction: 'DESC',
              },
            }
            const dmarcTags = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('guidanceTags', expectedDmarcTag._key),
                  node: {
                    ...expectedDmarcTag,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('guidanceTags', expectedDmarcTag._key),
                endCursor: toGlobalId('guidanceTags', expectedDmarcTag._key),
              },
            }

            expect(dmarcTags).toEqual(expectedStructure)
          })
        })
      })
    })
    describe('no dmarc results are found', () => {
      it('returns an empty structure', async () => {
        await truncate()
        const connectionLoader = dmarcGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const connectionArgs = {
          first: 5,
        }

        const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
        const dmarcTags = await connectionLoader({
          dmarcGuidanceTags,
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

        expect(dmarcTags).toEqual(expectedStructure)
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
          const connectionLoader = dmarcGuidanceTagConnectionsLoader(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
          const connectionArgs = {}

          try {
            await connectionLoader({
              dmarcGuidanceTags,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'You must provide a `first` or `last` value to properly paginate the `GuidanceTag` connection.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: dmarcGuidanceTagConnectionsLoader.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = dmarcGuidanceTagConnectionsLoader(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
          const connectionArgs = {
            first: 1,
            last: 5,
          }

          try {
            await connectionLoader({
              dmarcGuidanceTags,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Passing both `first` and `last` to paginate the `GuidanceTag` connection is not supported.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: dmarcGuidanceTagConnectionsLoader.`,
          ])
        })
      })
      describe('limits are below minimum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dmarcGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
            const connectionArgs = {
              first: -1,
            }

            try {
              await connectionLoader({
                dmarcGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`first` on the `GuidanceTag` connection cannot be less than zero.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: dmarcGuidanceTagConnectionsLoader.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dmarcGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
            const connectionArgs = {
              last: -5,
            }

            try {
              await connectionLoader({
                dmarcGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`last` on the `GuidanceTag` connection cannot be less than zero.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: dmarcGuidanceTagConnectionsLoader.`,
            ])
          })
        })
      })
      describe('limits are above maximum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dmarcGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
            const connectionArgs = {
              first: 1000,
            }

            try {
              await connectionLoader({
                dmarcGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting `1000` records on the `GuidanceTag` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 1000 for: dmarcGuidanceTagConnectionsLoader.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dmarcGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
            const connectionArgs = {
              last: 500,
            }

            try {
              await connectionLoader({
                dmarcGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting `500` records on the `GuidanceTag` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: dmarcGuidanceTagConnectionsLoader.`,
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
              const connectionLoader = dmarcGuidanceTagConnectionsLoader(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

              const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
              const connectionArgs = {
                first: invalidInput,
              }

              try {
                await connectionLoader({
                  dmarcGuidanceTags,
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
                } attempted to have \`first\` set as a ${typeof invalidInput} for: dmarcGuidanceTagConnectionsLoader.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = dmarcGuidanceTagConnectionsLoader(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

              const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
              const connectionArgs = {
                last: invalidInput,
              }

              try {
                await connectionLoader({
                  dmarcGuidanceTags,
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
                } attempted to have \`last\` set as a ${typeof invalidInput} for: dmarcGuidanceTagConnectionsLoader.`,
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

        const connectionLoader = dmarcGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
        const connectionArgs = {
          first: 5,
        }
        try {
          await connectionLoader({
            dmarcGuidanceTags,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Unable to load DMARC guidance tag(s). Please try again.',
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to gather orgs in dmarcGuidanceTagConnectionsLoader, error: Error: Database Error Occurred.`,
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

        const connectionLoader = dmarcGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
        const connectionArgs = {
          first: 5,
        }
        try {
          await connectionLoader({
            dmarcGuidanceTags,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Unable to load DMARC guidance tag(s). Please try again.',
            ),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to gather orgs in dmarcGuidanceTagConnectionsLoader, error: Error: Cursor Error Occurred.`,
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
          const connectionLoader = dmarcGuidanceTagConnectionsLoader(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
          const connectionArgs = {}

          try {
            await connectionLoader({
              dmarcGuidanceTags,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: dmarcGuidanceTagConnectionsLoader.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = dmarcGuidanceTagConnectionsLoader(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
          const connectionArgs = {
            first: 1,
            last: 5,
          }

          try {
            await connectionLoader({
              dmarcGuidanceTags,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: dmarcGuidanceTagConnectionsLoader.`,
          ])
        })
      })
      describe('limits are below minimum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dmarcGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
            const connectionArgs = {
              first: -1,
            }

            try {
              await connectionLoader({
                dmarcGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: dmarcGuidanceTagConnectionsLoader.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dmarcGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
            const connectionArgs = {
              last: -5,
            }

            try {
              await connectionLoader({
                dmarcGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: dmarcGuidanceTagConnectionsLoader.`,
            ])
          })
        })
      })
      describe('limits are above maximum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dmarcGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
            const connectionArgs = {
              first: 1000,
            }

            try {
              await connectionLoader({
                dmarcGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 1000 for: dmarcGuidanceTagConnectionsLoader.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = dmarcGuidanceTagConnectionsLoader(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
            const connectionArgs = {
              last: 500,
            }

            try {
              await connectionLoader({
                dmarcGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: dmarcGuidanceTagConnectionsLoader.`,
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
              const connectionLoader = dmarcGuidanceTagConnectionsLoader(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

              const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
              const connectionArgs = {
                first: invalidInput,
              }

              try {
                await connectionLoader({
                  dmarcGuidanceTags,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error(`todo`))
              }
              expect(consoleWarnOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: dmarcGuidanceTagConnectionsLoader.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = dmarcGuidanceTagConnectionsLoader(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

              const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
              const connectionArgs = {
                last: invalidInput,
              }

              try {
                await connectionLoader({
                  dmarcGuidanceTags,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error(`todo`))
              }
              expect(consoleWarnOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: dmarcGuidanceTagConnectionsLoader.`,
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

        const connectionLoader = dmarcGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
        const connectionArgs = {
          first: 5,
        }
        try {
          await connectionLoader({
            dmarcGuidanceTags,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to gather orgs in dmarcGuidanceTagConnectionsLoader, error: Error: Database Error Occurred.`,
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

        const connectionLoader = dmarcGuidanceTagConnectionsLoader(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const dmarcGuidanceTags = ['dmarc1', 'dmarc2']
        const connectionArgs = {
          first: 5,
        }
        try {
          await connectionLoader({
            dmarcGuidanceTags,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to gather orgs in dmarcGuidanceTagConnectionsLoader, error: Error: Cursor Error Occurred.`,
        ])
      })
    })
  })
})
