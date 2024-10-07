import { stringify } from 'jest-matcher-utils'
import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput } from '../../../validators'
import { loadDomainConnectionsByUserId, loadDomainByKey } from '../index'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the load domain connections by user id function', () => {
  let query, drop, truncate, collections, org, i18n, user, domainOne, domainTwo

  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)

  beforeAll(() => {
    console.error = mockedError
    console.warn = mockedWarn
  })
  afterEach(() => {
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
      await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'user',
      })
      domainOne = await collections.domains.save({
        domain: 'test1.gc.ca',
        lastRan: '2021-01-01 12:12:12.000000',
        selectors: ['selector1', 'selector2'],
        status: {
          dkim: 'fail',
          dmarc: 'fail',
          https: 'fail',
          spf: 'fail',
          ssl: 'fail',
        },
      })
      domainTwo = await collections.domains.save({
        domain: 'test2.gc.ca',
        lastRan: '2021-01-02 12:12:12.000000',
        selectors: ['selector1', 'selector2'],
        status: {
          dkim: 'pass',
          dmarc: 'pass',
          https: 'pass',
          spf: 'pass',
          ssl: 'pass',
        },
      })
      await collections.claims.save({
        _to: domainOne._id,
        _from: org._id,
      })
      await collections.claims.save({
        _to: domainTwo._id,
        _from: org._id,
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('given there are domain connections to be returned', () => {
      describe('using after cursor', () => {
        it('returns a domain', async () => {
          const connectionLoader = loadDomainConnectionsByUserId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
          })

          const domainLoader = loadDomainByKey({ query })
          const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

          expectedDomains[0].id = expectedDomains[0]._key
          expectedDomains[1].id = expectedDomains[1]._key

          const connectionArgs = {
            first: 10,
            after: toGlobalId('domain', expectedDomains[0].id),
          }
          const domains = await connectionLoader({ ...connectionArgs })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('domain', expectedDomains[1]._key),
                node: {
                  ...expectedDomains[1],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId('domain', expectedDomains[1]._key),
              endCursor: toGlobalId('domain', expectedDomains[1]._key),
            },
          }

          expect(domains).toEqual(expectedStructure)
        })
      })
      describe('using before cursor', () => {
        it('returns a domain', async () => {
          const connectionLoader = loadDomainConnectionsByUserId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
          })

          const domainLoader = loadDomainByKey({ query })
          const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

          expectedDomains[0].id = expectedDomains[0]._key
          expectedDomains[1].id = expectedDomains[1]._key

          const connectionArgs = {
            first: 10,
            before: toGlobalId('domain', expectedDomains[1].id),
          }
          const domains = await connectionLoader({ ...connectionArgs })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('domain', expectedDomains[0]._key),
                node: {
                  ...expectedDomains[0],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: toGlobalId('domain', expectedDomains[0]._key),
              endCursor: toGlobalId('domain', expectedDomains[0]._key),
            },
          }

          expect(domains).toEqual(expectedStructure)
        })
      })
      describe('using first limit', () => {
        it('returns a domain', async () => {
          const connectionLoader = loadDomainConnectionsByUserId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
          })

          const domainLoader = loadDomainByKey({ query })
          const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

          expectedDomains[0].id = expectedDomains[0]._key
          expectedDomains[1].id = expectedDomains[1]._key

          const connectionArgs = {
            first: 1,
          }
          const domains = await connectionLoader({ ...connectionArgs })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('domain', expectedDomains[0]._key),
                node: {
                  ...expectedDomains[0],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: toGlobalId('domain', expectedDomains[0]._key),
              endCursor: toGlobalId('domain', expectedDomains[0]._key),
            },
          }

          expect(domains).toEqual(expectedStructure)
        })
      })
      describe('using last limit', () => {
        it('returns a domain', async () => {
          const connectionLoader = loadDomainConnectionsByUserId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
          })

          const domainLoader = loadDomainByKey({ query })
          const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

          expectedDomains[0].id = expectedDomains[0]._key
          expectedDomains[1].id = expectedDomains[1]._key

          const connectionArgs = {
            last: 1,
          }
          const domains = await connectionLoader({ ...connectionArgs })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('domain', expectedDomains[1]._key),
                node: {
                  ...expectedDomains[1],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId('domain', expectedDomains[1]._key),
              endCursor: toGlobalId('domain', expectedDomains[1]._key),
            },
          }

          expect(domains).toEqual(expectedStructure)
        })
      })
      describe('using search argument', () => {
        beforeEach(async () => {
          // This is used to sync the view before running the test below
          await query`
            FOR domain IN domainSearch
              SEARCH domain.domain == "domain"
              OPTIONS { waitForSync: true }
              RETURN domain
          `
        })
        it('returns filtered domains', async () => {
          const connectionLoader = loadDomainConnectionsByUserId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
          })

          const domainLoader = loadDomainByKey({ query })
          const expectedDomain = await domainLoader.load(domainOne._key)

          const connectionArgs = {
            first: 1,
            search: 'test1.gc.ca',
          }

          const domains = await connectionLoader({ ...connectionArgs })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('domain', expectedDomain._key),
                node: {
                  ...expectedDomain,
                },
              },
            ],
            totalCount: 1,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('domain', expectedDomain._key),
              endCursor: toGlobalId('domain', expectedDomain._key),
            },
          }

          expect(domains).toEqual(expectedStructure)
        })
      })
      describe('using ownership', () => {
        let domainThree
        beforeEach(async () => {
          domainThree = await collections.domains.save({
            domain: 'test3.gc.ca',
            lastRan: null,
            selectors: ['selector1', 'selector2'],
          })
          await collections.claims.save({
            _to: domainThree._id,
            _from: org._id,
          })
          await collections.ownership.save({
            _to: domainThree._id,
            _from: org._id,
          })
        })
        describe('ownership is set to true', () => {
          it('returns only a domain belonging to a domain that owns it', async () => {
            const connectionLoader = loadDomainConnectionsByUserId({
              query,
              userKey: user._key,
              cleanseInput,
              auth: { loginRequiredBool: true },
            })

            const domainLoader = loadDomainByKey({ query })
            const expectedDomains = await domainLoader.loadMany([domainThree._key])

            const connectionArgs = {
              first: 1,
              ownership: true,
            }
            const domains = await connectionLoader({ ...connectionArgs })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('domain', expectedDomains[0]._key),
                  node: {
                    ...expectedDomains[0],
                  },
                },
              ],
              totalCount: 1,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('domain', expectedDomains[0]._key),
                endCursor: toGlobalId('domain', expectedDomains[0]._key),
              },
            }

            expect(domains).toEqual(expectedStructure)
          })
        })
        describe('ownership is set to false', () => {
          it('returns all domains an org has claimed', async () => {
            const connectionLoader = loadDomainConnectionsByUserId({
              query,
              userKey: user._key,
              cleanseInput,
              auth: { loginRequired: true },
            })

            const domainLoader = loadDomainByKey({ query })
            const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key, domainThree._key])

            const connectionArgs = {
              first: 3,
              ownership: false,
            }
            const domains = await connectionLoader({ ...connectionArgs })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('domain', expectedDomains[0]._key),
                  node: {
                    ...expectedDomains[0],
                  },
                },
                {
                  cursor: toGlobalId('domain', expectedDomains[1]._key),
                  node: {
                    ...expectedDomains[1],
                  },
                },
                {
                  cursor: toGlobalId('domain', expectedDomains[2]._key),
                  node: {
                    ...expectedDomains[2],
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('domain', expectedDomains[0]._key),
                endCursor: toGlobalId('domain', expectedDomains[2]._key),
              },
            }

            expect(domains).toEqual(expectedStructure)
          })
        })
      })
      describe('using orderByField', () => {
        describe('using after cursor', () => {
          describe('ordering on DOMAIN', () => {
            describe('order direction is ASC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  after: toGlobalId('domain', expectedDomains[0]._key),
                  orderBy: {
                    field: 'domain',
                    direction: 'ASC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[1]._key),
                      node: {
                        ...expectedDomains[1],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('domain', expectedDomains[1]._key),
                    endCursor: toGlobalId('domain', expectedDomains[1]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
            describe('order direction is DESC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  after: toGlobalId('domain', expectedDomains[1]._key),
                  orderBy: {
                    field: 'domain',
                    direction: 'DESC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[0]._key),
                      node: {
                        ...expectedDomains[0],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('domain', expectedDomains[0]._key),
                    endCursor: toGlobalId('domain', expectedDomains[0]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on DKIM_STATUS', () => {
            describe('order direction is ASC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  after: toGlobalId('domain', expectedDomains[0]._key),
                  orderBy: {
                    field: 'dkim-status',
                    direction: 'ASC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[1]._key),
                      node: {
                        ...expectedDomains[1],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('domain', expectedDomains[1]._key),
                    endCursor: toGlobalId('domain', expectedDomains[1]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
            describe('order direction is DESC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  after: toGlobalId('domain', expectedDomains[1]._key),
                  orderBy: {
                    field: 'dkim-status',
                    direction: 'DESC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[0]._key),
                      node: {
                        ...expectedDomains[0],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('domain', expectedDomains[0]._key),
                    endCursor: toGlobalId('domain', expectedDomains[0]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on DMARC_STATUS', () => {
            describe('order direction is ASC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  after: toGlobalId('domain', expectedDomains[0]._key),
                  orderBy: {
                    field: 'dmarc-status',
                    direction: 'ASC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[1]._key),
                      node: {
                        ...expectedDomains[1],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('domain', expectedDomains[1]._key),
                    endCursor: toGlobalId('domain', expectedDomains[1]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
            describe('order direction is DESC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  after: toGlobalId('domain', expectedDomains[1]._key),
                  orderBy: {
                    field: 'dmarc-status',
                    direction: 'DESC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[0]._key),
                      node: {
                        ...expectedDomains[0],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('domain', expectedDomains[0]._key),
                    endCursor: toGlobalId('domain', expectedDomains[0]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on HTTPS_STATUS', () => {
            describe('order direction is ASC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  after: toGlobalId('domain', expectedDomains[0]._key),
                  orderBy: {
                    field: 'https-status',
                    direction: 'ASC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[1]._key),
                      node: {
                        ...expectedDomains[1],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('domain', expectedDomains[1]._key),
                    endCursor: toGlobalId('domain', expectedDomains[1]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
            describe('order direction is DESC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  after: toGlobalId('domain', expectedDomains[1]._key),
                  orderBy: {
                    field: 'https-status',
                    direction: 'DESC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[0]._key),
                      node: {
                        ...expectedDomains[0],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('domain', expectedDomains[0]._key),
                    endCursor: toGlobalId('domain', expectedDomains[0]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on SPF_STATUS', () => {
            describe('order direction is ASC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  after: toGlobalId('domain', expectedDomains[0]._key),
                  orderBy: {
                    field: 'spf-status',
                    direction: 'ASC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[1]._key),
                      node: {
                        ...expectedDomains[1],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('domain', expectedDomains[1]._key),
                    endCursor: toGlobalId('domain', expectedDomains[1]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
            describe('order direction is DESC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  after: toGlobalId('domain', expectedDomains[1]._key),
                  orderBy: {
                    field: 'spf-status',
                    direction: 'DESC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[0]._key),
                      node: {
                        ...expectedDomains[0],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('domain', expectedDomains[0]._key),
                    endCursor: toGlobalId('domain', expectedDomains[0]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
          })
        })
        describe('using before cursor', () => {
          describe('ordering on DOMAIN', () => {
            describe('order direction is ASC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  before: toGlobalId('domain', expectedDomains[1]._key),
                  orderBy: {
                    field: 'domain',
                    direction: 'ASC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[0]._key),
                      node: {
                        ...expectedDomains[0],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: false,
                    startCursor: toGlobalId('domain', expectedDomains[0]._key),
                    endCursor: toGlobalId('domain', expectedDomains[0]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
            describe('order direction is DESC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  before: toGlobalId('domain', expectedDomains[0]._key),
                  orderBy: {
                    field: 'domain',
                    direction: 'DESC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[1]._key),
                      node: {
                        ...expectedDomains[1],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: false,
                    startCursor: toGlobalId('domain', expectedDomains[1]._key),
                    endCursor: toGlobalId('domain', expectedDomains[1]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on DKIM_STATUS', () => {
            describe('order direction is ASC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  before: toGlobalId('domain', expectedDomains[1]._key),
                  orderBy: {
                    field: 'dkim-status',
                    direction: 'ASC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[0]._key),
                      node: {
                        ...expectedDomains[0],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: false,
                    startCursor: toGlobalId('domain', expectedDomains[0]._key),
                    endCursor: toGlobalId('domain', expectedDomains[0]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
            describe('order direction is DESC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  before: toGlobalId('domain', expectedDomains[0]._key),
                  orderBy: {
                    field: 'dkim-status',
                    direction: 'DESC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[1]._key),
                      node: {
                        ...expectedDomains[1],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: false,
                    startCursor: toGlobalId('domain', expectedDomains[1]._key),
                    endCursor: toGlobalId('domain', expectedDomains[1]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on DMARC_STATUS', () => {
            describe('order direction is ASC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  before: toGlobalId('domain', expectedDomains[1]._key),
                  orderBy: {
                    field: 'dmarc-status',
                    direction: 'ASC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[0]._key),
                      node: {
                        ...expectedDomains[0],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: false,
                    startCursor: toGlobalId('domain', expectedDomains[0]._key),
                    endCursor: toGlobalId('domain', expectedDomains[0]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
            describe('order direction is DESC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  before: toGlobalId('domain', expectedDomains[0]._key),
                  orderBy: {
                    field: 'dmarc-status',
                    direction: 'DESC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[1]._key),
                      node: {
                        ...expectedDomains[1],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: false,
                    startCursor: toGlobalId('domain', expectedDomains[1]._key),
                    endCursor: toGlobalId('domain', expectedDomains[1]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on HTTPS_STATUS', () => {
            describe('order direction is ASC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  before: toGlobalId('domain', expectedDomains[1]._key),
                  orderBy: {
                    field: 'https-status',
                    direction: 'ASC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[0]._key),
                      node: {
                        ...expectedDomains[0],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: false,
                    startCursor: toGlobalId('domain', expectedDomains[0]._key),
                    endCursor: toGlobalId('domain', expectedDomains[0]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
            describe('order direction is DESC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  before: toGlobalId('domain', expectedDomains[0]._key),
                  orderBy: {
                    field: 'https-status',
                    direction: 'DESC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[1]._key),
                      node: {
                        ...expectedDomains[1],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: false,
                    startCursor: toGlobalId('domain', expectedDomains[1]._key),
                    endCursor: toGlobalId('domain', expectedDomains[1]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on SPF_STATUS', () => {
            describe('order direction is ASC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  before: toGlobalId('domain', expectedDomains[1]._key),
                  orderBy: {
                    field: 'spf-status',
                    direction: 'ASC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[0]._key),
                      node: {
                        ...expectedDomains[0],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: false,
                    startCursor: toGlobalId('domain', expectedDomains[0]._key),
                    endCursor: toGlobalId('domain', expectedDomains[0]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
            describe('order direction is DESC', () => {
              it('returns domains in order', async () => {
                const domainLoader = loadDomainByKey({ query })
                const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

                expectedDomains[0].id = expectedDomains[0]._key
                expectedDomains[1].id = expectedDomains[1]._key

                const connectionArgs = {
                  first: 1,
                  before: toGlobalId('domain', expectedDomains[0]._key),
                  orderBy: {
                    field: 'spf-status',
                    direction: 'DESC',
                  },
                }
                const connectionLoader = loadDomainConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                })
                const domains = await connectionLoader({ ...connectionArgs })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('domain', expectedDomains[1]._key),
                      node: {
                        ...expectedDomains[1],
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: false,
                    startCursor: toGlobalId('domain', expectedDomains[1]._key),
                    endCursor: toGlobalId('domain', expectedDomains[1]._key),
                  },
                }

                expect(domains).toEqual(expectedStructure)
              })
            })
          })
        })
      })
      describe('isSuperAdmin is set to true', () => {
        it('returns a domain', async () => {
          const connectionLoader = loadDomainConnectionsByUserId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
          })

          const connectionArgs = {
            first: 10,
            isSuperAdmin: true,
          }
          const domains = await connectionLoader({ ...connectionArgs })

          const domainLoader = loadDomainByKey({ query })
          const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

          expectedDomains[0].id = expectedDomains[0]._key
          expectedDomains[1].id = expectedDomains[1]._key

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('domain', expectedDomains[0]._key),
                node: {
                  ...expectedDomains[0],
                },
              },
              {
                cursor: toGlobalId('domain', expectedDomains[1]._key),
                node: {
                  ...expectedDomains[1],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('domain', expectedDomains[0]._key),
              endCursor: toGlobalId('domain', expectedDomains[1]._key),
            },
          }

          expect(domains).toEqual(expectedStructure)
        })
      })
      describe('isAffiliated is set to true', () => {
        it('returns a domain', async () => {
          const connectionLoader = loadDomainConnectionsByUserId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
          })

          const connectionArgs = {
            first: 10,
            isAffiliated: true,
          }
          const domains = await connectionLoader({ ...connectionArgs })

          const domainLoader = loadDomainByKey({ query })
          const expectedDomains = await domainLoader.loadMany([domainOne._key, domainTwo._key])

          expectedDomains[0].id = expectedDomains[0]._key
          expectedDomains[1].id = expectedDomains[1]._key

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('domain', expectedDomains[0]._key),
                node: {
                  ...expectedDomains[0],
                },
              },
              {
                cursor: toGlobalId('domain', expectedDomains[1]._key),
                node: {
                  ...expectedDomains[1],
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('domain', expectedDomains[0]._key),
              endCursor: toGlobalId('domain', expectedDomains[1]._key),
            },
          }

          expect(domains).toEqual(expectedStructure)
        })
      })
    })
    describe('given there are no domain connections to be returned', () => {
      it('returns no domain connections', async () => {
        await truncate()

        const connectionLoader = loadDomainConnectionsByUserId({
          query,
          userKey: user._key,
          cleanseInput,
          auth: { loginRequired: true },
        })

        const connectionArgs = {
          first: 10,
        }
        const domains = await connectionLoader({ ...connectionArgs })

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
        messages: {
          en: englishMessages.messages,
          fr: frenchMessages.messages,
        },
      })
    })
    describe('given an unsuccessful load', () => {
      describe('first and last arguments are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadDomainConnectionsByUserId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
            i18n,
          })

          const connectionArgs = {}
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                `You must provide a \`first\` or \`last\` value to properly paginate the \`Domain\` connection.`,
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadDomainConnectionsByUserId.`,
          ])
        })
      })
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadDomainConnectionsByUserId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
            i18n,
          })

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
              new Error(`Passing both \`first\` and \`last\` to paginate the \`Domain\` connection is not supported.`),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadDomainConnectionsByUserId.`,
          ])
        })
      })
      describe('first or last argument exceeds maximum', () => {
        describe('first argument set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDomainConnectionsByUserId({
              query,
              userKey: user._key,
              cleanseInput,
              auth: { loginRequired: true },
              i18n,
            })

            const connectionArgs = {
              first: 1000,
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting `1000` records on the `Domain` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 1000 for: loadDomainConnectionsByUserId.`,
            ])
          })
        })
        describe('last argument set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDomainConnectionsByUserId({
              query,
              userKey: user._key,
              cleanseInput,
              auth: { loginRequired: true },
              i18n,
            })

            const connectionArgs = {
              last: 1000,
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting `1000` records on the `Domain` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 1000 for: loadDomainConnectionsByUserId.`,
            ])
          })
        })
      })
      describe('first or last argument exceeds minimum', () => {
        describe('first argument set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDomainConnectionsByUserId({
              query,
              userKey: user._key,
              cleanseInput,
              auth: { loginRequired: true },
              i18n,
            })

            const connectionArgs = {
              first: -1,
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error(`\`first\` on the \`Domain\` connection cannot be less than zero.`))
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadDomainConnectionsByUserId.`,
            ])
          })
        })
        describe('last argument set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDomainConnectionsByUserId({
              query,
              userKey: user._key,
              cleanseInput,
              auth: { loginRequired: true },
              i18n,
            })

            const connectionArgs = {
              last: -1,
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error(`\`last\` on the \`Domain\` connection cannot be less than zero.`))
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadDomainConnectionsByUserId.`,
            ])
          })
        })
      })
      describe('limits are not set to numbers', () => {
        describe('first limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when first set to ${stringify(invalidInput)}`, async () => {
              const connectionLoader = loadDomainConnectionsByUserId({
                query,
                userKey: user._key,
                cleanseInput,
                auth: { loginRequired: true },
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
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadDomainConnectionsByUserId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(invalidInput)}`, async () => {
              const connectionLoader = loadDomainConnectionsByUserId({
                query,
                userKey: user._key,
                cleanseInput,
                auth: { loginRequired: true },
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
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadDomainConnectionsByUserId.`,
              ])
            })
          })
        })
      })
    })
    describe('given a database error', () => {
      describe('while querying for domain information', () => {
        it('returns an error message', async () => {
          const query = jest.fn().mockRejectedValue(new Error('Unable to query domains. Please try again.'))

          const connectionLoader = loadDomainConnectionsByUserId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
            i18n,
          })

          const connectionArgs = {
            first: 50,
          }
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('Unable to query domain(s). Please try again.'))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to query domains in loadDomainsByUser, error: Error: Unable to query domains. Please try again.`,
          ])
        })
      })
    })
    describe('given a cursor error', () => {
      describe('while gathering domains', () => {
        it('returns an error message', async () => {
          const cursor = {
            next() {
              throw new Error('Unable to load domains. Please try again.')
            },
          }
          const query = jest.fn().mockReturnValueOnce(cursor)

          const connectionLoader = loadDomainConnectionsByUserId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
            i18n,
          })

          const connectionArgs = {
            first: 50,
          }
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('Unable to load domain(s). Please try again.'))
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user: ${user._key} was trying to gather domains in loadDomainsByUser, error: Error: Unable to load domains. Please try again.`,
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
      describe('first and last arguments are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadDomainConnectionsByUserId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
            i18n,
          })

          const connectionArgs = {}
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Vous devez fournir une valeur `first` ou `last` pour paginer correctement la connexion `Domain`.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadDomainConnectionsByUserId.`,
          ])
        })
      })
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadDomainConnectionsByUserId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
            i18n,
          })

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
              new Error("Passer à la fois `first` et `last` pour paginer la connexion `Domain` n'est pas supporté."),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadDomainConnectionsByUserId.`,
          ])
        })
      })
      describe('first or last argument exceeds maximum', () => {
        describe('first argument set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDomainConnectionsByUserId({
              query,
              userKey: user._key,
              cleanseInput,
              auth: { loginRequired: true },
              i18n,
            })

            const connectionArgs = {
              first: 1000,
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  "La demande d'enregistrements `1000` sur la connexion `Domain` dépasse la limite `first` de 100 enregistrements.",
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 1000 for: loadDomainConnectionsByUserId.`,
            ])
          })
        })
        describe('last argument set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDomainConnectionsByUserId({
              query,
              userKey: user._key,
              cleanseInput,
              auth: { loginRequired: true },
              i18n,
            })

            const connectionArgs = {
              last: 1000,
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  "La demande d'enregistrements `1000` sur la connexion `Domain` dépasse la limite `last` de 100 enregistrements.",
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 1000 for: loadDomainConnectionsByUserId.`,
            ])
          })
        })
      })
      describe('first or last argument exceeds minimum', () => {
        describe('first argument set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDomainConnectionsByUserId({
              query,
              userKey: user._key,
              cleanseInput,
              auth: { loginRequired: true },
              i18n,
            })

            const connectionArgs = {
              first: -1,
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('`first` sur la connexion `Domain` ne peut être inférieur à zéro.'))
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadDomainConnectionsByUserId.`,
            ])
          })
        })
        describe('last argument set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDomainConnectionsByUserId({
              query,
              userKey: user._key,
              cleanseInput,
              auth: { loginRequired: true },
              i18n,
            })

            const connectionArgs = {
              last: -1,
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('`last` sur la connexion `Domain` ne peut être inférieur à zéro.'))
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadDomainConnectionsByUserId.`,
            ])
          })
        })
      })
      describe('limits are not set to numbers', () => {
        describe('first limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when first set to ${stringify(invalidInput)}`, async () => {
              const connectionLoader = loadDomainConnectionsByUserId({
                query,
                userKey: user._key,
                cleanseInput,
                auth: { loginRequired: true },
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
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadDomainConnectionsByUserId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(invalidInput)}`, async () => {
              const connectionLoader = loadDomainConnectionsByUserId({
                query,
                userKey: user._key,
                cleanseInput,
                auth: { loginRequired: true },
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
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadDomainConnectionsByUserId.`,
              ])
            })
          })
        })
      })
    })
    describe('given a database error', () => {
      describe('while querying domains', () => {
        it('returns an error message', async () => {
          const query = jest.fn().mockRejectedValue(new Error('Unable to query domains. Please try again.'))

          const connectionLoader = loadDomainConnectionsByUserId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
            i18n,
          })

          const connectionArgs = {
            first: 50,
          }
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error("Impossible d'interroger le(s) domaine(s). Veuillez réessayer."))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to query domains in loadDomainsByUser, error: Error: Unable to query domains. Please try again.`,
          ])
        })
      })
    })
    describe('given a cursor error', () => {
      describe('while gathering domains', () => {
        it('returns an error message', async () => {
          const cursor = {
            next() {
              throw new Error('Unable to load domains. Please try again.')
            },
          }
          const query = jest.fn().mockReturnValueOnce(cursor)

          const connectionLoader = loadDomainConnectionsByUserId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
            i18n,
          })

          const connectionArgs = {
            first: 50,
          }
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('Impossible de charger le(s) domaine(s). Veuillez réessayer.'))
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user: ${user._key} was trying to gather domains in loadDomainsByUser, error: Error: Unable to load domains. Please try again.`,
          ])
        })
      })
    })
  })
})
