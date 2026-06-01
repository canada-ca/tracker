import { stringify } from 'jest-matcher-utils'
import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput } from '../../../validators'
import { loadAffiliationConnectionsByUserId, loadAffiliationByKey } from '..'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the load affiliations by user id function', () => {
  let query, drop, truncate, collections, user, orgOne, orgTwo, i18n

  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.error = mockedError
    console.warn = mockedWarn
  })

  afterEach(async () => {
    consoleOutput.length = 0
  })

  describe('given a successful load', () => {
    describe('given there are user affiliations to be returned', () => {
      let affOne, affTwo
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
        await truncate()
      })
      afterAll(async () => {
        await drop()
      })
      describe('using after cursor', () => {
        it('returns an affiliation', async () => {
          const affiliationLoader = loadAffiliationConnectionsByUserId({
            query,
            language: 'en',
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
            userId: user._id,
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
          const affiliationLoader = loadAffiliationConnectionsByUserId({
            query,
            language: 'en',
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const expectedAffiliations = await loadAffiliationByKey({
            query,
          }).loadMany([affOne._key, affTwo._key])

          expectedAffiliations[0].id = expectedAffiliations[0]._key
          expectedAffiliations[1].id = expectedAffiliations[1]._key

          const connectionArgs = {
            first: 5,
            before: toGlobalId('affiliation', expectedAffiliations[1].id),
          }
          const affiliations = await affiliationLoader({
            userId: user._id,
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
          const affiliationLoader = loadAffiliationConnectionsByUserId({
            query,
            language: 'en',
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const expectedAffiliations = await loadAffiliationByKey({
            query,
          }).loadMany([affOne._key, affTwo._key])

          expectedAffiliations[0].id = expectedAffiliations[0]._key
          expectedAffiliations[1].id = expectedAffiliations[1]._key

          const connectionArgs = {
            first: 1,
          }
          const affiliations = await affiliationLoader({
            userId: user._id,
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
          const affiliationLoader = loadAffiliationConnectionsByUserId({
            query,
            language: 'en',
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const expectedAffiliations = await loadAffiliationByKey({
            query,
          }).loadMany([affOne._key, affTwo._key])

          expectedAffiliations[0].id = expectedAffiliations[0]._key
          expectedAffiliations[1].id = expectedAffiliations[1]._key

          const connectionArgs = {
            last: 1,
          }
          const affiliations = await affiliationLoader({
            userId: user._id,
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
            FOR org IN organizationSearch
              SEARCH org.orgDetails.en.acronym == "TBS"
              OPTIONS { waitForSync: true }
              RETURN org
          `
        })
        describe('using english', () => {
          describe('using the orgs acronym', () => {
            it('returns the filtered affiliations', async () => {
              const affiliationLoader = loadAffiliationConnectionsByUserId({
                query,
                language: 'en',
                userKey: user._key,
                cleanseInput,
                i18n,
              })

              const expectedAffiliations = await loadAffiliationByKey({
                query,
              }).loadMany([affOne._key, affTwo._key])

              expectedAffiliations[0].id = expectedAffiliations[0]._key
              expectedAffiliations[1].id = expectedAffiliations[1]._key

              const connectionArgs = {
                first: 1,
                userId: user._id,
                search: 'TBS',
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
          describe('using the orgs name', () => {
            it('returns the filtered affiliations', async () => {
              const affiliationLoader = loadAffiliationConnectionsByUserId({
                query,
                language: 'en',
                userKey: user._key,
                cleanseInput,
                i18n,
              })

              const expectedAffiliations = await loadAffiliationByKey({
                query,
              }).loadMany([affOne._key, affTwo._key])

              expectedAffiliations[0].id = expectedAffiliations[0]._key
              expectedAffiliations[1].id = expectedAffiliations[1]._key

              const connectionArgs = {
                first: 1,
                userId: user._id,
                search: 'Treasury Board of Canada Secretariat',
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
        })
        describe('using french', () => {
          describe('using the orgs acronym', () => {
            it('returns the filtered affiliations', async () => {
              const affiliationLoader = loadAffiliationConnectionsByUserId({
                query,
                language: 'fr',
                userKey: user._key,
                cleanseInput,
                i18n,
              })

              const expectedAffiliations = await loadAffiliationByKey({
                query,
              }).loadMany([affOne._key, affTwo._key])

              expectedAffiliations[0].id = expectedAffiliations[0]._key
              expectedAffiliations[1].id = expectedAffiliations[1]._key

              const connectionArgs = {
                first: 1,
                userId: user._id,
                search: 'SCT',
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
          describe('using the orgs name', () => {
            it('returns the filtered affiliations', async () => {
              const affiliationLoader = loadAffiliationConnectionsByUserId({
                query,
                language: 'fr',
                userKey: user._key,
                cleanseInput,
                i18n,
              })

              const expectedAffiliations = await loadAffiliationByKey({
                query,
              }).loadMany([affOne._key, affTwo._key])

              expectedAffiliations[0].id = expectedAffiliations[0]._key
              expectedAffiliations[1].id = expectedAffiliations[1]._key

              const connectionArgs = {
                first: 1,
                userId: user._id,
                search: 'Secrétariat du Conseil Trésor du Canada',
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
        })
      })
      describe('using orderBy field', () => {
        let affOne, affTwo, affThree, domainOne, domainTwo, domainThree, orgOne, orgTwo, orgThree, userOne
        beforeEach(async () => {
          await truncate()
          userOne = await collections.users.save({
            userName: 'user@email.a.ca',
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
          orgTwo = await collections.organizations.save({
            verified: false,
            summaries: {
              web: {
                pass: 51,
                fail: 1001,
                total: 1052,
              },
              mail: {
                pass: 51,
                fail: 1001,
                total: 1052,
              },
            },
            orgDetails: {
              en: {
                slug: 'slug-org-b',
                acronym: 'ORG_B',
                name: 'org b',
                zone: 'zone b',
                sector: 'sector b',
                country: 'country b',
                province: 'province b',
                city: 'city b',
              },
              fr: {
                slug: 'slug-org-b',
                acronym: 'ORG_B',
                name: 'org b',
                zone: 'zone b',
                sector: 'sector b',
                country: 'country b',
                province: 'province b',
                city: 'city b',
              },
            },
          })
          orgThree = await collections.organizations.save({
            verified: false,
            summaries: {
              web: {
                pass: 52,
                fail: 1002,
                total: 1054,
              },
              mail: {
                pass: 52,
                fail: 1002,
                total: 1054,
              },
            },
            orgDetails: {
              en: {
                slug: 'slug-org-c',
                acronym: 'ORG_C',
                name: 'org c',
                zone: 'zone c',
                sector: 'sector c',
                country: 'country c',
                province: 'province c',
                city: 'city c',
              },
              fr: {
                slug: 'slug-org-c',
                acronym: 'ORG_C',
                name: 'org c',
                zone: 'zone c',
                sector: 'sector c',
                country: 'country c',
                province: 'province c',
                city: 'city c',
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
            _from: orgTwo._id,
            _to: userOne._id,
            permission: 'user',
          })
          affThree = await collections.affiliations.save({
            _key: '3',
            _from: orgThree._id,
            _to: userOne._id,
            permission: 'user',
          })
          domainOne = await collections.domains.save({
            domain: 'test.domain.gc.ca',
          })
          domainThree = await collections.domains.save({
            domain: 'test.domain.canada.gc.ca',
          })
          domainTwo = await collections.domains.save({
            domain: 'test.domain.canada.ca',
          })
          await collections.claims.save({
            _from: orgOne._id,
            _to: domainOne._id,
          })
          await collections.claims.save({
            _from: orgTwo._id,
            _to: domainOne._id,
          })
          await collections.claims.save({
            _from: orgTwo._id,
            _to: domainTwo._id,
          })
          await collections.claims.save({
            _from: orgThree._id,
            _to: domainOne._id,
          })
          await collections.claims.save({
            _from: orgThree._id,
            _to: domainTwo._id,
          })
          await collections.claims.save({
            _from: orgThree._id,
            _to: domainThree._id,
          })
        })
        describe('language is set to english', () => {
          describe('ordering by ORG_ACRONYM', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const expectedAffiliation = await loadAffiliationByKey({
                  query,
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-acronym',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-acronym',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_NAME', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const expectedAffiliation = await loadAffiliationByKey({
                  query,
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-name',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-name',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_SLUG', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const expectedAffiliation = await loadAffiliationByKey({
                  query,
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-slug',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-slug',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_ZONE', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const expectedAffiliation = await loadAffiliationByKey({
                  query,
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-zone',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-zone',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_SECTOR', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const expectedAffiliation = await loadAffiliationByKey({
                  query,
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-sector',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-sector',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_COUNTRY', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const expectedAffiliation = await loadAffiliationByKey({
                  query,
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-country',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-country',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_PROVINCE', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-province',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-province',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_CITY', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-city',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-city',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_VERIFIED', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-verified',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-verified',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_SUMMARY_MAIL_PASS', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-summary-mail-pass',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-summary-mail-pass',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_SUMMARY_MAIL_FAIL', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-summary-mail-fail',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-summary-mail-fail',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_SUMMARY_MAIL_TOTAL', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-summary-mail-total',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-summary-mail-total',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_SUMMARY_WEB_PASS', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-summary-web-pass',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-summary-web-pass',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_SUMMARY_WEB_FAIL', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-summary-web-fail',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-summary-web-fail',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_SUMMARY_WEB_TOTAL', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-summary-web-total',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-summary-web-total',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_DOMAIN_COUNT', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-domain-count',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-domain-count',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
        describe('language is set to french', () => {
          describe('ordering by ORG_ACRONYM', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-acronym',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-acronym',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_NAME', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-name',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-name',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_SLUG', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-slug',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-slug',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_ZONE', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-zone',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-zone',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_SECTOR', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-sector',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-sector',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_COUNTRY', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-country',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-country',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_PROVINCE', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-province',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-province',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_CITY', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-city',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-city',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_VERIFIED', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-verified',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                const affiliationLoader = loadAffiliationByKey({ query })

                const expectedAffiliation = await affiliationLoader.load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-verified',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_SUMMARY_MAIL_PASS', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const expectedAffiliation = await loadAffiliationByKey({
                  query,
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-summary-mail-pass',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-summary-mail-pass',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_SUMMARY_MAIL_FAIL', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const expectedAffiliation = await loadAffiliationByKey({
                  query,
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-summary-mail-fail',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-summary-mail-fail',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_SUMMARY_MAIL_TOTAL', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const expectedAffiliation = await loadAffiliationByKey({
                  query,
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-summary-mail-total',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-summary-mail-total',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_SUMMARY_WEB_PASS', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const expectedAffiliation = await loadAffiliationByKey({
                  query,
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-summary-web-pass',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-summary-web-pass',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_SUMMARY_WEB_FAIL', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const expectedAffiliation = await loadAffiliationByKey({
                  query,
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-summary-web-fail',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-summary-web-fail',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_SUMMARY_WEB_TOTAL', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const expectedAffiliation = await loadAffiliationByKey({
                  query,
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-summary-web-total',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-summary-web-total',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
          describe('ordering by ORG_DOMAIN_COUNT', () => {
            describe('direction is set to ASC', () => {
              it('returns affiliation', async () => {
                const expectedAffiliation = await loadAffiliationByKey({
                  query,
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affOne._key),
                  before: toGlobalId('affiliation', affThree._key),
                  orderBy: {
                    field: 'org-domain-count',
                    direction: 'ASC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
                }).load(affTwo._key)

                const connectionLoader = loadAffiliationConnectionsByUserId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                })

                const connectionArgs = {
                  userId: userOne._id,
                  first: 5,
                  after: toGlobalId('affiliation', affThree._key),
                  before: toGlobalId('affiliation', affOne._key),
                  orderBy: {
                    field: 'org-domain-count',
                    direction: 'DESC',
                  },
                }

                const affiliations = await connectionLoader(connectionArgs)

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
        beforeEach(async () => {
          await truncate()
        })
        it('returns no affiliations', async () => {
          const affiliationLoader = loadAffiliationConnectionsByUserId({
            query,
            language: 'en',
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 5,
          }
          const affiliations = await affiliationLoader({
            userId: user._id,
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
          const affiliationLoader = loadAffiliationConnectionsByUserId({
            query,
            language: 'en',
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 1,
            last: 1,
          }
          try {
            await affiliationLoader({
              userId: user._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error('Passing both `first` and `last` to paginate the `Affiliation` connection is not supported.'),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadAffiliationConnectionsByUserId.`,
          ])
        })
      })
      describe('neither first nor last arguments are set', () => {
        it('returns an error message', async () => {
          const affiliationLoader = loadAffiliationConnectionsByUserId({
            query,
            language: 'en',
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {}
          try {
            await affiliationLoader({
              userId: user._id,
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
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadAffiliationConnectionsByUserId.`,
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadAffiliationConnectionsByUserId({
              query,
              language: 'en',
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              first: -1,
            }

            try {
              await connectionLoader({
                userId: user._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('`first` on the `Affiliation` connection cannot be less than zero.'))
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadAffiliationConnectionsByUserId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadAffiliationConnectionsByUserId({
              query,
              language: 'en',
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              last: -2,
            }

            try {
              await connectionLoader({
                userId: user._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('`last` on the `Affiliation` connection cannot be less than zero.'))
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadAffiliationConnectionsByUserId.`,
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadAffiliationConnectionsByUserId({
              query,
              language: 'en',
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              first: 1000,
            }

            try {
              await connectionLoader({
                userId: user._id,
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
              `User: ${user._key} attempted to have \`first\` set to 1000 for: loadAffiliationConnectionsByUserId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadAffiliationConnectionsByUserId({
              query,
              language: 'en',
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              last: 200,
            }

            try {
              await connectionLoader({
                userId: user._id,
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
              `User: ${user._key} attempted to have \`last\` set to 200 for: loadAffiliationConnectionsByUserId.`,
            ])
          })
        })
      })
      describe('limits are not set to numbers', () => {
        describe('first limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when first set to ${stringify(invalidInput)}`, async () => {
              const connectionLoader = loadAffiliationConnectionsByUserId({
                query,
                language: 'en',
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
                expect(err).toEqual(new Error(`\`first\` must be of type \`number\` not \`${typeof invalidInput}\`.`))
              }
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadAffiliationConnectionsByUserId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(invalidInput)}`, async () => {
              const connectionLoader = loadAffiliationConnectionsByUserId({
                query,
                language: 'en',
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
                expect(err).toEqual(new Error(`\`last\` must be of type \`number\` not \`${typeof invalidInput}\`.`))
              }
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadAffiliationConnectionsByUserId.`,
              ])
            })
          })
        })
      })
    })
    describe('given a database error', () => {
      describe('while querying domains', () => {
        it('returns an error message', async () => {
          const query = jest.fn().mockRejectedValue(new Error('Unable to query organizations. Please try again.'))

          const affiliationLoader = loadAffiliationConnectionsByUserId({
            query,
            language: 'en',
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 5,
          }
          try {
            await affiliationLoader({
              userId: user._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('Unable to query affiliation(s). Please try again.'))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to query affiliations in loadAffiliationConnectionsByUserId, error: Error: Unable to query organizations. Please try again.`,
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
          const query = jest.fn().mockReturnValueOnce(cursor)

          const affiliationLoader = loadAffiliationConnectionsByUserId({
            query,
            language: 'en',
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 5,
          }
          try {
            await affiliationLoader({
              userId: user._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('Unable to load affiliation(s). Please try again.'))
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user: ${user._key} was trying to gather affiliations in loadAffiliationConnectionsByUserId, error: Error: Unable to load affiliations. Please try again.`,
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
    describe('given an unsuccessful load', () => {
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const affiliationLoader = loadAffiliationConnectionsByUserId({
            query,
            language: 'fr',
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 1,
            last: 1,
          }
          try {
            await affiliationLoader({
              userId: user._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                "Passer à la fois `first` et `last` pour paginer la connexion `Affiliation` n'est pas supporté.",
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadAffiliationConnectionsByUserId.`,
          ])
        })
      })
      describe('neither first nor last arguments are set', () => {
        it('returns an error message', async () => {
          const affiliationLoader = loadAffiliationConnectionsByUserId({
            query,
            language: 'fr',
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {}
          try {
            await affiliationLoader({
              userId: user._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Vous devez fournir une valeur `first` ou `last` pour paginer correctement la connexion `Affiliation`.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadAffiliationConnectionsByUserId.`,
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadAffiliationConnectionsByUserId({
              query,
              language: 'fr',
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              first: -1,
            }

            try {
              await connectionLoader({
                userId: user._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('`first` sur la connexion `Affiliation` ne peut être inférieur à zéro.'))
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadAffiliationConnectionsByUserId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadAffiliationConnectionsByUserId({
              query,
              language: 'fr',
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              last: -2,
            }

            try {
              await connectionLoader({
                userId: user._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('`last` sur la connexion `Affiliation` ne peut être inférieur à zéro.'))
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadAffiliationConnectionsByUserId.`,
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadAffiliationConnectionsByUserId({
              query,
              language: 'en',
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              first: 1000,
            }

            try {
              await connectionLoader({
                userId: user._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  "La demande d'enregistrements `1000` sur la connexion `Affiliation` dépasse la limite `first` de 100 enregistrements.",
                ),
              )
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 1000 for: loadAffiliationConnectionsByUserId.`,
            ])
          })
        })
        describe('last is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadAffiliationConnectionsByUserId({
              query,
              language: 'fr',
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              last: 200,
            }

            try {
              await connectionLoader({
                userId: user._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  "La demande d'enregistrements `200` sur la connexion `Affiliation` dépasse la limite `last` de 100 enregistrements.",
                ),
              )
            }
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 200 for: loadAffiliationConnectionsByUserId.`,
            ])
          })
        })
      })
      describe('limits are not set to numbers', () => {
        describe('first limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when first set to ${stringify(invalidInput)}`, async () => {
              const connectionLoader = loadAffiliationConnectionsByUserId({
                query,
                language: 'en',
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
                  new Error(`\`first\` doit être de type \`number\` et non \`${typeof invalidInput}\`.`),
                )
              }
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadAffiliationConnectionsByUserId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(invalidInput)}`, async () => {
              const connectionLoader = loadAffiliationConnectionsByUserId({
                query,
                language: 'en',
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
                  new Error(`\`last\` doit être de type \`number\` et non \`${typeof invalidInput}\`.`),
                )
              }
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadAffiliationConnectionsByUserId.`,
              ])
            })
          })
        })
      })
    })
    describe('given a database error', () => {
      describe('while querying domains', () => {
        it('returns an error message', async () => {
          const query = jest.fn().mockRejectedValue(new Error('Unable to query organizations. Please try again.'))

          const affiliationLoader = loadAffiliationConnectionsByUserId({
            query,
            language: 'fr',
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 5,
          }
          try {
            await affiliationLoader({ userId: user._id, ...connectionArgs })
          } catch (err) {
            expect(err).toEqual(new Error("Impossible de demander l'affiliation (s). Veuillez réessayer."))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to query affiliations in loadAffiliationConnectionsByUserId, error: Error: Unable to query organizations. Please try again.`,
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
          const query = jest.fn().mockReturnValueOnce(cursor)

          const affiliationLoader = loadAffiliationConnectionsByUserId({
            query,
            language: 'fr',
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 5,
          }
          try {
            await affiliationLoader({ userId: user._id, ...connectionArgs })
          } catch (err) {
            expect(err).toEqual(new Error("Impossible de charger l'affiliation (s). Veuillez réessayer."))
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user: ${user._key} was trying to gather affiliations in loadAffiliationConnectionsByUserId, error: Error: Unable to load affiliations. Please try again.`,
          ])
        })
      })
    })
  })
})
