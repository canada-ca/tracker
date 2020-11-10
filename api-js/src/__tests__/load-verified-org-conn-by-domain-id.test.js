const { DB_PASS: rootPass, DB_URL: url } = process.env

const { stringify } = require('jest-matcher-utils')
const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { toGlobalId } = require('graphql-relay')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../locale/en/messages')
const frenchMessages = require('../locale/fr/messages')
const { makeMigrations } = require('../../migrations')
const { cleanseInput } = require('../validators')
const {
  verifiedOrgLoaderConnectionsByDomainId,
  verifiedOrgLoaderByKey,
} = require('../loaders')

describe('given the load organizations connection function', () => {
  let query, drop, truncate, migrate, collections, org, orgTwo, domain, i18n

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
    org = await collections.organizations.save({
      verified: true,
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
      verified: true,
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
    domain = await collections.domains.save({
      domain: 'test.domain.gc.ca',
      slug: 'test-domain-gc-ca',
    })
    await collections.claims.save({
      _from: org._id,
      _to: domain._id,
    })
    await collections.claims.save({
      _from: orgTwo._id,
      _to: domain._id,
    })
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })

  describe('users language is english', () => {
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
          const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
            query,
            'en',
            cleanseInput,
            i18n,
          )

          const connectionArgs = {
            first: 5,
          }
          const orgs = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const orgLoader = verifiedOrgLoaderByKey(query, 'en')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId(
                  'verifiedOrganizations',
                  expectedOrgs[0]._key,
                ),
                node: {
                  ...expectedOrgs[0],
                },
              },
              {
                cursor: toGlobalId(
                  'verifiedOrganizations',
                  expectedOrgs[1]._key,
                ),
                node: {
                  ...expectedOrgs[1],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[0]._key,
              ),
              endCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[1]._key,
              ),
            },
          }

          expect(orgs).toEqual(expectedStructure)
        })
      })
      describe('using after cursor', () => {
        it('returns an organization', async () => {
          const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
            query,
            'en',
            cleanseInput,
            i18n,
          )

          const orgLoader = verifiedOrgLoaderByKey(query, 'en')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            first: 5,
            after: toGlobalId('verifiedOrganizations', expectedOrgs[0].id),
          }
          const orgs = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId(
                  'verifiedOrganizations',
                  expectedOrgs[1]._key,
                ),
                node: {
                  ...expectedOrgs[1],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[1]._key,
              ),
              endCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[1]._key,
              ),
            },
          }

          expect(orgs).toEqual(expectedStructure)
        })
      })
      describe('using before cursor', () => {
        it('returns an organization', async () => {
          const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
            query,
            'en',
            cleanseInput,
            i18n,
          )

          const orgLoader = verifiedOrgLoaderByKey(query, 'en')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            first: 5,
            before: toGlobalId('verifiedOrganizations', expectedOrgs[1].id),
          }
          const orgs = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId(
                  'verifiedOrganizations',
                  expectedOrgs[0]._key,
                ),
                node: {
                  ...expectedOrgs[0],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[0]._key,
              ),
              endCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[0]._key,
              ),
            },
          }

          expect(orgs).toEqual(expectedStructure)
        })
      })
      describe('using first limit', () => {
        it('returns an organization', async () => {
          const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
            query,
            'en',
            cleanseInput,
            i18n,
          )

          const orgLoader = verifiedOrgLoaderByKey(query, 'en')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            first: 1,
          }
          const orgs = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId(
                  'verifiedOrganizations',
                  expectedOrgs[0]._key,
                ),
                node: {
                  ...expectedOrgs[0],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[0]._key,
              ),
              endCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[0]._key,
              ),
            },
          }

          expect(orgs).toEqual(expectedStructure)
        })
      })
      describe('using last limit', () => {
        it('returns an organization', async () => {
          const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
            query,
            'en',
            cleanseInput,
            i18n,
          )

          const orgLoader = verifiedOrgLoaderByKey(query, 'en')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            last: 1,
          }
          const orgs = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId(
                  'verifiedOrganizations',
                  expectedOrgs[1]._key,
                ),
                node: {
                  ...expectedOrgs[1],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[1]._key,
              ),
              endCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[1]._key,
              ),
            },
          }

          expect(orgs).toEqual(expectedStructure)
        })
      })
      describe('no organizations are found', () => {
        it('returns empty structure', async () => {
          const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
            query,
            'en',
            cleanseInput,
            i18n,
          )

          const connectionArgs = {
            last: 1,
          }
          const orgs = await connectionLoader({
            domainId: 'domains/1',
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

          expect(orgs).toEqual(expectedStructure)
        })
      })
    })
    describe('given an unsuccessful load', () => {
      describe('limits are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
            query,
            'en',
            cleanseInput,
            i18n,
          )

          try {
            const connectionArgs = {}
            await connectionLoader({ domainId: domain._id, ...connectionArgs })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'You must provide a `first` or `last` value to properly paginate the `verifiedOrganization` connection.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            'User did not have either `first` or `last` arguments set for: verifiedOrgLoaderConnectionsByDomainId.',
          ])
        })
      })
      describe('user has first and last arguments set at the same time', () => {
        it('returns an error message', async () => {
          const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
            query,
            'en',
            cleanseInput,
            i18n,
          )

          try {
            const connectionArgs = {
              first: 1,
              last: 1,
            }
            await connectionLoader({ domainId: domain._id, ...connectionArgs })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Passing both `first` and `last` to paginate the `verifiedOrganization` connection is not supported.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            'User attempted to have `first` and `last` arguments set for: verifiedOrgLoaderConnectionsByDomainId.',
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
              query,
              'en',
              cleanseInput,
              i18n,
            )

            try {
              const connectionArgs = {
                first: -1,
              }
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`first` on the `verifiedOrganization` connection cannot be less than zero.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              'User attempted to have `first` set below zero for: verifiedOrgLoaderConnectionsByDomainId.',
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
              query,
              'en',
              cleanseInput,
              i18n,
            )

            try {
              const connectionArgs = {
                last: -1,
              }
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`last` on the `verifiedOrganization` connection cannot be less than zero.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              'User attempted to have `last` set below zero for: verifiedOrgLoaderConnectionsByDomainId.',
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
              query,
              'en',
              cleanseInput,
              i18n,
            )

            try {
              const connectionArgs = {
                first: 101,
              }
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting `101` records on the `verifiedOrganization` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              'User attempted to have `first` to 101 for: verifiedOrgLoaderConnectionsByDomainId.',
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
              query,
              'en',
              cleanseInput,
              i18n,
            )

            try {
              const connectionArgs = {
                last: 101,
              }
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting `101` records on the `verifiedOrganization` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              'User attempted to have `last` to 101 for: verifiedOrgLoaderConnectionsByDomainId.',
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
              const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
                query,
                'en',
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
              expect(consoleOutput).toEqual([
                `User attempted to have \`first\` set as a ${typeof invalidInput} for: verifiedOrgLoaderConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
                query,
                'en',
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
              expect(consoleOutput).toEqual([
                `User attempted to have \`last\` set as a ${typeof invalidInput} for: verifiedOrgLoaderConnectionsByDomainId.`,
              ])
            })
          })
        })
      })
    })
    describe('given a database error', () => {
      describe('when gathering organizations', () => {
        it('returns an error message', async () => {
          const query = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
            query,
            'en',
            cleanseInput,
            i18n,
          )

          try {
            const connectionArgs = {
              first: 5,
            }
            await connectionLoader({ domainId: domain._id, ...connectionArgs })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Unable to load verified organizations. Please try again.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user was trying to gather orgs in verifiedOrgLoaderConnectionsByDomainId, error: Error: Database error occurred.`,
          ])
        })
      })
      describe('given a cursor error', () => {
        describe('when gathering organizations', () => {
          it('returns an error message', async () => {
            const cursor = {
              next() {
                throw new Error('Cursor error occurred.')
              },
            }
            const query = jest.fn().mockReturnValueOnce(cursor)

            const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
              query,
              'en',
              cleanseInput,
              i18n,
            )

            try {
              const connectionArgs = {
                first: 5,
              }
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Unable to load verified organizations. Please try again.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `Cursor error occurred while user was trying to gather orgs in verifiedOrgLoaderConnectionsByDomainId, error: Error: Cursor error occurred.`,
            ])
          })
        })
      })
    })
  })
  describe('users language is french', () => {
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
          const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
            query,
            'fr',
            cleanseInput,
            i18n,
          )

          const connectionArgs = {
            first: 5,
          }
          const orgs = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const orgLoader = verifiedOrgLoaderByKey(query, 'fr')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId(
                  'verifiedOrganizations',
                  expectedOrgs[0]._key,
                ),
                node: {
                  ...expectedOrgs[0],
                },
              },
              {
                cursor: toGlobalId(
                  'verifiedOrganizations',
                  expectedOrgs[1]._key,
                ),
                node: {
                  ...expectedOrgs[1],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[0]._key,
              ),
              endCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[1]._key,
              ),
            },
          }

          expect(orgs).toEqual(expectedStructure)
        })
      })
      describe('using after cursor', () => {
        it('returns an organization', async () => {
          const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
            query,
            'fr',
            cleanseInput,
            i18n,
          )

          const orgLoader = verifiedOrgLoaderByKey(query, 'fr')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            first: 5,
            after: toGlobalId('verifiedOrganizations', expectedOrgs[0].id),
          }
          const orgs = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId(
                  'verifiedOrganizations',
                  expectedOrgs[1]._key,
                ),
                node: {
                  ...expectedOrgs[1],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[1]._key,
              ),
              endCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[1]._key,
              ),
            },
          }

          expect(orgs).toEqual(expectedStructure)
        })
      })
      describe('using before cursor', () => {
        it('returns an organization', async () => {
          const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
            query,
            'fr',
            cleanseInput,
            i18n,
          )

          const orgLoader = verifiedOrgLoaderByKey(query, 'fr')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            first: 5,
            before: toGlobalId('verifiedOrganizations', expectedOrgs[1].id),
          }
          const orgs = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId(
                  'verifiedOrganizations',
                  expectedOrgs[0]._key,
                ),
                node: {
                  ...expectedOrgs[0],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[0]._key,
              ),
              endCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[0]._key,
              ),
            },
          }

          expect(orgs).toEqual(expectedStructure)
        })
      })
      describe('using first limit', () => {
        it('returns an organization', async () => {
          const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
            query,
            'fr',
            cleanseInput,
            i18n,
          )

          const orgLoader = verifiedOrgLoaderByKey(query, 'fr')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            first: 1,
          }
          const orgs = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId(
                  'verifiedOrganizations',
                  expectedOrgs[0]._key,
                ),
                node: {
                  ...expectedOrgs[0],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[0]._key,
              ),
              endCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[0]._key,
              ),
            },
          }

          expect(orgs).toEqual(expectedStructure)
        })
      })
      describe('using last limit', () => {
        it('returns an organization', async () => {
          const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
            query,
            'fr',
            cleanseInput,
            i18n,
          )

          const orgLoader = verifiedOrgLoaderByKey(query, 'fr')
          const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

          expectedOrgs[0].id = expectedOrgs[0]._key
          expectedOrgs[1].id = expectedOrgs[1]._key

          const connectionArgs = {
            last: 1,
          }
          const orgs = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId(
                  'verifiedOrganizations',
                  expectedOrgs[1]._key,
                ),
                node: {
                  ...expectedOrgs[1],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[1]._key,
              ),
              endCursor: toGlobalId(
                'verifiedOrganizations',
                expectedOrgs[1]._key,
              ),
            },
          }

          expect(orgs).toEqual(expectedStructure)
        })
      })
      describe('no organizations are found', () => {
        it('returns empty structure', async () => {
          const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
            query,
            'fr',
            cleanseInput,
            i18n,
          )

          const connectionArgs = {
            last: 1,
          }
          const orgs = await connectionLoader({
            domainId: 'domains/1',
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

          expect(orgs).toEqual(expectedStructure)
        })
      })
    })
    describe('given an unsuccessful load', () => {
      describe('limits are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
            query,
            'fr',
            cleanseInput,
            i18n,
          )

          try {
            const connectionArgs = {}
            await connectionLoader({ domainId: domain._id, ...connectionArgs })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleOutput).toEqual([
            `User did not have either \`first\` or \`last\` arguments set for: verifiedOrgLoaderConnectionsByDomainId.`,
          ])
        })
      })
      describe('user has first and last arguments set at the same time', () => {
        it('returns an error message', async () => {
          const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
            query,
            'fr',
            cleanseInput,
            i18n,
          )

          try {
            const connectionArgs = {
              first: 1,
              last: 1,
            }
            await connectionLoader({ domainId: domain._id, ...connectionArgs })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleOutput).toEqual([
            `User attempted to have \`first\` and \`last\` arguments set for: verifiedOrgLoaderConnectionsByDomainId.`,
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
              query,
              'fr',
              cleanseInput,
              i18n,
            )

            try {
              const connectionArgs = {
                first: -1,
              }
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`first\` set below zero for: verifiedOrgLoaderConnectionsByDomainId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
              query,
              'fr',
              cleanseInput,
              i18n,
            )

            try {
              const connectionArgs = {
                last: -1,
              }
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`last\` set below zero for: verifiedOrgLoaderConnectionsByDomainId.`,
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
              query,
              'fr',
              cleanseInput,
              i18n,
            )

            try {
              const connectionArgs = {
                first: 101,
              }
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`first\` to 101 for: verifiedOrgLoaderConnectionsByDomainId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
              query,
              'fr',
              cleanseInput,
              i18n,
            )

            try {
              const connectionArgs = {
                last: 101,
              }
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`last\` to 101 for: verifiedOrgLoaderConnectionsByDomainId.`,
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
              const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
                query,
                'fr',
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
              expect(consoleOutput).toEqual([
                `User attempted to have \`first\` set as a ${typeof invalidInput} for: verifiedOrgLoaderConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
                query,
                'fr',
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
              expect(consoleOutput).toEqual([
                `User attempted to have \`last\` set as a ${typeof invalidInput} for: verifiedOrgLoaderConnectionsByDomainId.`,
              ])
            })
          })
        })
      })
    })
    describe('given a database error', () => {
      describe('when gathering organizations', () => {
        it('returns an error message', async () => {
          const query = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
            query,
            'fr',
            cleanseInput,
            i18n,
          )

          try {
            const connectionArgs = {
              first: 5,
            }
            await connectionLoader({ domainId: domain._id, ...connectionArgs })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user was trying to gather orgs in verifiedOrgLoaderConnectionsByDomainId, error: Error: Database error occurred.`,
          ])
        })
      })
      describe('given a cursor error', () => {
        describe('when gathering organizations', () => {
          it('returns an error message', async () => {
            const cursor = {
              next() {
                throw new Error('Cursor error occurred.')
              },
            }
            const query = jest.fn().mockReturnValueOnce(cursor)

            const connectionLoader = verifiedOrgLoaderConnectionsByDomainId(
              query,
              'fr',
              cleanseInput,
              i18n,
            )

            try {
              const connectionArgs = {
                first: 5,
              }
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `Cursor error occurred while user was trying to gather orgs in verifiedOrgLoaderConnectionsByDomainId, error: Error: Cursor error occurred.`,
            ])
          })
        })
      })
    })
  })
})
