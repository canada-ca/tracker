const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { toGlobalId } = require('graphql-relay')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../locale/en/messages')
const frenchMessages = require('../locale/fr/messages')
const { makeMigrations } = require('../../migrations')
const { cleanseInput } = require('../validators')
const { affiliationLoaderByUserId, affiliationLoaderByKey } = require('../loaders')

describe('given the load user affiliations by user id function', () => {
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

    consoleOutput.length = 0
  })

  afterAll(async () => {
    await drop()
  })

  describe('users language is set to english', () => {
    beforeAll(() => {
      i18n = setupI18n({
        language: 'en',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
        },
      })
    })
    describe('given a successful load', () => {
      describe('given there are user affiliations to be returned', () => {
        let affOne, affTwo
        beforeEach(async () => {
          affOne = await collections.affiliations.save({
            _from: orgOne._id,
            _to: user._id,
            permission: 'user',
          })
          affTwo = await collections.affiliations.save({
            _from: orgTwo._id,
            _to: user._id,
            permission: 'user',
          })
        })
        afterEach(async () => {
          await query`
            LET userEdges = (FOR v, e IN 1..1 ANY ${orgOne._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
            LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
            RETURN true
          `
          await query`
            LET userEdges = (FOR v, e IN 1..1 ANY ${orgTwo._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
            LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
            RETURN true
          `
          await query`
            FOR affiliation IN affiliations
              REMOVE affiliation IN affiliations
          `
        })
        describe('using no cursor and no limit', () => {
          it('returns affiliations', async () => {
            const affiliationLoader = affiliationLoaderByUserId(
              query,
              user._key,
              cleanseInput,
              'en',
              i18n,
            )

            const connectionArgs = {}
            const affiliations = await affiliationLoader({ ...connectionArgs })

            const affLoader = affiliationLoaderByKey(query)
            const expectedAffiliations = await affLoader.loadMany([
              affOne._key,
              affTwo._key,
            ])

            expectedAffiliations[0].id = expectedAffiliations[0]._key
            expectedAffiliations[1].id = expectedAffiliations[1]._key

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('affiliations', expectedAffiliations[0]._key),
                  node: {
                    ...expectedAffiliations[0],
                  },
                },
                {
                  cursor: toGlobalId('affiliations', expectedAffiliations[1]._key),
                  node: {
                    ...expectedAffiliations[1],
                  },
                },
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('affiliations', expectedAffiliations[0]._key),
                endCursor: toGlobalId('affiliations', expectedAffiliations[1]._key),
              },
            }

            expect(affiliations).toEqual(expectedStructure)
          })
        })
        describe('using after cursor', () => {
          it('returns an affiliation', async () => {
            const affiliationLoader = affiliationLoaderByUserId(
              query,
              user._key,
              cleanseInput,
              'en',
              i18n,
            )

            const affLoader = affiliationLoaderByKey(query)
            const expectedAffiliations = await affLoader.loadMany([
              affOne._key,
              affTwo._key,
            ])

            expectedAffiliations[0].id = expectedAffiliations[0]._key
            expectedAffiliations[1].id = expectedAffiliations[1]._key

            const connectionArgs = {
              after: toGlobalId('affiliations', expectedAffiliations[0].id),
            }
            const affiliations = await affiliationLoader({ ...connectionArgs })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('affiliations', expectedAffiliations[1]._key),
                  node: {
                    ...expectedAffiliations[1],
                  },
                },
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('affiliations', expectedAffiliations[1]._key),
                endCursor: toGlobalId('affiliations', expectedAffiliations[1]._key),
              },
            }

            expect(affiliations).toEqual(expectedStructure)
          })
        })
        describe('using before cursor', () => {
          it('returns an affiliation', async () => {
            const affiliationLoader = affiliationLoaderByUserId(
              query,
              user._key,
              cleanseInput,
              'en',
              i18n,
            )

            const affLoader = affiliationLoaderByKey(query)
            const expectedAffiliations = await affLoader.loadMany([
              affOne._key,
              affTwo._key,
            ])

            expectedAffiliations[0].id = expectedAffiliations[0]._key
            expectedAffiliations[1].id = expectedAffiliations[1]._key

            const connectionArgs = {
              before: toGlobalId('affiliations', expectedAffiliations[1].id),
            }
            const affiliations = await affiliationLoader({ ...connectionArgs })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('affiliations', expectedAffiliations[0]._key),
                  node: {
                    ...expectedAffiliations[0],
                  },
                },
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('affiliations', expectedAffiliations[0]._key),
                endCursor: toGlobalId('affiliations', expectedAffiliations[0]._key),
              },
            }

            expect(affiliations).toEqual(expectedStructure)
          })
        })
        describe('using first limit', () => {
          it('returns an affiliation', async () => {
            const affiliationLoader = affiliationLoaderByUserId(
              query,
              user._key,
              cleanseInput,
              'en',
              i18n,
            )

            const affLoader = affiliationLoaderByKey(query)
            const expectedAffiliations = await affLoader.loadMany([
              affOne._key,
              affTwo._key,
            ])

            expectedAffiliations[0].id = expectedAffiliations[0]._key
            expectedAffiliations[1].id = expectedAffiliations[1]._key

            const connectionArgs = {
              first: 1,
            }
            const affiliations = await affiliationLoader({ ...connectionArgs })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('affiliations', expectedAffiliations[0]._key),
                  node: {
                    ...expectedAffiliations[0],
                  },
                },
              ],
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false,
                startCursor: toGlobalId('affiliations', expectedAffiliations[0]._key),
                endCursor: toGlobalId('affiliations', expectedAffiliations[0]._key),
              },
            }

            expect(affiliations).toEqual(expectedStructure)
          })
        })
        describe('using last limit', () => {
          it('returns an affiliation', async () => {
            const affiliationLoader = affiliationLoaderByUserId(
              query,
              user._key,
              cleanseInput,
              'en',
              i18n,
            )

            const affLoader = affiliationLoaderByKey(query)
            const expectedAffiliations = await affLoader.loadMany([
              affOne._key,
              affTwo._key,
            ])

            expectedAffiliations[0].id = expectedAffiliations[0]._key
            expectedAffiliations[1].id = expectedAffiliations[1]._key

            const connectionArgs = {
              last: 1,
            }
            const affiliations = await affiliationLoader({ ...connectionArgs })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('affiliations', expectedAffiliations[1]._key),
                  node: {
                    ...expectedAffiliations[1],
                  },
                },
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: toGlobalId('affiliations', expectedAffiliations[1]._key),
                endCursor: toGlobalId('affiliations', expectedAffiliations[1]._key),
              },
            }

            expect(affiliations).toEqual(expectedStructure)
          })
        })
      })
      describe('given there are no user affiliations to be returned', () => {
        it('returns no affiliations', async () => {
          const affiliationLoader = affiliationLoaderByUserId(
            query,
            user._key,
            cleanseInput,
            'en',
            i18n,
          )

          const connectionArgs = {}
          const affiliations = await affiliationLoader({ ...connectionArgs })

          const expectedStructure = {
            edges: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: '',
              endCursor: '',
            },
          }

          expect(affiliations).toEqual(expectedStructure)
        })
      })
    })
    describe('given an unsuccessful load', () => {
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const affiliationLoader = affiliationLoaderByUserId(
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
            await affiliationLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Error, unable to have first, and last set at the same time.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} tried to have first and last set in user affiliation query`,
          ])
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

          const affiliationLoader = affiliationLoaderByUserId(
            query,
            user._key,
            cleanseInput,
            'en',
            i18n,
          )

          const connectionArgs = {}
          try {
            await affiliationLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to query affiliations. Please try again.'),
            )
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to query affiliations in affiliationLoaderByUserId.`,
          ])
        })
      })
    })
    describe('given a cursor error', () => {
      describe('while gathering domains', () => {
        it('returns an error message', async () => {
          const cursor = {
            next() {
              throw new Error('Unable to load affiliations. Please try again.')
            },
          }
          const query = jest
            .fn()
            .mockReturnValueOnce([])
            .mockReturnValueOnce(cursor)

          const affiliationLoader = affiliationLoaderByUserId(
            query,
            user._key,
            cleanseInput,
            'en',
            i18n,
          )

          const connectionArgs = {}
          try {
            await affiliationLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to load affiliations. Please try again.'),
            )
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user: ${user._key} was trying to gather affiliations in affiliationLoaderByUserId.`,
          ])
        })
      })
    })
  })
  describe('users language is set to french', () => {
    beforeAll(() => {
      i18n = setupI18n({
        language: 'fr',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
        },
      })
    })
    describe('given a successful load', () => {
      describe('given there are user affiliations to be returned', () => {
        let affOne, affTwo
        beforeEach(async () => {
          affOne = await collections.affiliations.save({
            _from: orgOne._id,
            _to: user._id,
            permission: 'user',
          })
          affTwo = await collections.affiliations.save({
            _from: orgTwo._id,
            _to: user._id,
            permission: 'user',
          })
        })
        afterEach(async () => {
          await query`
            LET userEdges = (FOR v, e IN 1..1 ANY ${orgOne._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
            LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
            RETURN true
          `
          await query`
            LET userEdges = (FOR v, e IN 1..1 ANY ${orgTwo._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
            LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
            RETURN true
          `
          await query`
            FOR affiliation IN affiliations
              REMOVE affiliation IN affiliations
          `
        })
        describe('using no cursor and no limit', () => {
          it('returns affiliations', async () => {
            const affiliationLoader = affiliationLoaderByUserId(
              query,
              user._key,
              cleanseInput,
              'fr',
              i18n,
            )

            const connectionArgs = {}
            const affiliations = await affiliationLoader({ ...connectionArgs })

            const affLoader = affiliationLoaderByKey(query)
            const expectedAffiliations = await affLoader.loadMany([
              affOne._key,
              affTwo._key,
            ])

            expectedAffiliations[0].id = expectedAffiliations[0]._key
            expectedAffiliations[1].id = expectedAffiliations[1]._key

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('affiliations', expectedAffiliations[0]._key),
                  node: {
                    ...expectedAffiliations[0],
                  },
                },
                {
                  cursor: toGlobalId('affiliations', expectedAffiliations[1]._key),
                  node: {
                    ...expectedAffiliations[1],
                  },
                },
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('affiliations', expectedAffiliations[0]._key),
                endCursor: toGlobalId('affiliations', expectedAffiliations[1]._key),
              },
            }

            expect(affiliations).toEqual(expectedStructure)
          })
        })
        describe('using after cursor', () => {
          it('returns an affiliation', async () => {
            const affiliationLoader = affiliationLoaderByUserId(
              query,
              user._key,
              cleanseInput,
              'fr',
              i18n,
            )

            const affLoader = affiliationLoaderByKey(query)
            const expectedAffiliations = await affLoader.loadMany([
              affOne._key,
              affTwo._key,
            ])

            expectedAffiliations[0].id = expectedAffiliations[0]._key
            expectedAffiliations[1].id = expectedAffiliations[1]._key

            const connectionArgs = {
              after: toGlobalId('affiliations', expectedAffiliations[0].id),
            }
            const affiliations = await affiliationLoader({ ...connectionArgs })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('affiliations', expectedAffiliations[1]._key),
                  node: {
                    ...expectedAffiliations[1],
                  },
                },
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('affiliations', expectedAffiliations[1]._key),
                endCursor: toGlobalId('affiliations', expectedAffiliations[1]._key),
              },
            }

            expect(affiliations).toEqual(expectedStructure)
          })
        })
        describe('using before cursor', () => {
          it('returns an affiliation', async () => {
            const affiliationLoader = affiliationLoaderByUserId(
              query,
              user._key,
              cleanseInput,
              'fr',
              i18n,
            )

            const affLoader = affiliationLoaderByKey(query)
            const expectedAffiliations = await affLoader.loadMany([
              affOne._key,
              affTwo._key,
            ])

            expectedAffiliations[0].id = expectedAffiliations[0]._key
            expectedAffiliations[1].id = expectedAffiliations[1]._key

            const connectionArgs = {
              before: toGlobalId('affiliations', expectedAffiliations[1].id),
            }
            const affiliations = await affiliationLoader({ ...connectionArgs })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('affiliations', expectedAffiliations[0]._key),
                  node: {
                    ...expectedAffiliations[0],
                  },
                },
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('affiliations', expectedAffiliations[0]._key),
                endCursor: toGlobalId('affiliations', expectedAffiliations[0]._key),
              },
            }

            expect(affiliations).toEqual(expectedStructure)
          })
        })
        describe('using first limit', () => {
          it('returns an affiliation', async () => {
            const affiliationLoader = affiliationLoaderByUserId(
              query,
              user._key,
              cleanseInput,
              'fr',
              i18n,
            )

            const affLoader = affiliationLoaderByKey(query)
            const expectedAffiliations = await affLoader.loadMany([
              affOne._key,
              affTwo._key,
            ])

            expectedAffiliations[0].id = expectedAffiliations[0]._key
            expectedAffiliations[1].id = expectedAffiliations[1]._key

            const connectionArgs = {
              first: 1,
            }
            const affiliations = await affiliationLoader({ ...connectionArgs })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('affiliations', expectedAffiliations[0]._key),
                  node: {
                    ...expectedAffiliations[0],
                  },
                },
              ],
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false,
                startCursor: toGlobalId('affiliations', expectedAffiliations[0]._key),
                endCursor: toGlobalId('affiliations', expectedAffiliations[0]._key),
              },
            }

            expect(affiliations).toEqual(expectedStructure)
          })
        })
        describe('using last limit', () => {
          it('returns an affiliation', async () => {
            const affiliationLoader = affiliationLoaderByUserId(
              query,
              user._key,
              cleanseInput,
              'fr',
              i18n,
            )

            const affLoader = affiliationLoaderByKey(query)
            const expectedAffiliations = await affLoader.loadMany([
              affOne._key,
              affTwo._key,
            ])

            expectedAffiliations[0].id = expectedAffiliations[0]._key
            expectedAffiliations[1].id = expectedAffiliations[1]._key

            const connectionArgs = {
              last: 1,
            }
            const affiliations = await affiliationLoader({ ...connectionArgs })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('affiliations', expectedAffiliations[1]._key),
                  node: {
                    ...expectedAffiliations[1],
                  },
                },
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: toGlobalId('affiliations', expectedAffiliations[1]._key),
                endCursor: toGlobalId('affiliations', expectedAffiliations[1]._key),
              },
            }

            expect(affiliations).toEqual(expectedStructure)
          })
        })
      })
      describe('given there are no user affiliations to be returned', () => {
        it('returns no affiliations', async () => {
          const affiliationLoader = affiliationLoaderByUserId(
            query,
            user._key,
            cleanseInput,
            'fr',
            i18n,
          )

          const connectionArgs = {}
          const affiliations = await affiliationLoader({ ...connectionArgs })

          const expectedStructure = {
            edges: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: '',
              endCursor: '',
            },
          }

          expect(affiliations).toEqual(expectedStructure)
        })
      })
    })
    describe('given an unsuccessful load', () => {
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const affiliationLoader = affiliationLoaderByUserId(
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
            await affiliationLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'todo',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} tried to have first and last set in user affiliation query`,
          ])
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

          const affiliationLoader = affiliationLoaderByUserId(
            query,
            user._key,
            cleanseInput,
            'fr',
            i18n,
          )

          const connectionArgs = {}
          try {
            await affiliationLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error('todo'),
            )
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to query affiliations in affiliationLoaderByUserId.`,
          ])
        })
      })
    })
    describe('given a cursor error', () => {
      describe('while gathering domains', () => {
        it('returns an error message', async () => {
          const cursor = {
            next() {
              throw new Error('Unable to load affiliations. Please try again.')
            },
          }
          const query = jest
            .fn()
            .mockReturnValueOnce([])
            .mockReturnValueOnce(cursor)

          const affiliationLoader = affiliationLoaderByUserId(
            query,
            user._key,
            cleanseInput,
            'fr',
            i18n,
          )

          const connectionArgs = {}
          try {
            await affiliationLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error('todo'),
            )
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user: ${user._key} was trying to gather affiliations in affiliationLoaderByUserId.`,
          ])
        })
      })
    })
  })
})
