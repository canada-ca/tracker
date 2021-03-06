import { stringify } from 'jest-matcher-utils'
import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { cleanseInput } from '../../../validators'
import { orgLoaderConnectionsByUserId, orgLoaderByKey } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the load organization connections by user id function', () => {
  let query, drop, truncate, migrate, collections, user, orgOne, orgTwo, i18n

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
    orgOne = await collections.organizations.save({
      verified: false,
      summaries: {
        web: {
          pass: 50,
          fail: 1000,
          total: 1050,
        },
        mail: {
          pass: 50,
          fail: 1000,
          total: 1050,
        },
      },
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
    orgTwo = await collections.organizations.save({
      verified: false,
      summaries: {
        web: {
          pass: 50,
          fail: 1000,
          total: 1050,
        },
        mail: {
          pass: 50,
          fail: 1000,
          total: 1050,
        },
      },
      orgDetails: {
        en: {
          slug: 'not-treasury-board-secretariat',
          acronym: 'NTBS',
          name: 'Not Treasury Board of Canada Secretariat',
          zone: 'NFED',
          sector: 'NTBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'ne-pas-secretariat-conseil-tresor',
          acronym: 'NPSCT',
          name: 'Ne Pas Secrétariat du Conseil Trésor du Canada',
          zone: 'NPFED',
          sector: 'NPTBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
    })
    await collections.affiliations.save({
      _from: orgOne._id,
      _to: user._id,
      permission: 'user',
    })
    await collections.affiliations.save({
      _from: orgTwo._id,
      _to: user._id,
      permission: 'user',
    })

    consoleOutput.length = 0
  })

  afterAll(async () => {
    await drop()
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
    describe('given a successful load', () => {
      describe('given there are organization connections to be returned', () => {
        describe('using no cursor', () => {
          it('returns organizations', async () => {
            const connectionLoader = orgLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              'en',
              i18n,
            )

            const connectionArgs = {
              first: 5,
            }
            const orgs = await connectionLoader({ ...connectionArgs })

            const orgLoader = orgLoaderByKey(query, 'en')
            const expectedOrgs = await orgLoader.loadMany([
              orgOne._key,
              orgTwo._key,
            ])

            expectedOrgs[0].id = expectedOrgs[0]._key
            expectedOrgs[1].id = expectedOrgs[1]._key

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('organizations', expectedOrgs[0]._key),
                  node: {
                    ...expectedOrgs[0],
                  },
                },
                {
                  cursor: toGlobalId('organizations', expectedOrgs[1]._key),
                  node: {
                    ...expectedOrgs[1],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('organizations', expectedOrgs[0]._key),
                endCursor: toGlobalId('organizations', expectedOrgs[1]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('using after cursor', () => {
          it('returns an organization', async () => {
            const connectionLoader = orgLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              'en',
              i18n,
            )

            const orgLoader = orgLoaderByKey(query, 'en')
            const expectedOrgs = await orgLoader.loadMany([
              orgOne._key,
              orgTwo._key,
            ])

            expectedOrgs[0].id = expectedOrgs[0]._key
            expectedOrgs[1].id = expectedOrgs[1]._key

            const connectionArgs = {
              first: 5,
              after: toGlobalId('organizations', expectedOrgs[0].id),
            }
            const orgs = await connectionLoader({ ...connectionArgs })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('organizations', expectedOrgs[1]._key),
                  node: {
                    ...expectedOrgs[1],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: toGlobalId('organizations', expectedOrgs[1]._key),
                endCursor: toGlobalId('organizations', expectedOrgs[1]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('using before cursor', () => {
          it('returns an organization', async () => {
            const connectionLoader = orgLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              'en',
              i18n,
            )

            const orgLoader = orgLoaderByKey(query, 'en')
            const expectedOrgs = await orgLoader.loadMany([
              orgOne._key,
              orgTwo._key,
            ])

            expectedOrgs[0].id = expectedOrgs[0]._key
            expectedOrgs[1].id = expectedOrgs[1]._key

            const connectionArgs = {
              first: 5,
              before: toGlobalId('organizations', expectedOrgs[1].id),
            }
            const orgs = await connectionLoader({ ...connectionArgs })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('organizations', expectedOrgs[0]._key),
                  node: {
                    ...expectedOrgs[0],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false,
                startCursor: toGlobalId('organizations', expectedOrgs[0]._key),
                endCursor: toGlobalId('organizations', expectedOrgs[0]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('using first limit', () => {
          it('returns an organization', async () => {
            const connectionLoader = orgLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              'en',
              i18n,
            )

            const orgLoader = orgLoaderByKey(query, 'en')
            const expectedOrgs = await orgLoader.loadMany([
              orgOne._key,
              orgTwo._key,
            ])

            expectedOrgs[0].id = expectedOrgs[0]._key
            expectedOrgs[1].id = expectedOrgs[1]._key

            const connectionArgs = {
              first: 1,
            }
            const orgs = await connectionLoader({ ...connectionArgs })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('organizations', expectedOrgs[0]._key),
                  node: {
                    ...expectedOrgs[0],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false,
                startCursor: toGlobalId('organizations', expectedOrgs[0]._key),
                endCursor: toGlobalId('organizations', expectedOrgs[0]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('using last limit', () => {
          it('returns an organization', async () => {
            const connectionLoader = orgLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              'en',
              i18n,
            )

            const orgLoader = orgLoaderByKey(query, 'en')
            const expectedOrgs = await orgLoader.loadMany([
              orgOne._key,
              orgTwo._key,
            ])

            expectedOrgs[0].id = expectedOrgs[0]._key
            expectedOrgs[1].id = expectedOrgs[1]._key

            const connectionArgs = {
              last: 1,
            }
            const orgs = await connectionLoader({ ...connectionArgs })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('organizations', expectedOrgs[1]._key),
                  node: {
                    ...expectedOrgs[1],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: toGlobalId('organizations', expectedOrgs[1]._key),
                endCursor: toGlobalId('organizations', expectedOrgs[1]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
      })
      describe('given there are no domain connections to be returned', () => {
        it('returns no organization connections', async () => {
          await truncate()

          const connectionLoader = orgLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
            'en',
            i18n,
          )

          const connectionArgs = {
            first: 5,
          }
          const orgs = await connectionLoader({ ...connectionArgs })

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

          expect(orgs).toEqual(expectedStructure)
        })
      })
    })
    describe('given an unsuccessful load', () => {
      describe('limits are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = orgLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
            'en',
            i18n,
          )

          const connectionArgs = {}
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'You must provide a `first` or `last` value to properly paginate the `organization` connection.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: orgLoaderConnectionsByUserId.`,
          ])
        })
      })
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = orgLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
            'en',
            i18n,
          )

          const connectionArgs = {
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
                'Passing both `first` and `last` to paginate the `organization` connection is not supported.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: orgLoaderConnectionsByUserId.`,
          ])
        })
      })
      describe('limits are below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = orgLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              'en',
              i18n,
            )

            const connectionArgs = {
              first: -1,
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`first` on the `organization` connection cannot be less than zero.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: orgLoaderConnectionsByUserId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = orgLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              'en',
              i18n,
            )

            const connectionArgs = {
              last: -1,
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`last` on the `organization` connection cannot be less than zero.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: orgLoaderConnectionsByUserId.`,
            ])
          })
        })
      })
      describe('limits are above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = orgLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              'en',
              i18n,
            )

            const connectionArgs = {
              first: 101,
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting `101` records on the `organization` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` to 101 for: orgLoaderConnectionsByUserId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = orgLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              'en',
              i18n,
            )

            const connectionArgs = {
              last: 101,
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting `101` records on the `organization` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` to 101 for: orgLoaderConnectionsByUserId.`,
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
              const connectionLoader = orgLoaderConnectionsByUserId(
                query,
                user._key,
                cleanseInput,
                'en',
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
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: orgLoaderConnectionsByUserId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = orgLoaderConnectionsByUserId(
                query,
                user._key,
                cleanseInput,
                'en',
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
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: orgLoaderConnectionsByUserId.`,
              ])
            })
          })
        })
      })
    })
    describe('given a database error', () => {
      describe('while querying domains', () => {
        it('returns an error message', async () => {
          const query = jest
            .fn()
            .mockRejectedValue(
              new Error('Unable to query organizations. Please try again.'),
            )

          const connectionLoader = orgLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
            'en',
            i18n,
          )

          const connectionArgs = {
            first: 5,
          }
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to query organizations. Please try again.'),
            )
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to query organizations in orgLoaderConnectionsByUserId, error: Error: Unable to query organizations. Please try again.`,
          ])
        })
      })
    })
    describe('given a cursor error', () => {
      describe('while gathering domains', () => {
        it('returns an error message', async () => {
          const cursor = {
            next() {
              throw new Error('Unable to load organizations. Please try again.')
            },
          }
          const query = jest.fn().mockReturnValueOnce(cursor)

          const connectionLoader = orgLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
            'en',
            i18n,
          )

          const connectionArgs = {
            first: 5,
          }
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to load organizations. Please try again.'),
            )
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user: ${user._key} was trying to gather organizations in orgLoaderConnectionsByUserId, error: Error: Unable to load organizations. Please try again.`,
          ])
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
    describe('given a successful load', () => {
      describe('given there are organization connections to be returned', () => {
        describe('using no cursor', () => {
          it('returns organizations', async () => {
            const connectionLoader = orgLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              'fr',
              i18n,
            )

            const connectionArgs = {
              first: 5,
            }
            const orgs = await connectionLoader({ ...connectionArgs })

            const orgLoader = orgLoaderByKey(query, 'fr')
            const expectedOrgs = await orgLoader.loadMany([
              orgOne._key,
              orgTwo._key,
            ])

            expectedOrgs[0].id = expectedOrgs[0]._key
            expectedOrgs[1].id = expectedOrgs[1]._key

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('organizations', expectedOrgs[0]._key),
                  node: {
                    ...expectedOrgs[0],
                  },
                },
                {
                  cursor: toGlobalId('organizations', expectedOrgs[1]._key),
                  node: {
                    ...expectedOrgs[1],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('organizations', expectedOrgs[0]._key),
                endCursor: toGlobalId('organizations', expectedOrgs[1]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('using after cursor', () => {
          it('returns an organization', async () => {
            const connectionLoader = orgLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              'fr',
              i18n,
            )

            const orgLoader = orgLoaderByKey(query, 'fr')
            const expectedOrgs = await orgLoader.loadMany([
              orgOne._key,
              orgTwo._key,
            ])

            expectedOrgs[0].id = expectedOrgs[0]._key
            expectedOrgs[1].id = expectedOrgs[1]._key

            const connectionArgs = {
              first: 5,
              after: toGlobalId('organizations', expectedOrgs[0].id),
            }
            const orgs = await connectionLoader({ ...connectionArgs })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('organizations', expectedOrgs[1]._key),
                  node: {
                    ...expectedOrgs[1],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: toGlobalId('organizations', expectedOrgs[1]._key),
                endCursor: toGlobalId('organizations', expectedOrgs[1]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('using before cursor', () => {
          it('returns an organization', async () => {
            const connectionLoader = orgLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              'fr',
              i18n,
            )

            const orgLoader = orgLoaderByKey(query, 'fr')
            const expectedOrgs = await orgLoader.loadMany([
              orgOne._key,
              orgTwo._key,
            ])

            expectedOrgs[0].id = expectedOrgs[0]._key
            expectedOrgs[1].id = expectedOrgs[1]._key

            const connectionArgs = {
              first: 5,
              before: toGlobalId('organizations', expectedOrgs[1].id),
            }
            const orgs = await connectionLoader({ ...connectionArgs })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('organizations', expectedOrgs[0]._key),
                  node: {
                    ...expectedOrgs[0],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false,
                startCursor: toGlobalId('organizations', expectedOrgs[0]._key),
                endCursor: toGlobalId('organizations', expectedOrgs[0]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('using first limit', () => {
          it('returns an organization', async () => {
            const connectionLoader = orgLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              'fr',
              i18n,
            )

            const orgLoader = orgLoaderByKey(query, 'fr')
            const expectedOrgs = await orgLoader.loadMany([
              orgOne._key,
              orgTwo._key,
            ])

            expectedOrgs[0].id = expectedOrgs[0]._key
            expectedOrgs[1].id = expectedOrgs[1]._key

            const connectionArgs = {
              first: 1,
            }
            const orgs = await connectionLoader({ ...connectionArgs })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('organizations', expectedOrgs[0]._key),
                  node: {
                    ...expectedOrgs[0],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false,
                startCursor: toGlobalId('organizations', expectedOrgs[0]._key),
                endCursor: toGlobalId('organizations', expectedOrgs[0]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('using last limit', () => {
          it('returns an organization', async () => {
            const connectionLoader = orgLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              'fr',
              i18n,
            )

            const orgLoader = orgLoaderByKey(query, 'fr')
            const expectedOrgs = await orgLoader.loadMany([
              orgOne._key,
              orgTwo._key,
            ])

            expectedOrgs[0].id = expectedOrgs[0]._key
            expectedOrgs[1].id = expectedOrgs[1]._key

            const connectionArgs = {
              last: 1,
            }
            const orgs = await connectionLoader({ ...connectionArgs })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('organizations', expectedOrgs[1]._key),
                  node: {
                    ...expectedOrgs[1],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: toGlobalId('organizations', expectedOrgs[1]._key),
                endCursor: toGlobalId('organizations', expectedOrgs[1]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
      })
      describe('given there are no domain connections to be returned', () => {
        it('returns no organization connections', async () => {
          await truncate()

          const connectionLoader = orgLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
            'fr',
            i18n,
          )

          const connectionArgs = {
            first: 5,
          }
          const orgs = await connectionLoader({ ...connectionArgs })

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

          expect(orgs).toEqual(expectedStructure)
        })
      })
    })
    describe('given an unsuccessful load', () => {
      describe('limits are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = orgLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
            'fr',
            i18n,
          )

          const connectionArgs = {}
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: orgLoaderConnectionsByUserId.`,
          ])
        })
      })
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = orgLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
            'fr',
            i18n,
          )

          const connectionArgs = {
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
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: orgLoaderConnectionsByUserId.`,
          ])
        })
      })
      describe('limits are below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = orgLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              'fr',
              i18n,
            )

            const connectionArgs = {
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
              `User: ${user._key} attempted to have \`first\` set below zero for: orgLoaderConnectionsByUserId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = orgLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              'fr',
              i18n,
            )

            const connectionArgs = {
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
              `User: ${user._key} attempted to have \`last\` set below zero for: orgLoaderConnectionsByUserId.`,
            ])
          })
        })
      })
      describe('limits are above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = orgLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              'fr',
              i18n,
            )

            const connectionArgs = {
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
              `User: ${user._key} attempted to have \`first\` to 101 for: orgLoaderConnectionsByUserId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = orgLoaderConnectionsByUserId(
              query,
              user._key,
              cleanseInput,
              'fr',
              i18n,
            )

            const connectionArgs = {
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
              `User: ${user._key} attempted to have \`last\` to 101 for: orgLoaderConnectionsByUserId.`,
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
              const connectionLoader = orgLoaderConnectionsByUserId(
                query,
                user._key,
                cleanseInput,
                'fr',
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
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: orgLoaderConnectionsByUserId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = orgLoaderConnectionsByUserId(
                query,
                user._key,
                cleanseInput,
                'fr',
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
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: orgLoaderConnectionsByUserId.`,
              ])
            })
          })
        })
      })
    })
    describe('given a database error', () => {
      describe('while querying domains', () => {
        it('returns an error message', async () => {
          const query = jest
            .fn()
            .mockRejectedValue(
              new Error('Unable to query organizations. Please try again.'),
            )

          const connectionLoader = orgLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
            'fr',
            i18n,
          )

          const connectionArgs = {
            first: 5,
          }
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to query organizations in orgLoaderConnectionsByUserId, error: Error: Unable to query organizations. Please try again.`,
          ])
        })
      })
    })
    describe('given a cursor error', () => {
      describe('while gathering domains', () => {
        it('returns an error message', async () => {
          const cursor = {
            next() {
              throw new Error('Unable to load organizations. Please try again.')
            },
          }
          const query = jest.fn().mockReturnValueOnce(cursor)

          const connectionLoader = orgLoaderConnectionsByUserId(
            query,
            user._key,
            cleanseInput,
            'fr',
            i18n,
          )

          const connectionArgs = {
            first: 5,
          }
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user: ${user._key} was trying to gather organizations in orgLoaderConnectionsByUserId, error: Error: Unable to load organizations. Please try again.`,
          ])
        })
      })
    })
  })
})
