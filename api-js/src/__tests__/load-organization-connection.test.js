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
const { orgLoaderByConnectionArgs, orgLoaderByKey } = require('../loaders')

describe('given the load organizations connection function', () => {
  let query, drop, truncate, migrate, collections, user, org, orgTwo, i18n

  let consoleOutput = []
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
    orgTwo = await collections.organizations.save({
      orgDetails: {
        en: {
          slug: 'communications-security-establishment',
          acronym: 'CSE',
          name: 'Communications Security Establishment',
          zone: 'FED',
          sector: 'DND',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'centre-de-la-securite-des-telecommunications',
          acronym: 'CST',
          name: 'Centre de la Securite des Telecommunications',
          zone: 'FED',
          sector: 'DND',
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
    await collections.affiliations.save({
      _from: orgTwo._id,
      _to: user._id,
      permission: 'user',
    })
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })

  describe('language is set to english', () => {
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
      describe('using no cursor', () => {
        it('returns an organization', async () => {
          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'en',
            user._key,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {}
          const orgs = await connectionLoader(connectionArgs)

          const orgLoader = orgLoaderByKey(query, 'en')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

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
          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'en',
            user._key,
            cleanseInput,
            i18n,
          )

          const orgLoader = orgLoaderByKey(query, 'en')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            after: toGlobalId('organizations', expectedOrgs[0].id),
          }
          const orgs = await connectionLoader(connectionArgs)

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('organizations', expectedOrgs[1]._key),
                node: {
                  ...expectedOrgs[1],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('organizations', expectedOrgs[1]._key),
              endCursor: toGlobalId('organizations', expectedOrgs[1]._key),
            },
          }

          expect(orgs).toEqual(expectedStructure)
        })
      })
      describe('using before cursor', () => {
        it('returns an organization', async () => {
          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'en',
            user._key,
            cleanseInput,
            i18n,
          )

          const orgLoader = orgLoaderByKey(query, 'en')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            before: toGlobalId('organizations', expectedOrgs[1].id),
          }
          const orgs = await connectionLoader(connectionArgs)

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('organizations', expectedOrgs[0]._key),
                node: {
                  ...expectedOrgs[0],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('organizations', expectedOrgs[0]._key),
              endCursor: toGlobalId('organizations', expectedOrgs[0]._key),
            },
          }

          expect(orgs).toEqual(expectedStructure)
        })
      })
      describe('using no limit', () => {
        it('returns an organization', async () => {
          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'en',
            user._key,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {}
          const orgs = await connectionLoader(connectionArgs)

          const orgLoader = orgLoaderByKey(query, 'en')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

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
      describe('using first limit', () => {
        it('returns an organization', async () => {
          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'en',
            user._key,
            cleanseInput,
            i18n,
          )

          const orgLoader = orgLoaderByKey(query, 'en')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            first: 1,
          }
          const orgs = await connectionLoader(connectionArgs)

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('organizations', expectedOrgs[0]._key),
                node: {
                  ...expectedOrgs[0],
                },
              },
            ],
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
          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'en',
            user._key,
            cleanseInput,
            i18n,
          )

          const orgLoader = orgLoaderByKey(query, 'en')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            last: 1,
          }
          const orgs = await connectionLoader(connectionArgs)

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('organizations', expectedOrgs[1]._key),
                node: {
                  ...expectedOrgs[1],
                },
              },
            ],
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
      describe('no organizations are found', () => {
        it('returns empty structure', async () => {
          await query`
            FOR org IN organizations
              REMOVE org IN organizations
          `

          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'en',
            user._key,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {
            last: 1,
          }
          const orgs = await connectionLoader(connectionArgs)

          const expectedStructure = {
            edges: [],
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
      describe('user has first and last arguments set at the same time', () => {
        it('returns an error message', async () => {
          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'en',
            user._key,
            cleanseInput,
            i18n,
          )

          try {
            const connectionArgs = {
              first: 1,
              last: 1,
            }
            await connectionLoader(connectionArgs)
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Error, unable to have first, and last set at the same time.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} tried to have first and last set in organizations connection query`,
          ])
        })
      })
    })
    describe('given a database error', () => {
      describe('when gathering affiliated organizations', () => {
        it('returns an error message', async () => {
          const query = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'en',
            user._key,
            cleanseInput,
            i18n,
          )

          try {
            const connectionArgs = {}
            await connectionLoader(connectionArgs)
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to load organizations. Please try again.'),
            )
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to gather affiliated orgs in loadOrganizationsConnections.`,
          ])
        })
      })
      describe('when gathering organizations', () => {
        it('returns an error message', async () => {
          const cursor = {
            next() {
              return ['org1']
            },
          }
          const query = jest
            .fn()
            .mockReturnValueOnce(cursor)
            .mockRejectedValue(new Error('Database error occurred.'))

          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'en',
            user._key,
            cleanseInput,
            i18n,
          )

          try {
            const connectionArgs = {}
            await connectionLoader(connectionArgs)
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to load organizations. Please try again.'),
            )
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to gather orgs in loadOrganizationsConnections.`,
          ])
        })
      })
      describe('given a cursor error', () => {
        describe('when gathering affiliated organizations', () => {
          it('returns an error message', async () => {
            const cursor = {
              next() {
                throw new Error('Cursor error occurred.')
              },
            }
            const query = jest.fn().mockReturnValueOnce(cursor)

            const connectionLoader = orgLoaderByConnectionArgs(
              query,
              'en',
              user._key,
              cleanseInput,
              i18n,
            )

            try {
              const connectionArgs = {}
              await connectionLoader(connectionArgs)
            } catch (err) {
              expect(err).toEqual(
                new Error('Unable to load organizations. Please try again.'),
              )
            }

            expect(consoleOutput).toEqual([
              `Cursor error occurred while user: ${user._key} was trying to gather affiliated orgs in loadOrganizationsConnections.`,
            ])
          })
        })
        describe('when gathering organizations', () => {
          it('returns an error message', async () => {
            const cursor = {
              next() {
                return ['org1']
              },
            }
            const query = jest
              .fn()
              .mockReturnValueOnce(cursor)
              .mockReturnValue({
                next() {
                  throw new Error('Cursor error occurred.')
                },
              })

            const connectionLoader = orgLoaderByConnectionArgs(
              query,
              'en',
              user._key,
              cleanseInput,
              i18n,
            )

            try {
              const connectionArgs = {}
              await connectionLoader(connectionArgs)
            } catch (err) {
              expect(err).toEqual(
                new Error('Unable to load organizations. Please try again.'),
              )
            }

            expect(consoleOutput).toEqual([
              `Cursor error occurred while user: ${user._key} was trying to gather orgs in loadOrganizationsConnections.`,
            ])
          })
        })
      })
    })
  })
  describe('language is set to french', () => {
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
      describe('using no cursor', () => {
        it('returns an organization', async () => {
          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'fr',
            user._key,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {}
          const orgs = await connectionLoader(connectionArgs)

          const orgLoader = orgLoaderByKey(query, 'fr')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

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
          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'fr',
            user._key,
            cleanseInput,
            i18n,
          )

          const orgLoader = orgLoaderByKey(query, 'fr')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            after: toGlobalId('organizations', expectedOrgs[0].id),
          }
          const orgs = await connectionLoader(connectionArgs)

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('organizations', expectedOrgs[1]._key),
                node: {
                  ...expectedOrgs[1],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('organizations', expectedOrgs[1]._key),
              endCursor: toGlobalId('organizations', expectedOrgs[1]._key),
            },
          }

          expect(orgs).toEqual(expectedStructure)
        })
      })
      describe('using before cursor', () => {
        it('returns an organization', async () => {
          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'fr',
            user._key,
            cleanseInput,
            i18n,
          )

          const orgLoader = orgLoaderByKey(query, 'fr')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            before: toGlobalId('organizations', expectedOrgs[1].id),
          }
          const orgs = await connectionLoader(connectionArgs)

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('organizations', expectedOrgs[0]._key),
                node: {
                  ...expectedOrgs[0],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('organizations', expectedOrgs[0]._key),
              endCursor: toGlobalId('organizations', expectedOrgs[0]._key),
            },
          }

          expect(orgs).toEqual(expectedStructure)
        })
      })
      describe('using no limit', () => {
        it('returns an organization', async () => {
          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'fr',
            user._key,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {}
          const orgs = await connectionLoader(connectionArgs)

          const orgLoader = orgLoaderByKey(query, 'fr')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

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
      describe('using first limit', () => {
        it('returns an organization', async () => {
          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'fr',
            user._key,
            cleanseInput,
            i18n,
          )

          const orgLoader = orgLoaderByKey(query, 'fr')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            first: 1,
          }
          const orgs = await connectionLoader(connectionArgs)

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('organizations', expectedOrgs[0]._key),
                node: {
                  ...expectedOrgs[0],
                },
              },
            ],
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
          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'fr',
            user._key,
            cleanseInput,
            i18n,
          )

          const orgLoader = orgLoaderByKey(query, 'fr')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            last: 1,
          }
          const orgs = await connectionLoader(connectionArgs)

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('organizations', expectedOrgs[1]._key),
                node: {
                  ...expectedOrgs[1],
                },
              },
            ],
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
      describe('no organizations are found', () => {
        it('returns empty structure', async () => {
          await query`
            FOR org IN organizations
              REMOVE org IN organizations
          `

          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'fr',
            user._key,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {
            last: 1,
          }
          const orgs = await connectionLoader(connectionArgs)

          const expectedStructure = {
            edges: [],
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
      describe('user has first and last arguments set at the same time', () => {
        it('returns an error message', async () => {
          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'fr',
            user._key,
            cleanseInput,
            i18n,
          )

          try {
            const connectionArgs = {
              first: 1,
              last: 1,
            }
            await connectionLoader(connectionArgs)
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} tried to have first and last set in organizations connection query`,
          ])
        })
      })
    })
    describe('given a database error', () => {
      describe('when gathering affiliated organizations', () => {
        it('returns an error message', async () => {
          const query = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'fr',
            user._key,
            cleanseInput,
            i18n,
          )

          try {
            const connectionArgs = {}
            await connectionLoader(connectionArgs)
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to gather affiliated orgs in loadOrganizationsConnections.`,
          ])
        })
      })
      describe('when gathering organizations', () => {
        it('returns an error message', async () => {
          const cursor = {
            next() {
              return ['org1']
            },
          }
          const query = jest
            .fn()
            .mockReturnValueOnce(cursor)
            .mockRejectedValue(new Error('Database error occurred.'))

          const connectionLoader = orgLoaderByConnectionArgs(
            query,
            'fr',
            user._key,
            cleanseInput,
            i18n,
          )

          try {
            const connectionArgs = {}
            await connectionLoader(connectionArgs)
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to gather orgs in loadOrganizationsConnections.`,
          ])
        })
      })
      describe('given a cursor error', () => {
        describe('when gathering affiliated organizations', () => {
          it('returns an error message', async () => {
            const cursor = {
              next() {
                throw new Error('Cursor error occurred.')
              },
            }
            const query = jest.fn().mockReturnValueOnce(cursor)

            const connectionLoader = orgLoaderByConnectionArgs(
              query,
              'fr',
              user._key,
              cleanseInput,
              i18n,
            )

            try {
              const connectionArgs = {}
              await connectionLoader(connectionArgs)
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `Cursor error occurred while user: ${user._key} was trying to gather affiliated orgs in loadOrganizationsConnections.`,
            ])
          })
        })
        describe('when gathering organizations', () => {
          it('returns an error message', async () => {
            const cursor = {
              next() {
                return ['org1']
              },
            }
            const query = jest
              .fn()
              .mockReturnValueOnce(cursor)
              .mockReturnValue({
                next() {
                  throw new Error('Cursor error occurred.')
                },
              })

            const connectionLoader = orgLoaderByConnectionArgs(
              query,
              'fr',
              user._key,
              cleanseInput,
              i18n,
            )

            try {
              const connectionArgs = {}
              await connectionLoader(connectionArgs)
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `Cursor error occurred while user: ${user._key} was trying to gather orgs in loadOrganizationsConnections.`,
            ])
          })
        })
      })
    })
  })
})
