import { stringify } from 'jest-matcher-utils'
import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput } from '../../../validators'
import { loadAffiliationConnectionsByOrgId, loadAffiliationByKey } from '../index'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the load affiliations by org id function', () => {
  let query, drop, truncate, collections, user, org, userTwo, i18n

  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.error = mockedError
    console.warn = mockedWarn
  })
  beforeEach(async () => {
    consoleOutput.length = 0
  })

  describe('given a successful load', () => {
    beforeAll(async () => {
      ;({ query, drop, truncate, collections } = await ensure({
        variables: {
          dbname: dbNameFromFile(__filename),
          username: 'root',
          rootPassword: rootPass,
          password: rootPass,
          url,
        },

        schema: dbschema,
      }))
    })
    beforeEach(async () => {
      user = await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
        tfaValidated: false,
        emailValidated: false,
      })
      userTwo = await collections.users.save({
        userName: 'test.accounttwo@istio.actually.exists',
        displayName: 'Jane Doe',
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
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('given there are user affiliations to be returned', () => {
      let affOne, affTwo
      beforeEach(async () => {
        affOne = await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'user',
        })
        affTwo = await collections.affiliations.save({
          _from: org._id,
          _to: userTwo._id,
          permission: 'user',
        })
      })
      afterEach(async () => {
        await query`
          LET userEdges = (FOR v, e IN 1..1 ANY ${org._id} affiliations RETURN { edgeKey: e._key, userKey: e._to })
          LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
          RETURN true
        `
        await query`
          FOR affiliation IN affiliations
            REMOVE affiliation IN affiliations
        `
      })
      describe('using after cursor', () => {
        it('returns an affiliation', async () => {
          const affiliationLoader = loadAffiliationConnectionsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const affLoader = loadAffiliationByKey({ query })
          const expectedAffiliations = await affLoader.loadMany([affOne._key, affTwo._key])

          expectedAffiliations[0].id = expectedAffiliations[0]._key
          expectedAffiliations[1].id = expectedAffiliations[1]._key

          const connectionArgs = {
            first: 5,
            after: toGlobalId('affiliation', expectedAffiliations[0].id),
          }
          const affiliations = await affiliationLoader({
            orgId: org._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('affiliation', expectedAffiliations[1]._key),
                node: {
                  ...expectedAffiliations[1],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId('affiliation', expectedAffiliations[1]._key),
              endCursor: toGlobalId('affiliation', expectedAffiliations[1]._key),
            },
          }

          expect(affiliations).toEqual(expectedStructure)
        })
      })
      describe('using before cursor', () => {
        it('returns an affiliation', async () => {
          const affiliationLoader = loadAffiliationConnectionsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const affLoader = loadAffiliationByKey({ query })
          const expectedAffiliations = await affLoader.loadMany([affOne._key, affTwo._key])

          expectedAffiliations[0].id = expectedAffiliations[0]._key
          expectedAffiliations[1].id = expectedAffiliations[1]._key

          const connectionArgs = {
            first: 5,
            before: toGlobalId('affiliation', expectedAffiliations[1].id),
          }
          const affiliations = await affiliationLoader({
            orgId: org._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('affiliation', expectedAffiliations[0]._key),
                node: {
                  ...expectedAffiliations[0],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: toGlobalId('affiliation', expectedAffiliations[0]._key),
              endCursor: toGlobalId('affiliation', expectedAffiliations[0]._key),
            },
          }

          expect(affiliations).toEqual(expectedStructure)
        })
      })
      describe('using only first limit', () => {
        it('returns an affiliation', async () => {
          const affiliationLoader = loadAffiliationConnectionsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const affLoader = loadAffiliationByKey({ query })
          const expectedAffiliations = await affLoader.loadMany([affOne._key, affTwo._key])

          expectedAffiliations[0].id = expectedAffiliations[0]._key
          expectedAffiliations[1].id = expectedAffiliations[1]._key

          const connectionArgs = {
            first: 1,
          }
          const affiliations = await affiliationLoader({
            orgId: org._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('affiliation', expectedAffiliations[0]._key),
                node: {
                  ...expectedAffiliations[0],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: toGlobalId('affiliation', expectedAffiliations[0]._key),
              endCursor: toGlobalId('affiliation', expectedAffiliations[0]._key),
            },
          }

          expect(affiliations).toEqual(expectedStructure)
        })
      })
      describe('using only last limit', () => {
        it('returns an affiliation', async () => {
          const affiliationLoader = loadAffiliationConnectionsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const affLoader = loadAffiliationByKey({ query })
          const expectedAffiliations = await affLoader.loadMany([affOne._key, affTwo._key])

          expectedAffiliations[0].id = expectedAffiliations[0]._key
          expectedAffiliations[1].id = expectedAffiliations[1]._key

          const connectionArgs = {
            last: 1,
          }
          const affiliations = await affiliationLoader({
            orgId: org._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('affiliation', expectedAffiliations[1]._key),
                node: {
                  ...expectedAffiliations[1],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId('affiliation', expectedAffiliations[1]._key),
              endCursor: toGlobalId('affiliation', expectedAffiliations[1]._key),
            },
          }

          expect(affiliations).toEqual(expectedStructure)
        })
      })
      describe('using the search field', () => {
        beforeEach(async () => {
          // This is used to sync the view before running the test below
          await query`
            FOR user IN userSearch
              SEARCH user.userName == "test.account@istio.actually.exists"
              OPTIONS { waitForSync: true }
              RETURN user
          `
        })
        describe('using the users userName', () => {
          it('returns the filtered affiliations', async () => {
            const affiliationLoader = loadAffiliationConnectionsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const affLoader = loadAffiliationByKey({ query })
            const expectedAffiliations = await affLoader.loadMany([affOne._key, affTwo._key])

            expectedAffiliations[0].id = expectedAffiliations[0]._key
            expectedAffiliations[1].id = expectedAffiliations[1]._key

            const connectionArgs = {
              first: 1,
              orgId: org._id,
              search: 'test.account@istio.actually.exists',
            }
            const affiliations = await affiliationLoader({
              ...connectionArgs,
            })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('affiliation', expectedAffiliations[0]._key),
                  node: {
                    ...expectedAffiliations[0],
                  },
                },
              ],
              totalCount: 1,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('affiliation', expectedAffiliations[0]._key),
                endCursor: toGlobalId('affiliation', expectedAffiliations[0]._key),
              },
            }

            expect(affiliations).toEqual(expectedStructure)
          })
        })
        describe('using the users displayName', () => {
          it('returns the filtered affiliations', async () => {
            const affiliationLoader = loadAffiliationConnectionsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const affLoader = loadAffiliationByKey({ query })
            const expectedAffiliations = await affLoader.loadMany([affOne._key, affTwo._key])

            expectedAffiliations[0].id = expectedAffiliations[0]._key
            expectedAffiliations[1].id = expectedAffiliations[1]._key

            const connectionArgs = {
              first: 1,
              orgId: org._id,
              search: 'Test Account',
            }
            const affiliations = await affiliationLoader({
              ...connectionArgs,
            })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('affiliation', expectedAffiliations[0]._key),
                  node: {
                    ...expectedAffiliations[0],
                  },
                },
              ],
              totalCount: 1,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('affiliation', expectedAffiliations[0]._key),
                endCursor: toGlobalId('affiliation', expectedAffiliations[0]._key),
              },
            }

            expect(affiliations).toEqual(expectedStructure)
          })
        })
      })
      describe('using orderBy field', () => {
        let affOne, affTwo, affThree, orgOne, userOne, userTwo, userThree
        beforeEach(async () => {
          await truncate()
          userOne = await collections.users.save({
            userName: 'user@email.a.ca',
          })
          userTwo = await collections.users.save({
            userName: 'user@email.b.ca',
          })
          userThree = await collections.users.save({
            userName: 'user@email.c.ca',
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
                slug: 'slug-org-a',
                acronym: 'ORG_A',
                name: 'org a',
                zone: 'zone a',
                sector: 'sector a',
                country: 'country a',
                province: 'province a',
                city: 'city a',
              },
              fr: {
                slug: 'slug-org-a',
                acronym: 'ORG_A',
                name: 'org a',
                zone: 'zone a',
                sector: 'sector a',
                country: 'country a',
                province: 'province a',
                city: 'city a',
              },
            },
          })
          affOne = await collections.affiliations.save({
            _key: '1',
            _from: orgOne._id,
            _to: userOne._id,
            permission: 'user',
          })
          affTwo = await collections.affiliations.save({
            _key: '2',
            _from: orgOne._id,
            _to: userTwo._id,
            permission: 'user',
          })
          affThree = await collections.affiliations.save({
            _key: '3',
            _from: orgOne._id,
            _to: userThree._id,
            permission: 'user',
          })
        })
        describe('ordering by USERNAME', () => {
          describe('direction is set to ASC', () => {
            it('returns affiliation', async () => {
              const expectedAffiliation = await loadAffiliationByKey({
                query,
                userKey: user._key,
                i18n,
              }).load(affTwo._key)

              const affiliationLoader = loadAffiliationConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                orgId: orgOne._id,
                first: 5,
                after: toGlobalId('affiliation', affOne._key),
                before: toGlobalId('affiliation', affThree._key),
                orderBy: {
                  field: 'username',
                  direction: 'ASC',
                },
              }

              const affiliations = await affiliationLoader(connectionArgs)

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('affiliation', affTwo._key),
                    node: {
                      ...expectedAffiliation,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId('affiliation', affTwo._key),
                  endCursor: toGlobalId('affiliation', affTwo._key),
                },
              }

              expect(affiliations).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns affiliation', async () => {
              const expectedAffiliation = await loadAffiliationByKey({
                query,
                userKey: user._key,
                i18n,
              }).load(affTwo._key)

              const affiliationLoader = loadAffiliationConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                orgId: orgOne._id,
                first: 5,
                after: toGlobalId('affiliation', affThree._key),
                before: toGlobalId('affiliation', affOne._key),
                orderBy: {
                  field: 'username',
                  direction: 'DESC',
                },
              }

              const affiliations = await affiliationLoader(connectionArgs)

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('affiliation', affTwo._key),
                    node: {
                      ...expectedAffiliation,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId('affiliation', affTwo._key),
                  endCursor: toGlobalId('affiliation', affTwo._key),
                },
              }

              expect(affiliations).toEqual(expectedStructure)
            })
          })
        })
      })
    })
    describe('given there are no user affiliations to be returned', () => {
      it('returns no affiliations', async () => {
        const affiliationLoader = loadAffiliationConnectionsByOrgId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const connectionArgs = {
          first: 5,
        }
        const affiliations = await affiliationLoader({
          orgId: org._id,
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

        expect(affiliations).toEqual(expectedStructure)
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
        locales: ['en'],
        messages: {
          en: englishMessages.messages,
        },
      })
    })
    describe('given an unsuccessful load', () => {
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const affiliationLoader = loadAffiliationConnectionsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 1,
            last: 1,
          }
          try {
            await affiliationLoader({ orgId: org._id, ...connectionArgs })
          } catch (err) {
            expect(err).toEqual(
              new Error('Passing both `first` and `last` to paginate the `Affiliation` connection is not supported.'),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadAffiliationConnectionsByOrgId.`,
          ])
        })
      })
      describe('neither first nor last arguments are set', () => {
        it('returns an error message', async () => {
          const affiliationLoader = loadAffiliationConnectionsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {}
          try {
            await affiliationLoader({
              orgId: org._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'You must provide a `first` or `last` value to properly paginate the `Affiliation` connection.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadAffiliationConnectionsByOrgId.`,
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const affiliationLoader = loadAffiliationConnectionsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              first: -1,
            }

            try {
              await affiliationLoader({
                orgId: org._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('`first` on the `Affiliation` connection cannot be less than zero.'))
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadAffiliationConnectionsByOrgId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const affiliationLoader = loadAffiliationConnectionsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              last: -2,
            }

            try {
              await affiliationLoader({
                orgId: org._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('`last` on the `Affiliation` connection cannot be less than zero.'))
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadAffiliationConnectionsByOrgId.`,
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const affiliationLoader = loadAffiliationConnectionsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              first: 1000,
            }

            try {
              await affiliationLoader({
                orgId: org._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting `1000` records on the `Affiliation` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 1000 for: loadAffiliationConnectionsByOrgId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const affiliationLoader = loadAffiliationConnectionsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              last: 200,
            }

            try {
              await affiliationLoader({
                orgId: org._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting `200` records on the `Affiliation` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 200 for: loadAffiliationConnectionsByOrgId.`,
            ])
          })
        })
      })
      describe('limits are not set to numbers', () => {
        describe('first limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when first set to ${stringify(invalidInput)}`, async () => {
              const affiliationLoader = loadAffiliationConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                first: invalidInput,
              }

              try {
                await affiliationLoader({
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error(`\`first\` must be of type \`number\` not \`${typeof invalidInput}\`.`))
              }
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadAffiliationConnectionsByOrgId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(invalidInput)}`, async () => {
              const affiliationLoader = loadAffiliationConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                last: invalidInput,
              }

              try {
                await affiliationLoader({
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error(`\`last\` must be of type \`number\` not \`${typeof invalidInput}\`.`))
              }
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadAffiliationConnectionsByOrgId.`,
              ])
            })
          })
        })
      })
    })
    describe('given a database error', () => {
      describe('while querying affiliations', () => {
        it('returns an error message', async () => {
          const query = jest.fn().mockRejectedValue(new Error('Unable to query organizations. Please try again.'))

          const affiliationLoader = loadAffiliationConnectionsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 5,
          }
          try {
            await affiliationLoader({ orgId: org._id, ...connectionArgs })
          } catch (err) {
            expect(err).toEqual(new Error('Unable to query affiliation(s). Please try again.'))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to query affiliations in loadAffiliationConnectionsByOrgId, error: Error: Unable to query organizations. Please try again.`,
          ])
        })
      })
    })
    describe('given a cursor error', () => {
      describe('while gathering affiliations', () => {
        it('returns an error message', async () => {
          const cursor = {
            next() {
              throw new Error('Unable to load affiliations. Please try again.')
            },
          }
          const query = jest.fn().mockReturnValueOnce(cursor)

          const affiliationLoader = loadAffiliationConnectionsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 5,
          }
          try {
            await affiliationLoader({ orgId: org._id, ...connectionArgs })
          } catch (err) {
            expect(err).toEqual(new Error('Unable to load affiliation(s). Please try again.'))
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user: ${user._key} was trying to gather affiliations in loadAffiliationConnectionsByOrgId, error: Error: Unable to load affiliations. Please try again.`,
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
        locales: ['fr'],
        messages: {
          fr: frenchMessages.messages,
        },
      })
    })
    describe('given an unsuccessful load', () => {
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const affiliationLoader = loadAffiliationConnectionsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 1,
            last: 1,
          }
          try {
            await affiliationLoader({ orgId: org._id, ...connectionArgs })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                `Passer à la fois \`first\` et \`last\` pour paginer la connexion \`Affiliation\` n'est pas supporté.`,
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadAffiliationConnectionsByOrgId.`,
          ])
        })
      })
      describe('neither first nor last arguments are set', () => {
        it('returns an error message', async () => {
          const affiliationLoader = loadAffiliationConnectionsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {}
          try {
            await affiliationLoader({
              orgId: org._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                `Vous devez fournir une valeur \`first\` ou \`last\` pour paginer correctement la connexion \`Affiliation\`.`,
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadAffiliationConnectionsByOrgId.`,
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const affiliationLoader = loadAffiliationConnectionsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              first: -1,
            }

            try {
              await affiliationLoader({
                orgId: org._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(`\`first\` sur la connexion \`Affiliation\` ne peut être inférieur à zéro.`),
              )
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadAffiliationConnectionsByOrgId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const affiliationLoader = loadAffiliationConnectionsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              last: -2,
            }

            try {
              await affiliationLoader({
                orgId: org._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error(`\`last\` sur la connexion \`Affiliation\` ne peut être inférieur à zéro.`))
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadAffiliationConnectionsByOrgId.`,
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const affiliationLoader = loadAffiliationConnectionsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              first: 1000,
            }

            try {
              await affiliationLoader({
                orgId: org._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  `La demande d'enregistrements \`1000\` sur la connexion \`Affiliation\` dépasse la limite \`first\` de 100 enregistrements.`,
                ),
              )
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 1000 for: loadAffiliationConnectionsByOrgId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const affiliationLoader = loadAffiliationConnectionsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              last: 200,
            }

            try {
              await affiliationLoader({
                orgId: org._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  `La demande d'enregistrements \`200\` sur la connexion \`Affiliation\` dépasse la limite \`last\` de 100 enregistrements.`,
                ),
              )
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 200 for: loadAffiliationConnectionsByOrgId.`,
            ])
          })
        })
      })
      describe('limits are not set to numbers', () => {
        describe('first limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when first set to ${stringify(invalidInput)}`, async () => {
              const affiliationLoader = loadAffiliationConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                first: invalidInput,
              }

              try {
                await affiliationLoader({
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(
                  new Error(`\`first\` doit être de type \`number\` et non \`${typeof invalidInput}\`.`),
                )
              }
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadAffiliationConnectionsByOrgId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(invalidInput)}`, async () => {
              const affiliationLoader = loadAffiliationConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                last: invalidInput,
              }

              try {
                await affiliationLoader({
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(
                  new Error(`\`last\` doit être de type \`number\` et non \`${typeof invalidInput}\`.`),
                )
              }
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadAffiliationConnectionsByOrgId.`,
              ])
            })
          })
        })
      })
    })
    describe('given a database error', () => {
      describe('while querying affiliations', () => {
        it('returns an error message', async () => {
          const query = jest.fn().mockRejectedValue(new Error('Unable to query organizations. Please try again.'))

          const affiliationLoader = loadAffiliationConnectionsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 5,
          }
          try {
            await affiliationLoader({ orgId: org._id, ...connectionArgs })
          } catch (err) {
            expect(err).toEqual(new Error(`Impossible de demander l'affiliation (s). Veuillez réessayer.`))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to query affiliations in loadAffiliationConnectionsByOrgId, error: Error: Unable to query organizations. Please try again.`,
          ])
        })
      })
    })
    describe('given a cursor error', () => {
      describe('while gathering affiliations', () => {
        it('returns an error message', async () => {
          const cursor = {
            next() {
              throw new Error('Unable to load affiliations. Please try again.')
            },
          }
          const query = jest.fn().mockReturnValueOnce(cursor)

          const affiliationLoader = loadAffiliationConnectionsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 5,
          }
          try {
            await affiliationLoader({ orgId: org._id, ...connectionArgs })
          } catch (err) {
            expect(err).toEqual(new Error(`Impossible de charger l'affiliation (s). Veuillez réessayer.`))
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user: ${user._key} was trying to gather affiliations in loadAffiliationConnectionsByOrgId, error: Error: Unable to load affiliations. Please try again.`,
          ])
        })
      })
    })
  })
})
