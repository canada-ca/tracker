import { setupI18n } from '@lingui/core'
import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { stringify } from 'jest-matcher-utils'
import { toGlobalId } from 'graphql-relay'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { cleanseInput } from '../../../validators'
import { verifiedDomainLoaderConnectionsByOrgId, verifiedDomainLoaderByKey } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the verifiedDomainLoaderConnectionsByOrgId function', () => {
  let query,
    drop,
    truncate,
    migrate,
    collections,
    user,
    org,
    domain,
    domainTwo,
    i18n

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
    consoleOutput = []
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
    })
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
    await collections.affiliations.save({
      _from: org._id,
      _to: user._id,
      permission: 'user',
    })
    domain = await collections.domains.save({
      domain: 'test.domain.gc.ca',
    })
    await collections.claims.save({
      _from: org._id,
      _to: domain._id,
    })
    domainTwo = await collections.domains.save({
      domain: 'test.domain.canada.ca',
    })
    await collections.claims.save({
      _from: org._id,
      _to: domainTwo._id,
    })
  })

  afterAll(async () => {
    await drop()
  })
  describe('given a successful load', () => {
    describe('using no cursor', () => {
      it('returns multiple domains', async () => {
        const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
          query,
          cleanseInput,
        )

        const connectionArgs = {
          first: 10,
        }
        const domains = await connectionLoader({
          orgId: org._id,
          ...connectionArgs,
        })

        const domainLoader = verifiedDomainLoaderByKey(query)
        const expectedDomains = await domainLoader.loadMany([
          domain._key,
          domainTwo._key,
        ])

        expectedDomains[0].id = expectedDomains[0]._key
        expectedDomains[1].id = expectedDomains[1]._key

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('verifiedDomains', expectedDomains[0]._key),
              node: {
                ...expectedDomains[0],
              },
            },
            {
              cursor: toGlobalId('verifiedDomains', expectedDomains[1]._key),
              node: {
                ...expectedDomains[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('verifiedDomains', expectedDomains[0]._key),
            endCursor: toGlobalId('verifiedDomains', expectedDomains[1]._key),
          },
          totalCount: 2,
        }

        expect(domains).toEqual(expectedStructure)
      })
    })
    describe('using after cursor', () => {
      it('returns a domain', async () => {
        const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
          query,
          cleanseInput,
        )

        const domainLoader = verifiedDomainLoaderByKey(query)
        const expectedDomains = await domainLoader.loadMany([
          domain._key,
          domainTwo._key,
        ])

        expectedDomains[0].id = expectedDomains[0]._key
        expectedDomains[1].id = expectedDomains[1]._key

        const connectionArgs = {
          first: 10,
          after: toGlobalId('verifiedDomains', expectedDomains[0]._key),
        }
        const domains = await connectionLoader({
          orgId: org._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('verifiedDomains', expectedDomains[1]._key),
              node: {
                ...expectedDomains[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('verifiedDomains', expectedDomains[1]._key),
            endCursor: toGlobalId('verifiedDomains', expectedDomains[1]._key),
          },
          totalCount: 2,
        }

        expect(domains).toEqual(expectedStructure)
      })
    })
    describe('using before cursor', () => {
      it('returns a domain', async () => {
        const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
          query,
          cleanseInput,
        )

        const domainLoader = verifiedDomainLoaderByKey(query)
        const expectedDomains = await domainLoader.loadMany([
          domain._key,
          domainTwo._key,
        ])

        expectedDomains[0].id = expectedDomains[0]._key
        expectedDomains[1].id = expectedDomains[1]._key

        const connectionArgs = {
          first: 10,
          before: toGlobalId('verifiedDomains', expectedDomains[1]._key),
        }
        const domains = await connectionLoader({
          orgId: org._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('verifiedDomains', expectedDomains[0]._key),
              node: {
                ...expectedDomains[0],
              },
            },
          ],
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('verifiedDomains', expectedDomains[0]._key),
            endCursor: toGlobalId('verifiedDomains', expectedDomains[0]._key),
          },
          totalCount: 2,
        }

        expect(domains).toEqual(expectedStructure)
      })
    })
    describe('using first limit', () => {
      it('returns a domain', async () => {
        const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
          query,
          cleanseInput,
        )

        const domainLoader = verifiedDomainLoaderByKey(query)
        const expectedDomains = await domainLoader.loadMany([
          domain._key,
          domainTwo._key,
        ])

        expectedDomains[0].id = expectedDomains[0]._key
        expectedDomains[1].id = expectedDomains[1]._key

        const connectionArgs = {
          first: 1,
        }
        const domains = await connectionLoader({
          orgId: org._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('verifiedDomains', expectedDomains[0]._key),
              node: {
                ...expectedDomains[0],
              },
            },
          ],
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('verifiedDomains', expectedDomains[0]._key),
            endCursor: toGlobalId('verifiedDomains', expectedDomains[0]._key),
          },
          totalCount: 2,
        }

        expect(domains).toEqual(expectedStructure)
      })
    })
    describe('using last limit', () => {
      it('returns a domain', async () => {
        const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
          query,
          cleanseInput,
        )

        const domainLoader = verifiedDomainLoaderByKey(query)
        const expectedDomains = await domainLoader.loadMany([
          domain._key,
          domainTwo._key,
        ])

        expectedDomains[0].id = expectedDomains[0]._key
        expectedDomains[1].id = expectedDomains[1]._key

        const connectionArgs = {
          last: 1,
        }
        const domains = await connectionLoader({
          orgId: org._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('verifiedDomains', expectedDomains[1]._key),
              node: {
                ...expectedDomains[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('verifiedDomains', expectedDomains[1]._key),
            endCursor: toGlobalId('verifiedDomains', expectedDomains[1]._key),
          },
          totalCount: 2,
        }

        expect(domains).toEqual(expectedStructure)
      })
    })
    describe('no organizations are found', () => {
      it('returns an empty structure', async () => {
        await truncate()
        const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
          query,
          cleanseInput,
        )

        const connectionArgs = {
          first: 10,
        }
        const domains = await connectionLoader({
          orgId: org._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: '',
            endCursor: '',
          },
          totalCount: 0,
        }

        expect(domains).toEqual(expectedStructure)
      })
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
        missing: 'Traduction manquante',
        messages: {
          en: englishMessages.messages,
          fr: frenchMessages.messages,
        },
      })
    })
    describe('given an unsuccessful load', () => {
      describe('limits are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
            query,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {}
          try {
            await connectionLoader({
              orgId: org._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                `You must provide a \`first\` or \`last\` value to properly paginate the \`verifiedDomain\` connection.`,
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User did not have either \`first\` or \`last\` arguments set for: verifiedDomainLoaderConnectionsByOrgId.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
            query,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {
            first: 1,
            last: 1,
          }
          try {
            await connectionLoader({
              orgId: org._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                `Passing both \`first\` and \`last\` to paginate the \`verifiedDomain\` connection is not supported.`,
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User attempted to have \`first\` and \`last\` arguments set for: verifiedDomainLoaderConnectionsByOrgId.`,
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
              query,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              first: -5,
            }
            try {
              await connectionLoader({
                orgId: org._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  `\`first\` on the \`verifiedDomain\` connection cannot be less than zero.`,
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`first\` set below zero for: verifiedDomainLoaderConnectionsByOrgId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
              query,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              last: -5,
            }
            try {
              await connectionLoader({
                orgId: org._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  `\`last\` on the \`verifiedDomain\` connection cannot be less than zero.`,
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`last\` set below zero for: verifiedDomainLoaderConnectionsByOrgId.`,
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
              query,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              first: 1000,
            }
            try {
              await connectionLoader({
                orgId: org._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  `Requesting \`1000\` records on the \`verifiedDomain\` connection exceeds the \`first\` limit of 100 records.`,
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`first\` to 1000 for: verifiedDomainLoaderConnectionsByOrgId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
              query,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              last: 1000,
            }
            try {
              await connectionLoader({
                orgId: org._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  `Requesting \`1000\` records on the \`verifiedDomain\` connection exceeds the \`last\` limit of 100 records.`,
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`last\` to 1000 for: verifiedDomainLoaderConnectionsByOrgId.`,
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
              const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
                query,
                cleanseInput,
                i18n,
              )

              const connectionArgs = {
                first: invalidInput,
              }

              try {
                await connectionLoader({
                  domainId: domain._id,
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
                `User attempted to have \`first\` set as a ${typeof invalidInput} for: verifiedDomainLoaderConnectionsByOrgId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
                query,
                cleanseInput,
                i18n,
              )

              const connectionArgs = {
                last: invalidInput,
              }

              try {
                await connectionLoader({
                  domainId: domain._id,
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
                `User attempted to have \`last\` set as a ${typeof invalidInput} for: verifiedDomainLoaderConnectionsByOrgId.`,
              ])
            })
          })
        })
      })
    })
    describe('given a database error', () => {
      describe('when gathering domain keys that are claimed by orgs that the user has affiliations to', () => {
        it('returns an error message', async () => {
          const query = jest
            .fn()
            .mockRejectedValue(new Error('Database Error Occurred.'))

          const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
            query,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {
            first: 5,
          }
          try {
            await connectionLoader({
              orgId: org._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to load verified domains. Please try again.'),
            )
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user was trying to gather domains in verifiedDomainLoaderConnectionsByOrgId, error: Error: Database Error Occurred.`,
          ])
        })
      })
    })
    describe('given a cursor error', () => {
      describe('when gathering domain keys that are claimed by orgs that the user has affiliations to', () => {
        it('returns an error message', async () => {
          const cursor = {
            next() {
              throw new Error('Cursor error occurred.')
            },
          }
          const query = jest.fn().mockReturnValueOnce(cursor)

          const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
            query,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {
            first: 5,
          }
          try {
            await connectionLoader({
              orgId: org._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to load verified domains. Please try again.'),
            )
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user was trying to gather domains in verifiedDomainLoaderConnectionsByOrgId, error: Error: Cursor error occurred.`,
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
        missing: 'Traduction manquante',
        messages: {
          en: englishMessages.messages,
          fr: frenchMessages.messages,
        },
      })
    })
    describe('given an unsuccessful load', () => {
      describe('limits are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
            query,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {}
          try {
            await connectionLoader({
              orgId: org._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error(`todo`))
          }

          expect(consoleOutput).toEqual([
            `User did not have either \`first\` or \`last\` arguments set for: verifiedDomainLoaderConnectionsByOrgId.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
            query,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {
            first: 1,
            last: 1,
          }
          try {
            await connectionLoader({
              orgId: org._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error(`todo`))
          }

          expect(consoleOutput).toEqual([
            `User attempted to have \`first\` and \`last\` arguments set for: verifiedDomainLoaderConnectionsByOrgId.`,
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
              query,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              first: -5,
            }
            try {
              await connectionLoader({
                orgId: org._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`first\` set below zero for: verifiedDomainLoaderConnectionsByOrgId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
              query,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              last: -5,
            }
            try {
              await connectionLoader({
                orgId: org._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`last\` set below zero for: verifiedDomainLoaderConnectionsByOrgId.`,
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
              query,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              first: 1000,
            }
            try {
              await connectionLoader({
                orgId: org._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`first\` to 1000 for: verifiedDomainLoaderConnectionsByOrgId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
              query,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              last: 1000,
            }
            try {
              await connectionLoader({
                orgId: org._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`last\` to 1000 for: verifiedDomainLoaderConnectionsByOrgId.`,
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
              const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
                query,
                cleanseInput,
                i18n,
              )

              const connectionArgs = {
                first: invalidInput,
              }

              try {
                await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error(`todo`))
              }
              expect(consoleOutput).toEqual([
                `User attempted to have \`first\` set as a ${typeof invalidInput} for: verifiedDomainLoaderConnectionsByOrgId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
                query,
                cleanseInput,
                i18n,
              )

              const connectionArgs = {
                last: invalidInput,
              }

              try {
                await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error(`todo`))
              }
              expect(consoleOutput).toEqual([
                `User attempted to have \`last\` set as a ${typeof invalidInput} for: verifiedDomainLoaderConnectionsByOrgId.`,
              ])
            })
          })
        })
      })
    })
    describe('given a database error', () => {
      describe('when gathering domain keys that are claimed by orgs that the user has affiliations to', () => {
        it('returns an error message', async () => {
          const query = jest
            .fn()
            .mockRejectedValue(new Error('Database Error Occurred.'))

          const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
            query,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {
            first: 5,
          }
          try {
            await connectionLoader({
              orgId: org._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user was trying to gather domains in verifiedDomainLoaderConnectionsByOrgId, error: Error: Database Error Occurred.`,
          ])
        })
      })
    })
    describe('given a cursor error', () => {
      describe('when gathering domain keys that are claimed by orgs that the user has affiliations to', () => {
        it('returns an error message', async () => {
          const cursor = {
            next() {
              throw new Error('Cursor error occurred.')
            },
          }
          const query = jest.fn().mockReturnValueOnce(cursor)

          const connectionLoader = verifiedDomainLoaderConnectionsByOrgId(
            query,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {
            first: 5,
          }
          try {
            await connectionLoader({
              orgId: org._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user was trying to gather domains in verifiedDomainLoaderConnectionsByOrgId, error: Error: Cursor error occurred.`,
          ])
        })
      })
    })
  })
})
