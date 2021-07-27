import { stringify } from 'jest-matcher-utils'
import { ensure, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { cleanseInput } from '../../../validators'
import {
  loadAggregateGuidanceTagByTagId,
  loadAggregateGuidanceTagConnectionsByTagId,
} from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadAggregateGuidanceTagConnectionsByTagId loader', () => {
  let query, drop, truncate, collections, user, i18n

  const consoleOutput = []
  const mockedConsole = (output) => consoleOutput.push(output)

  beforeAll(() => {
    console.error = mockedConsole
    console.warn = mockedConsole
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
    consoleOutput.length = 0
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

        await collections.aggregateGuidanceTags.save({
          _key: 'agg1',
          en: {
            tagName: 'a',
            guidance: 'a',
          },
          fr: {
            tagName: 'a',
            guidance: 'a',
          },
        })
        await collections.aggregateGuidanceTags.save({
          _key: 'agg2',
          en: {
            tagName: 'b',
            guidance: 'b',
          },
          fr: {
            tagName: 'b',
            guidance: 'b',
          },
        })
        await collections.aggregateGuidanceTags.save({
          _key: 'agg3',
          en: {
            tagName: 'c',
            guidance: 'c',
          },
          fr: {
            tagName: 'c',
            guidance: 'c',
          },
        })
      })
      afterEach(async () => {
        await truncate()
      })
      afterAll(async () => {
        await drop()
      })
      describe('using after cursor', () => {
        it('returns the guidance tags', async () => {
          const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
            language: 'en',
          })

          const aggregateGuidanceTags = ['agg1', 'agg2']

          const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
            query,
            i18n,
            language: 'en',
          })
          const expectedAggregateTags = await aggregateTagLoader.loadMany(
            aggregateGuidanceTags,
          )

          const connectionArgs = {
            first: 5,
            after: toGlobalId('guidanceTag', expectedAggregateTags[0]._key),
          }

          const aggregateTags = await connectionLoader({
            aggregateGuidanceTags,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId(
                  'guidanceTag',
                  expectedAggregateTags[1]._key,
                ),
                node: {
                  ...expectedAggregateTags[1],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId(
                'guidanceTag',
                expectedAggregateTags[1]._key,
              ),
              endCursor: toGlobalId(
                'guidanceTag',
                expectedAggregateTags[1]._key,
              ),
            },
          }

          expect(aggregateTags).toEqual(expectedStructure)
        })
      })
      describe('using before cursor', () => {
        it('returns the guidance tags', async () => {
          const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
            language: 'en',
          })

          const aggregateGuidanceTags = ['agg1', 'agg2']

          const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
            query,
            language: 'en',
          })
          const expectedAggregateTags = await aggregateTagLoader.loadMany(
            aggregateGuidanceTags,
          )

          const connectionArgs = {
            first: 5,
            before: toGlobalId('guidanceTag', expectedAggregateTags[1]._key),
          }

          const aggregateTags = await connectionLoader({
            aggregateGuidanceTags,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId(
                  'guidanceTag',
                  expectedAggregateTags[0]._key,
                ),
                node: {
                  ...expectedAggregateTags[0],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: toGlobalId(
                'guidanceTag',
                expectedAggregateTags[0]._key,
              ),
              endCursor: toGlobalId(
                'guidanceTag',
                expectedAggregateTags[0]._key,
              ),
            },
          }

          expect(aggregateTags).toEqual(expectedStructure)
        })
      })
      describe('using the first limit', () => {
        it('returns the guidance tags', async () => {
          const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
            language: 'en',
          })

          const aggregateGuidanceTags = ['agg1', 'agg2']

          const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
            query,
            language: 'en',
          })
          const expectedAggregateTags = await aggregateTagLoader.loadMany(
            aggregateGuidanceTags,
          )

          const connectionArgs = {
            first: 1,
          }

          const aggregateTags = await connectionLoader({
            aggregateGuidanceTags,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId(
                  'guidanceTag',
                  expectedAggregateTags[0]._key,
                ),
                node: {
                  ...expectedAggregateTags[0],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: toGlobalId(
                'guidanceTag',
                expectedAggregateTags[0]._key,
              ),
              endCursor: toGlobalId(
                'guidanceTag',
                expectedAggregateTags[0]._key,
              ),
            },
          }

          expect(aggregateTags).toEqual(expectedStructure)
        })
      })
      describe('using the last limit', () => {
        it('returns the guidance tags', async () => {
          const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
            language: 'en',
          })

          const aggregateGuidanceTags = ['agg1', 'agg2']

          const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
            query,
            language: 'en',
          })
          const expectedAggregateTags = await aggregateTagLoader.loadMany(
            aggregateGuidanceTags,
          )

          const connectionArgs = {
            last: 1,
          }

          const aggregateTags = await connectionLoader({
            aggregateGuidanceTags,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId(
                  'guidanceTag',
                  expectedAggregateTags[1]._key,
                ),
                node: {
                  ...expectedAggregateTags[1],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId(
                'guidanceTag',
                expectedAggregateTags[1]._key,
              ),
              endCursor: toGlobalId(
                'guidanceTag',
                expectedAggregateTags[1]._key,
              ),
            },
          }

          expect(aggregateTags).toEqual(expectedStructure)
        })
      })
      describe('using the orderBy field', () => {
        describe('ordering on TAG_ID', () => {
          describe('order is set to ASC', () => {
            it('returns the guidance tags', async () => {
              const connectionLoader =
                loadAggregateGuidanceTagConnectionsByTagId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  language: 'en',
                })

              const aggregateGuidanceTags = ['agg1', 'agg2', 'agg3']

              const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
                query,
                language: 'en',
              })
              const expectedAggregateTags = await aggregateTagLoader.loadMany(
                aggregateGuidanceTags,
              )

              const connectionArgs = {
                aggregateGuidanceTags,
                first: 1,
                after: toGlobalId('guidanceTag', 'agg1'),
                before: toGlobalId('guidanceTag', 'agg3'),
                orderBy: {
                  field: 'tag-id',
                  direction: 'ASC',
                },
              }

              const aggregateTags = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'guidanceTag',
                      expectedAggregateTags[1]._key,
                    ),
                    node: {
                      ...expectedAggregateTags[1],
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                  endCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                },
              }

              expect(aggregateTags).toEqual(expectedStructure)
            })
          })
          describe('order is set to DESC', () => {
            it('returns the guidance tags', async () => {
              const connectionLoader =
                loadAggregateGuidanceTagConnectionsByTagId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  language: 'en',
                })

              const aggregateGuidanceTags = ['agg1', 'agg2', 'agg3']

              const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
                query,
                language: 'en',
              })
              const expectedAggregateTags = await aggregateTagLoader.loadMany(
                aggregateGuidanceTags,
              )

              const connectionArgs = {
                aggregateGuidanceTags,
                first: 1,
                after: toGlobalId('guidanceTag', 'agg3'),
                before: toGlobalId('guidanceTag', 'agg1'),
                orderBy: {
                  field: 'tag-id',
                  direction: 'DESC',
                },
              }

              const aggregateTags = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'guidanceTag',
                      expectedAggregateTags[1]._key,
                    ),
                    node: {
                      ...expectedAggregateTags[1],
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                  endCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                },
              }

              expect(aggregateTags).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering on TAG_NAME', () => {
          describe('order is set to ASC', () => {
            it('returns the guidance tags', async () => {
              const connectionLoader =
                loadAggregateGuidanceTagConnectionsByTagId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  language: 'en',
                })

              const aggregateGuidanceTags = ['agg1', 'agg2', 'agg3']

              const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
                query,
                language: 'en',
              })
              const expectedAggregateTags = await aggregateTagLoader.loadMany(
                aggregateGuidanceTags,
              )

              const connectionArgs = {
                aggregateGuidanceTags,
                first: 1,
                after: toGlobalId('guidanceTag', 'agg1'),
                before: toGlobalId('guidanceTag', 'agg3'),
                orderBy: {
                  field: 'tag-name',
                  direction: 'ASC',
                },
              }

              const aggregateTags = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'guidanceTag',
                      expectedAggregateTags[1]._key,
                    ),
                    node: {
                      ...expectedAggregateTags[1],
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                  endCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                },
              }

              expect(aggregateTags).toEqual(expectedStructure)
            })
          })
          describe('order is set to DESC', () => {
            it('returns the guidance tags', async () => {
              const connectionLoader =
                loadAggregateGuidanceTagConnectionsByTagId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  language: 'en',
                })

              const aggregateGuidanceTags = ['agg1', 'agg2', 'agg3']

              const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
                query,
                language: 'en',
              })
              const expectedAggregateTags = await aggregateTagLoader.loadMany(
                aggregateGuidanceTags,
              )

              const connectionArgs = {
                aggregateGuidanceTags,
                first: 1,
                after: toGlobalId('guidanceTag', 'agg3'),
                before: toGlobalId('guidanceTag', 'agg1'),
                orderBy: {
                  field: 'tag-name',
                  direction: 'DESC',
                },
              }

              const aggregateTags = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'guidanceTag',
                      expectedAggregateTags[1]._key,
                    ),
                    node: {
                      ...expectedAggregateTags[1],
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                  endCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                },
              }

              expect(aggregateTags).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering on GUIDANCE', () => {
          describe('order is set to ASC', () => {
            it('returns the guidance tags', async () => {
              const connectionLoader =
                loadAggregateGuidanceTagConnectionsByTagId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  language: 'en',
                })

              const aggregateGuidanceTags = ['agg1', 'agg2', 'agg3']

              const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
                query,
                language: 'en',
              })
              const expectedAggregateTags = await aggregateTagLoader.loadMany(
                aggregateGuidanceTags,
              )

              const connectionArgs = {
                aggregateGuidanceTags,
                first: 1,
                after: toGlobalId('guidanceTag', 'agg1'),
                before: toGlobalId('guidanceTag', 'agg3'),
                orderBy: {
                  field: 'guidance',
                  direction: 'ASC',
                },
              }

              const aggregateTags = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'guidanceTag',
                      expectedAggregateTags[1]._key,
                    ),
                    node: {
                      ...expectedAggregateTags[1],
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                  endCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                },
              }

              expect(aggregateTags).toEqual(expectedStructure)
            })
          })
          describe('order is set to DESC', () => {
            it('returns the guidance tags', async () => {
              const connectionLoader =
                loadAggregateGuidanceTagConnectionsByTagId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  language: 'en',
                })

              const aggregateGuidanceTags = ['agg1', 'agg2', 'agg3']

              const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
                query,
                language: 'en',
              })
              const expectedAggregateTags = await aggregateTagLoader.loadMany(
                aggregateGuidanceTags,
              )

              const connectionArgs = {
                aggregateGuidanceTags,
                first: 1,
                after: toGlobalId('guidanceTag', 'agg3'),
                before: toGlobalId('guidanceTag', 'agg1'),
                orderBy: {
                  field: 'guidance',
                  direction: 'DESC',
                },
              }

              const aggregateTags = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'guidanceTag',
                      expectedAggregateTags[1]._key,
                    ),
                    node: {
                      ...expectedAggregateTags[1],
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                  endCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                },
              }

              expect(aggregateTags).toEqual(expectedStructure)
            })
          })
        })
      })
      describe('no tags are found', () => {
        beforeEach(async () => {
          await truncate()
        })
        it('returns an empty structure', async () => {
          const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
            language: 'en',
          })

          const aggregateGuidanceTags = ['agg1', 'agg2']

          const connectionArgs = {
            first: 5,
          }

          const aggregateTags = await connectionLoader({
            aggregateGuidanceTags,
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

          expect(aggregateTags).toEqual(expectedStructure)
        })
      })
    })
    describe('given an unsuccessful load', () => {
      describe('both limits are not set', () => {
        it('throws an error', async () => {
          const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const aggregateGuidanceTags = ['agg1', 'agg2']

          const connectionArgs = {}

          try {
            await connectionLoader({
              aggregateGuidanceTags,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'You must provide a `first` or `last` value to properly paginate the `GuidanceTag` connection.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadAggregateGuidanceTagConnectionsByTagId.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('throws an error', async () => {
          const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const aggregateGuidanceTags = ['agg1', 'agg2']

          const connectionArgs = {
            first: 5,
            last: 5,
          }

          try {
            await connectionLoader({
              aggregateGuidanceTags,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Passing both `first` and `last` to paginate the `GuidanceTag` connection is not supported.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadAggregateGuidanceTagConnectionsByTagId.`,
          ])
        })
      })
      describe('limits are below minimum', () => {
        describe('first is set', () => {
          it('throws an error', async () => {
            const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId(
              {
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              },
            )

            const aggregateGuidanceTags = ['agg1', 'agg2']

            const connectionArgs = {
              first: -5,
            }

            try {
              await connectionLoader({
                aggregateGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`first` on the `GuidanceTag` connection cannot be less than zero.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadAggregateGuidanceTagConnectionsByTagId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('throws an error', async () => {
            const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId(
              {
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              },
            )

            const aggregateGuidanceTags = ['agg1', 'agg2']

            const connectionArgs = {
              last: -5,
            }

            try {
              await connectionLoader({
                aggregateGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`last` on the `GuidanceTag` connection cannot be less than zero.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadAggregateGuidanceTagConnectionsByTagId.`,
            ])
          })
        })
      })
      describe('limits are above minimum', () => {
        describe('first is set', () => {
          it('throws an error', async () => {
            const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId(
              {
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              },
            )

            const aggregateGuidanceTags = ['agg1', 'agg2']

            const connectionArgs = {
              first: 500,
            }

            try {
              await connectionLoader({
                aggregateGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting `500` records on the `GuidanceTag` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 500 for: loadAggregateGuidanceTagConnectionsByTagId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('throws an error', async () => {
            const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId(
              {
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              },
            )

            const aggregateGuidanceTags = ['agg1', 'agg2']

            const connectionArgs = {
              last: 500,
            }

            try {
              await connectionLoader({
                aggregateGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting `500` records on the `GuidanceTag` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: loadAggregateGuidanceTagConnectionsByTagId.`,
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
              const connectionLoader =
                loadAggregateGuidanceTagConnectionsByTagId({
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
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadAggregateGuidanceTagConnectionsByTagId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader =
                loadAggregateGuidanceTagConnectionsByTagId({
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
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadAggregateGuidanceTagConnectionsByTagId.`,
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

        const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId({
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
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Unable to load Aggregate guidance tag(s). Please try again.',
            ),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to gather tags in loadAggregateGuidanceTagConnectionsByTagId, error: Error: Database Error Occurred.`,
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

        const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId({
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
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Unable to load Aggregate guidance tag(s). Please try again.',
            ),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to gather tags in loadAggregateGuidanceTagConnectionsByTagId, error: Error: Cursor Error Occurred.`,
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
  
        await collections.aggregateGuidanceTags.save({
          _key: 'agg1',
          en: {
            tagName: 'a',
            guidance: 'a',
          },
          fr: {
            tagName: 'a',
            guidance: 'a',
          },
        })
        await collections.aggregateGuidanceTags.save({
          _key: 'agg2',
          en: {
            tagName: 'b',
            guidance: 'b',
          },
          fr: {
            tagName: 'b',
            guidance: 'b',
          },
        })
        await collections.aggregateGuidanceTags.save({
          _key: 'agg3',
          en: {
            tagName: 'c',
            guidance: 'c',
          },
          fr: {
            tagName: 'c',
            guidance: 'c',
          },
        })
      })
      afterEach(async () => {
        await truncate()
      })
      afterAll(async () => {
        await drop()
      })
      describe('using after cursor', () => {
        it('returns the guidance tags', async () => {
          const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
            language: 'fr',
          })
  
          const aggregateGuidanceTags = ['agg1', 'agg2']
  
          const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
            query,
            i18n,
            language: 'fr',
          })
          const expectedAggregateTags = await aggregateTagLoader.loadMany(
            aggregateGuidanceTags,
          )
  
          
          const connectionArgs = {
            first: 5,
            after: toGlobalId('guidanceTag', expectedAggregateTags[0]._key),
          }
          
          const aggregateTags = await connectionLoader({
            aggregateGuidanceTags,
            ...connectionArgs,
          })
  
          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('guidanceTag', expectedAggregateTags[1]._key),
                node: {
                  ...expectedAggregateTags[1],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId(
                'guidanceTag',
                expectedAggregateTags[1]._key,
              ),
              endCursor: toGlobalId('guidanceTag', expectedAggregateTags[1]._key),
            },
          }
  
          expect(aggregateTags).toEqual(expectedStructure)
        })
      })
      describe('using before cursor', () => {
        it('returns the guidance tags', async () => {
          const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
            language: 'fr',
          })
  
          const aggregateGuidanceTags = ['agg1', 'agg2']
  
          const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
            query,
            language: 'fr',
          })
          const expectedAggregateTags = await aggregateTagLoader.loadMany(
            aggregateGuidanceTags,
          )
  
          const connectionArgs = {
            first: 5,
            before: toGlobalId('guidanceTag', expectedAggregateTags[1]._key),
          }
  
          const aggregateTags = await connectionLoader({
            aggregateGuidanceTags,
            ...connectionArgs,
          })
  
          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('guidanceTag', expectedAggregateTags[0]._key),
                node: {
                  ...expectedAggregateTags[0],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: toGlobalId(
                'guidanceTag',
                expectedAggregateTags[0]._key,
              ),
              endCursor: toGlobalId('guidanceTag', expectedAggregateTags[0]._key),
            },
          }
  
          expect(aggregateTags).toEqual(expectedStructure)
        })
      })
      describe('using the first limit', () => {
        it('returns the guidance tags', async () => {
          const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
            language: 'fr',
          })
  
          const aggregateGuidanceTags = ['agg1', 'agg2']
  
          const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
            query,
            language: 'fr',
          })
          const expectedAggregateTags = await aggregateTagLoader.loadMany(
            aggregateGuidanceTags,
          )
  
          const connectionArgs = {
            first: 1,
          }
  
          const aggregateTags = await connectionLoader({
            aggregateGuidanceTags,
            ...connectionArgs,
          })
  
          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('guidanceTag', expectedAggregateTags[0]._key),
                node: {
                  ...expectedAggregateTags[0],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: toGlobalId(
                'guidanceTag',
                expectedAggregateTags[0]._key,
              ),
              endCursor: toGlobalId('guidanceTag', expectedAggregateTags[0]._key),
            },
          }
  
          expect(aggregateTags).toEqual(expectedStructure)
        })
      })
      describe('using the last limit', () => {
        it('returns the guidance tags', async () => {
          const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
            language: 'fr',
          })
  
          const aggregateGuidanceTags = ['agg1', 'agg2']
  
          const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
            query,
            language: 'fr',
          })
          const expectedAggregateTags = await aggregateTagLoader.loadMany(
            aggregateGuidanceTags,
          )
  
          const connectionArgs = {
            last: 1,
          }
  
          const aggregateTags = await connectionLoader({
            aggregateGuidanceTags,
            ...connectionArgs,
          })
  
          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('guidanceTag', expectedAggregateTags[1]._key),
                node: {
                  ...expectedAggregateTags[1],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId(
                'guidanceTag',
                expectedAggregateTags[1]._key,
              ),
              endCursor: toGlobalId('guidanceTag', expectedAggregateTags[1]._key),
            },
          }
  
          expect(aggregateTags).toEqual(expectedStructure)
        })
      })
      describe('using the orderBy field', () => {
        describe('ordering on TAG_ID', () => {
          describe('order is set to ASC', () => {
            it('returns the guidance tags', async () => {
              const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId(
                {
                  query,
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  language: 'fr',
                },
              )
  
              const aggregateGuidanceTags = [
                'agg1',
                'agg2',
                'agg3',
              ]
  
              const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
                query,
                language: 'fr',
              })
              const expectedAggregateTags = await aggregateTagLoader.loadMany(
                aggregateGuidanceTags,
              )
  
              const connectionArgs = {
                aggregateGuidanceTags,
                first: 1,
                after: toGlobalId('guidanceTag', 'agg1'),
                before: toGlobalId('guidanceTag', 'agg3'),
                orderBy: {
                  field: 'tag-id',
                  direction: 'ASC',
                },
              }
  
              const aggregateTags = await connectionLoader({
                ...connectionArgs,
              })
  
              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'guidanceTag',
                      expectedAggregateTags[1]._key,
                    ),
                    node: {
                      ...expectedAggregateTags[1],
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                  endCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                },
              }
  
              expect(aggregateTags).toEqual(expectedStructure)
            })
          })
          describe('order is set to DESC', () => {
            it('returns the guidance tags', async () => {
              const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId(
                {
                  query,
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  language: 'fr',
                },
              )
  
              const aggregateGuidanceTags = [
                'agg1',
                'agg2',
                'agg3',
              ]
  
              const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
                query,
                language: 'fr',
              })
              const expectedAggregateTags = await aggregateTagLoader.loadMany(
                aggregateGuidanceTags,
              )
  
              const connectionArgs = {
                aggregateGuidanceTags,
                first: 1,
                after: toGlobalId('guidanceTag', 'agg3'),
                before: toGlobalId('guidanceTag', 'agg1'),
                orderBy: {
                  field: 'tag-id',
                  direction: 'DESC',
                },
              }
  
              const aggregateTags = await connectionLoader({
                ...connectionArgs,
              })
  
              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'guidanceTag',
                      expectedAggregateTags[1]._key,
                    ),
                    node: {
                      ...expectedAggregateTags[1],
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                  endCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                },
              }
  
              expect(aggregateTags).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering on TAG_NAME', () => {
          describe('order is set to ASC', () => {
            it('returns the guidance tags', async () => {
              const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId(
                {
                  query,
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  language: 'fr',
                },
              )
  
              const aggregateGuidanceTags = [
                'agg1',
                'agg2',
                'agg3',
              ]
  
              const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
                query,
                language: 'fr',
              })
              const expectedAggregateTags = await aggregateTagLoader.loadMany(
                aggregateGuidanceTags,
              )
  
              const connectionArgs = {
                aggregateGuidanceTags,
                first: 1,
                after: toGlobalId('guidanceTag', 'agg1'),
                before: toGlobalId('guidanceTag', 'agg3'),
                orderBy: {
                  field: 'tag-name',
                  direction: 'ASC',
                },
              }
  
              const aggregateTags = await connectionLoader({
                ...connectionArgs,
              })
  
              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'guidanceTag',
                      expectedAggregateTags[1]._key,
                    ),
                    node: {
                      ...expectedAggregateTags[1],
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                  endCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                },
              }
  
              expect(aggregateTags).toEqual(expectedStructure)
            })
          })
          describe('order is set to DESC', () => {
            it('returns the guidance tags', async () => {
              const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId(
                {
                  query,
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  language: 'fr',
                },
              )
  
              const aggregateGuidanceTags = [
                'agg1',
                'agg2',
                'agg3',
              ]
  
              const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
                query,
                language: 'fr',
              })
              const expectedAggregateTags = await aggregateTagLoader.loadMany(
                aggregateGuidanceTags,
              )
  
              const connectionArgs = {
                aggregateGuidanceTags,
                first: 1,
                after: toGlobalId('guidanceTag', 'agg3'),
                before: toGlobalId('guidanceTag', 'agg1'),
                orderBy: {
                  field: 'tag-name',
                  direction: 'DESC',
                },
              }
  
              const aggregateTags = await connectionLoader({
                ...connectionArgs,
              })
  
              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'guidanceTag',
                      expectedAggregateTags[1]._key,
                    ),
                    node: {
                      ...expectedAggregateTags[1],
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                  endCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                },
              }
  
              expect(aggregateTags).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering on GUIDANCE', () => {
          describe('order is set to ASC', () => {
            it('returns the guidance tags', async () => {
              const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId(
                {
                  query,
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  language: 'fr',
                },
              )
  
              const aggregateGuidanceTags = [
                'agg1',
                'agg2',
                'agg3',
              ]
  
              const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
                query,
                language: 'fr',
              })
              const expectedAggregateTags = await aggregateTagLoader.loadMany(
                aggregateGuidanceTags,
              )
  
              const connectionArgs = {
                aggregateGuidanceTags,
                first: 1,
                after: toGlobalId('guidanceTag', 'agg1'),
                before: toGlobalId('guidanceTag', 'agg3'),
                orderBy: {
                  field: 'guidance',
                  direction: 'ASC',
                },
              }
  
              const aggregateTags = await connectionLoader({
                ...connectionArgs,
              })
  
              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'guidanceTag',
                      expectedAggregateTags[1]._key,
                    ),
                    node: {
                      ...expectedAggregateTags[1],
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                  endCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                },
              }
  
              expect(aggregateTags).toEqual(expectedStructure)
            })
          })
          describe('order is set to DESC', () => {
            it('returns the guidance tags', async () => {
              const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId(
                {
                  query,
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  language: 'fr',
                },
              )
  
              const aggregateGuidanceTags = [
                'agg1',
                'agg2',
                'agg3',
              ]
  
              const aggregateTagLoader = loadAggregateGuidanceTagByTagId({
                query,
                language: 'fr',
              })
              const expectedAggregateTags = await aggregateTagLoader.loadMany(
                aggregateGuidanceTags,
              )
  
              const connectionArgs = {
                aggregateGuidanceTags,
                first: 1,
                after: toGlobalId('guidanceTag', 'agg3'),
                before: toGlobalId('guidanceTag', 'agg1'),
                orderBy: {
                  field: 'guidance',
                  direction: 'DESC',
                },
              }
  
              const aggregateTags = await connectionLoader({
                ...connectionArgs,
              })
  
              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'guidanceTag',
                      expectedAggregateTags[1]._key,
                    ),
                    node: {
                      ...expectedAggregateTags[1],
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                  endCursor: toGlobalId(
                    'guidanceTag',
                    expectedAggregateTags[1]._key,
                  ),
                },
              }
  
              expect(aggregateTags).toEqual(expectedStructure)
            })
          })
        })
      })
      describe('no tags are found', () => {
        beforeEach(async () => {
          await truncate()
        })
        it('returns an empty structure', async () => {
          const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
            language: 'fr',
          })
  
          const aggregateGuidanceTags = ['agg1', 'agg2']
  
          const connectionArgs = {
            first: 5,
          }
  
          const aggregateTags = await connectionLoader({
            aggregateGuidanceTags,
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
  
          expect(aggregateTags).toEqual(expectedStructure)
        })
      })
    })
    describe('given an unsuccessful load', () => {
      describe('both limits are not set', () => {
        it('throws an error', async () => {
          const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const aggregateGuidanceTags = ['agg1', 'agg2']

          const connectionArgs = {}

          try {
            await connectionLoader({
              aggregateGuidanceTags,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Vous devez fournir une valeur `first` ou `last` pour paginer correctement la connexion `GuidanceTag`.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadAggregateGuidanceTagConnectionsByTagId.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('throws an error', async () => {
          const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const aggregateGuidanceTags = ['agg1', 'agg2']

          const connectionArgs = {
            first: 5,
            last: 5,
          }

          try {
            await connectionLoader({
              aggregateGuidanceTags,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                "Passer à la fois `first` et `last` pour paginer la connexion `GuidanceTag` n'est pas supporté.",
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadAggregateGuidanceTagConnectionsByTagId.`,
          ])
        })
      })
      describe('limits are below minimum', () => {
        describe('first is set', () => {
          it('throws an error', async () => {
            const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId(
              {
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              },
            )

            const aggregateGuidanceTags = ['agg1', 'agg2']

            const connectionArgs = {
              first: -5,
            }

            try {
              await connectionLoader({
                aggregateGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`first` sur la connexion `GuidanceTag` ne peut être inférieure à zéro.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadAggregateGuidanceTagConnectionsByTagId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('throws an error', async () => {
            const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId(
              {
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              },
            )

            const aggregateGuidanceTags = ['agg1', 'agg2']

            const connectionArgs = {
              last: -5,
            }

            try {
              await connectionLoader({
                aggregateGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`last` sur la connexion `GuidanceTag` ne peut être inférieure à zéro.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadAggregateGuidanceTagConnectionsByTagId.`,
            ])
          })
        })
      })
      describe('limits are above minimum', () => {
        describe('first is set', () => {
          it('throws an error', async () => {
            const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId(
              {
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              },
            )

            const aggregateGuidanceTags = ['agg1', 'agg2']

            const connectionArgs = {
              first: 500,
            }

            try {
              await connectionLoader({
                aggregateGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  "La demande d'enregistrements `500` sur la connexion `GuidanceTag` dépasse la limite `first` de 100 enregistrements.",
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 500 for: loadAggregateGuidanceTagConnectionsByTagId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('throws an error', async () => {
            const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId(
              {
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              },
            )

            const aggregateGuidanceTags = ['agg1', 'agg2']

            const connectionArgs = {
              last: 500,
            }

            try {
              await connectionLoader({
                aggregateGuidanceTags,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  "La demande d'enregistrements `500` sur la connexion `GuidanceTag` dépasse la limite `last` de 100 enregistrements.",
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: loadAggregateGuidanceTagConnectionsByTagId.`,
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
              const connectionLoader =
                loadAggregateGuidanceTagConnectionsByTagId({
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
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadAggregateGuidanceTagConnectionsByTagId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader =
                loadAggregateGuidanceTagConnectionsByTagId({
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
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadAggregateGuidanceTagConnectionsByTagId.`,
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

        const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId({
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
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              "Impossible de charger le(s) tag(s) d'orientation des agrégats. Veuillez réessayer.",
            ),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to gather tags in loadAggregateGuidanceTagConnectionsByTagId, error: Error: Database Error Occurred.`,
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

        const connectionLoader = loadAggregateGuidanceTagConnectionsByTagId({
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
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              "Impossible de charger le(s) tag(s) d'orientation des agrégats. Veuillez réessayer.",
            ),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to gather tags in loadAggregateGuidanceTagConnectionsByTagId, error: Error: Cursor Error Occurred.`,
        ])
      })
    })
  })
})
