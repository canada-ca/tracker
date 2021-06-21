import { stringify } from 'jest-matcher-utils'
import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { cleanseInput } from '../../../validators'
import { loadDomainConnectionsByOrgId, loadDomainByKey } from '../index'
import { toGlobalId } from 'graphql-relay'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the load domain connection using org id function', () => {
  let query, drop, truncate, collections, user, org, domain, domainTwo, i18n

  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.error = mockedError
    console.warn = mockedWarn
  })
  afterEach(() => {
    consoleOutput.length = 0
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
      domain = await collections.domains.save({
        domain: 'test.domain.gc.ca',
        lastRan: '2021-01-02 12:12:12.000000',
        selectors: ['selector1._domainkey', 'selector2._domainkey'],
        status: {
          dkim: 'pass',
          dmarc: 'pass',
          https: 'pass',
          spf: 'pass',
          ssl: 'pass',
        },
      })
      await collections.claims.save({
        _from: org._id,
        _to: domain._id,
      })
      domainTwo = await collections.domains.save({
        domain: 'test.domain.canada.ca',
        lastRan: '2021-01-01 12:12:12.000000',
        selectors: ['selector1._domainkey', 'selector2._domainkey'],
        status: {
          dkim: 'fail',
          dmarc: 'fail',
          https: 'fail',
          spf: 'fail',
          ssl: 'fail',
        },
      })
      await collections.claims.save({
        _from: org._id,
        _to: domainTwo._id,
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('using after cursor', () => {
      it('returns a domain', async () => {
        const connectionLoader = loadDomainConnectionsByOrgId({
          query,
          userKey: user._key,
          cleanseInput,
        })

        const domainLoader = loadDomainByKey({ query })
        const expectedDomains = await domainLoader.loadMany([
          domain._key,
          domainTwo._key,
        ])

        expectedDomains[0].id = expectedDomains[0]._key
        expectedDomains[1].id = expectedDomains[1]._key

        const connectionArgs = {
          first: 10,
          after: toGlobalId('domains', expectedDomains[0]._key),
        }
        const domains = await connectionLoader({
          orgId: org._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('domains', expectedDomains[1]._key),
              node: {
                ...expectedDomains[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('domains', expectedDomains[1]._key),
            endCursor: toGlobalId('domains', expectedDomains[1]._key),
          },
          totalCount: 2,
        }

        expect(domains).toEqual(expectedStructure)
      })
    })
    describe('using before cursor', () => {
      it('returns a domain', async () => {
        const connectionLoader = loadDomainConnectionsByOrgId({
          query,
          userKey: user._key,
          cleanseInput,
        })

        const domainLoader = loadDomainByKey({ query })
        const expectedDomains = await domainLoader.loadMany([
          domain._key,
          domainTwo._key,
        ])

        expectedDomains[0].id = expectedDomains[0]._key
        expectedDomains[1].id = expectedDomains[1]._key

        const connectionArgs = {
          first: 10,
          before: toGlobalId('domains', expectedDomains[1]._key),
        }
        const domains = await connectionLoader({
          orgId: org._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('domains', expectedDomains[0]._key),
              node: {
                ...expectedDomains[0],
              },
            },
          ],
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('domains', expectedDomains[0]._key),
            endCursor: toGlobalId('domains', expectedDomains[0]._key),
          },
          totalCount: 2,
        }

        expect(domains).toEqual(expectedStructure)
      })
    })
    describe('using first limit', () => {
      it('returns a domain', async () => {
        const connectionLoader = loadDomainConnectionsByOrgId({
          query,
          userKey: user._key,
          cleanseInput,
        })

        const domainLoader = loadDomainByKey({ query })
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
              cursor: toGlobalId('domains', expectedDomains[0]._key),
              node: {
                ...expectedDomains[0],
              },
            },
          ],
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('domains', expectedDomains[0]._key),
            endCursor: toGlobalId('domains', expectedDomains[0]._key),
          },
          totalCount: 2,
        }

        expect(domains).toEqual(expectedStructure)
      })
    })
    describe('using last limit', () => {
      it('returns a domain', async () => {
        const connectionLoader = loadDomainConnectionsByOrgId({
          query,
          userKey: user._key,
          cleanseInput,
        })

        const domainLoader = loadDomainByKey({ query })
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
              cursor: toGlobalId('domains', expectedDomains[1]._key),
              node: {
                ...expectedDomains[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('domains', expectedDomains[1]._key),
            endCursor: toGlobalId('domains', expectedDomains[1]._key),
          },
          totalCount: 2,
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
        const connectionLoader = loadDomainConnectionsByOrgId({
          query,
          userKey: user._key,
          cleanseInput,
        })

        const domainLoader = loadDomainByKey({ query })
        const expectedDomain = await domainLoader.load(domain._key)

        const connectionArgs = {
          first: 1,
          orgId: org._id,
          search: 'test.domain.gc.ca',
        }

        const domains = await connectionLoader({ ...connectionArgs })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('domains', expectedDomain._key),
              node: {
                ...expectedDomain,
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('domains', expectedDomain._key),
            endCursor: toGlobalId('domains', expectedDomain._key),
          },
        }

        expect(domains).toEqual(expectedStructure)
      })
    })
    describe('no domains are found', () => {
      it('returns an empty structure', async () => {
        await truncate()
        const connectionLoader = loadDomainConnectionsByOrgId({
          query,
          userKey: user._key,
          cleanseInput,
        })

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
    describe('using ownership filter', () => {
      let domainThree
      beforeEach(async () => {
        domainThree = await collections.domains.save({
          domain: 'test3.domain.canada.ca',
        })
        await collections.claims.save({
          _from: org._id,
          _to: domainThree._id,
        })
        await collections.ownership.save({
          _from: org._id,
          _to: domainThree._id,
        })
      })
      describe('ownership is set to true', () => {
        it('returns only a domain belonging to a domain that owns it', async () => {
          const connectionLoader = loadDomainConnectionsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
          })

          const domainLoader = loadDomainByKey({ query })
          const expectedDomains = await domainLoader.loadMany([
            domainThree._key,
          ])

          expectedDomains[0].id = expectedDomains[0]._key

          const connectionArgs = {
            first: 5,
          }
          const domains = await connectionLoader({
            orgId: org._id,
            ownership: true,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('domains', expectedDomains[0]._key),
                node: {
                  ...expectedDomains[0],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('domains', expectedDomains[0]._key),
              endCursor: toGlobalId('domains', expectedDomains[0]._key),
            },
            totalCount: 1,
          }

          expect(domains).toEqual(expectedStructure)
        })
      })
      describe('ownership is set to false', () => {
        it('returns all domains', async () => {
          const connectionLoader = loadDomainConnectionsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
          })

          const domainLoader = loadDomainByKey({ query })
          const expectedDomains = await domainLoader.loadMany([
            domain._key,
            domainTwo._key,
            domainThree._key,
          ])

          const connectionArgs = {
            first: 5,
          }
          const domains = await connectionLoader({
            orgId: org._id,
            ownership: false,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('domains', expectedDomains[0]._key),
                node: {
                  ...expectedDomains[0],
                },
              },
              {
                cursor: toGlobalId('domains', expectedDomains[1]._key),
                node: {
                  ...expectedDomains[1],
                },
              },
              {
                cursor: toGlobalId('domains', expectedDomains[2]._key),
                node: {
                  ...expectedDomains[2],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('domains', expectedDomains[0]._key),
              endCursor: toGlobalId('domains', expectedDomains[2]._key),
            },
            totalCount: 3,
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
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                after: toGlobalId('domains', expectedDomains[1]._key),
                orderBy: {
                  field: 'domain',
                  direction: 'ASC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[0]._key),
                    node: {
                      ...expectedDomains[0],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: true,
                  startCursor: toGlobalId('domains', expectedDomains[0]._key),
                  endCursor: toGlobalId('domains', expectedDomains[0]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
          describe('order direction is DESC', () => {
            it('returns domains in order', async () => {
              const domainLoader = loadDomainByKey({ query })
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                after: toGlobalId('domains', expectedDomains[0]._key),
                orderBy: {
                  field: 'domain',
                  direction: 'DESC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[1]._key),
                    node: {
                      ...expectedDomains[1],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: true,
                  startCursor: toGlobalId('domains', expectedDomains[1]._key),
                  endCursor: toGlobalId('domains', expectedDomains[1]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering on LAST_RAN', () => {
          describe('order direction is ASC', () => {
            it('returns domains in order', async () => {
              const domainLoader = loadDomainByKey({ query })
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                after: toGlobalId('domains', expectedDomains[1]._key),
                orderBy: {
                  field: 'last-ran',
                  direction: 'ASC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[0]._key),
                    node: {
                      ...expectedDomains[0],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: true,
                  startCursor: toGlobalId('domains', expectedDomains[0]._key),
                  endCursor: toGlobalId('domains', expectedDomains[0]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
          describe('order direction is DESC', () => {
            it('returns domains in order', async () => {
              const domainLoader = loadDomainByKey({ query })
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                after: toGlobalId('domains', expectedDomains[0]._key),
                orderBy: {
                  field: 'last-ran',
                  direction: 'DESC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[1]._key),
                    node: {
                      ...expectedDomains[1],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: true,
                  startCursor: toGlobalId('domains', expectedDomains[1]._key),
                  endCursor: toGlobalId('domains', expectedDomains[1]._key),
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
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                after: toGlobalId('domains', expectedDomains[1]._key),
                orderBy: {
                  field: 'dkim-status',
                  direction: 'ASC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[0]._key),
                    node: {
                      ...expectedDomains[0],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: true,
                  startCursor: toGlobalId('domains', expectedDomains[0]._key),
                  endCursor: toGlobalId('domains', expectedDomains[0]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
          describe('order direction is DESC', () => {
            it('returns domains in order', async () => {
              const domainLoader = loadDomainByKey({ query })
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                after: toGlobalId('domains', expectedDomains[0]._key),
                orderBy: {
                  field: 'dkim-status',
                  direction: 'DESC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[1]._key),
                    node: {
                      ...expectedDomains[1],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: true,
                  startCursor: toGlobalId('domains', expectedDomains[1]._key),
                  endCursor: toGlobalId('domains', expectedDomains[1]._key),
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
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                after: toGlobalId('domains', expectedDomains[1]._key),
                orderBy: {
                  field: 'dmarc-status',
                  direction: 'ASC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[0]._key),
                    node: {
                      ...expectedDomains[0],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: true,
                  startCursor: toGlobalId('domains', expectedDomains[0]._key),
                  endCursor: toGlobalId('domains', expectedDomains[0]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
          describe('order direction is DESC', () => {
            it('returns domains in order', async () => {
              const domainLoader = loadDomainByKey({ query })
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                after: toGlobalId('domains', expectedDomains[0]._key),
                orderBy: {
                  field: 'dmarc-status',
                  direction: 'DESC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[1]._key),
                    node: {
                      ...expectedDomains[1],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: true,
                  startCursor: toGlobalId('domains', expectedDomains[1]._key),
                  endCursor: toGlobalId('domains', expectedDomains[1]._key),
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
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                after: toGlobalId('domains', expectedDomains[1]._key),
                orderBy: {
                  field: 'https-status',
                  direction: 'ASC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[0]._key),
                    node: {
                      ...expectedDomains[0],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: true,
                  startCursor: toGlobalId('domains', expectedDomains[0]._key),
                  endCursor: toGlobalId('domains', expectedDomains[0]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
          describe('order direction is DESC', () => {
            it('returns domains in order', async () => {
              const domainLoader = loadDomainByKey({ query })
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                after: toGlobalId('domains', expectedDomains[0]._key),
                orderBy: {
                  field: 'https-status',
                  direction: 'DESC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[1]._key),
                    node: {
                      ...expectedDomains[1],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: true,
                  startCursor: toGlobalId('domains', expectedDomains[1]._key),
                  endCursor: toGlobalId('domains', expectedDomains[1]._key),
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
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                after: toGlobalId('domains', expectedDomains[1]._key),
                orderBy: {
                  field: 'spf-status',
                  direction: 'ASC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[0]._key),
                    node: {
                      ...expectedDomains[0],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: true,
                  startCursor: toGlobalId('domains', expectedDomains[0]._key),
                  endCursor: toGlobalId('domains', expectedDomains[0]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
          describe('order direction is DESC', () => {
            it('returns domains in order', async () => {
              const domainLoader = loadDomainByKey({ query })
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                after: toGlobalId('domains', expectedDomains[0]._key),
                orderBy: {
                  field: 'spf-status',
                  direction: 'DESC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[1]._key),
                    node: {
                      ...expectedDomains[1],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: true,
                  startCursor: toGlobalId('domains', expectedDomains[1]._key),
                  endCursor: toGlobalId('domains', expectedDomains[1]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering on SSL_STATUS', () => {
          describe('order direction is ASC', () => {
            it('returns domains in order', async () => {
              const domainLoader = loadDomainByKey({ query })
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                after: toGlobalId('domains', expectedDomains[1]._key),
                orderBy: {
                  field: 'ssl-status',
                  direction: 'ASC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[0]._key),
                    node: {
                      ...expectedDomains[0],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: true,
                  startCursor: toGlobalId('domains', expectedDomains[0]._key),
                  endCursor: toGlobalId('domains', expectedDomains[0]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
          describe('order direction is DESC', () => {
            it('returns domains in order', async () => {
              const domainLoader = loadDomainByKey({ query })
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                after: toGlobalId('domains', expectedDomains[0]._key),
                orderBy: {
                  field: 'ssl-status',
                  direction: 'DESC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[1]._key),
                    node: {
                      ...expectedDomains[1],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: true,
                  startCursor: toGlobalId('domains', expectedDomains[1]._key),
                  endCursor: toGlobalId('domains', expectedDomains[1]._key),
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
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                before: toGlobalId('domains', expectedDomains[0]._key),
                orderBy: {
                  field: 'domain',
                  direction: 'ASC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[1]._key),
                    node: {
                      ...expectedDomains[1],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('domains', expectedDomains[1]._key),
                  endCursor: toGlobalId('domains', expectedDomains[1]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
          describe('order direction is DESC', () => {
            it('returns domains in order', async () => {
              const domainLoader = loadDomainByKey({ query })
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                before: toGlobalId('domains', expectedDomains[1]._key),
                orderBy: {
                  field: 'domain',
                  direction: 'DESC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[0]._key),
                    node: {
                      ...expectedDomains[0],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('domains', expectedDomains[0]._key),
                  endCursor: toGlobalId('domains', expectedDomains[0]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering on LAST_RAN', () => {
          describe('order direction is ASC', () => {
            it('returns domains in order', async () => {
              const domainLoader = loadDomainByKey({ query })
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                before: toGlobalId('domains', expectedDomains[0]._key),
                orderBy: {
                  field: 'last-ran',
                  direction: 'ASC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[1]._key),
                    node: {
                      ...expectedDomains[1],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('domains', expectedDomains[1]._key),
                  endCursor: toGlobalId('domains', expectedDomains[1]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
          describe('order direction is DESC', () => {
            it('returns domains in order', async () => {
              const domainLoader = loadDomainByKey({ query })
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                before: toGlobalId('domains', expectedDomains[1]._key),
                orderBy: {
                  field: 'last-ran',
                  direction: 'DESC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[0]._key),
                    node: {
                      ...expectedDomains[0],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('domains', expectedDomains[0]._key),
                  endCursor: toGlobalId('domains', expectedDomains[0]._key),
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
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                before: toGlobalId('domains', expectedDomains[0]._key),
                orderBy: {
                  field: 'dkim-status',
                  direction: 'ASC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[1]._key),
                    node: {
                      ...expectedDomains[1],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('domains', expectedDomains[1]._key),
                  endCursor: toGlobalId('domains', expectedDomains[1]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
          describe('order direction is DESC', () => {
            it('returns domains in order', async () => {
              const domainLoader = loadDomainByKey({ query })
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                before: toGlobalId('domains', expectedDomains[1]._key),
                orderBy: {
                  field: 'dkim-status',
                  direction: 'DESC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[0]._key),
                    node: {
                      ...expectedDomains[0],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('domains', expectedDomains[0]._key),
                  endCursor: toGlobalId('domains', expectedDomains[0]._key),
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
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                before: toGlobalId('domains', expectedDomains[0]._key),
                orderBy: {
                  field: 'dmarc-status',
                  direction: 'ASC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[1]._key),
                    node: {
                      ...expectedDomains[1],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('domains', expectedDomains[1]._key),
                  endCursor: toGlobalId('domains', expectedDomains[1]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
          describe('order direction is DESC', () => {
            it('returns domains in order', async () => {
              const domainLoader = loadDomainByKey({ query })
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                before: toGlobalId('domains', expectedDomains[1]._key),
                orderBy: {
                  field: 'dmarc-status',
                  direction: 'DESC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[0]._key),
                    node: {
                      ...expectedDomains[0],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('domains', expectedDomains[0]._key),
                  endCursor: toGlobalId('domains', expectedDomains[0]._key),
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
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                before: toGlobalId('domains', expectedDomains[0]._key),
                orderBy: {
                  field: 'https-status',
                  direction: 'ASC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[1]._key),
                    node: {
                      ...expectedDomains[1],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('domains', expectedDomains[1]._key),
                  endCursor: toGlobalId('domains', expectedDomains[1]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
          describe('order direction is DESC', () => {
            it('returns domains in order', async () => {
              const domainLoader = loadDomainByKey({ query })
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                before: toGlobalId('domains', expectedDomains[1]._key),
                orderBy: {
                  field: 'https-status',
                  direction: 'DESC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[0]._key),
                    node: {
                      ...expectedDomains[0],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('domains', expectedDomains[0]._key),
                  endCursor: toGlobalId('domains', expectedDomains[0]._key),
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
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                before: toGlobalId('domains', expectedDomains[0]._key),
                orderBy: {
                  field: 'spf-status',
                  direction: 'ASC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[1]._key),
                    node: {
                      ...expectedDomains[1],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('domains', expectedDomains[1]._key),
                  endCursor: toGlobalId('domains', expectedDomains[1]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
          describe('order direction is DESC', () => {
            it('returns domains in order', async () => {
              const domainLoader = loadDomainByKey({ query })
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                before: toGlobalId('domains', expectedDomains[1]._key),
                orderBy: {
                  field: 'spf-status',
                  direction: 'DESC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[0]._key),
                    node: {
                      ...expectedDomains[0],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('domains', expectedDomains[0]._key),
                  endCursor: toGlobalId('domains', expectedDomains[0]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering on SSL_STATUS', () => {
          describe('order direction is ASC', () => {
            it('returns domains in order', async () => {
              const domainLoader = loadDomainByKey({ query })
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                before: toGlobalId('domains', expectedDomains[0]._key),
                orderBy: {
                  field: 'ssl-status',
                  direction: 'ASC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[1]._key),
                    node: {
                      ...expectedDomains[1],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('domains', expectedDomains[1]._key),
                  endCursor: toGlobalId('domains', expectedDomains[1]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
          describe('order direction is DESC', () => {
            it('returns domains in order', async () => {
              const domainLoader = loadDomainByKey({ query })
              const expectedDomains = await domainLoader.loadMany([
                domain._key,
                domainTwo._key,
              ])

              expectedDomains[0].id = expectedDomains[0]._key
              expectedDomains[1].id = expectedDomains[1]._key

              const connectionArgs = {
                first: 1,
                before: toGlobalId('domains', expectedDomains[1]._key),
                orderBy: {
                  field: 'ssl-status',
                  direction: 'DESC',
                },
              }
              const connectionLoader = loadDomainConnectionsByOrgId({
                query,
                userKey: user._key,
                cleanseInput,
              })
              const domains = await connectionLoader({
                orgId: org._id,
                ownership: false,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('domains', expectedDomains[0]._key),
                    node: {
                      ...expectedDomains[0],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('domains', expectedDomains[0]._key),
                  endCursor: toGlobalId('domains', expectedDomains[0]._key),
                },
              }

              expect(domains).toEqual(expectedStructure)
            })
          })
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
        locales: ['en', 'fr'],
        messages: {
          en: englishMessages.messages,
          fr: frenchMessages.messages,
        },
      })
    })
    describe('given an unsuccessful load', () => {
      describe('limits are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadDomainConnectionsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {}
          try {
            await connectionLoader({
              orgId: org._id,
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
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadDomainConnectionsByOrgId.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadDomainConnectionsByOrgId({
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
            await connectionLoader({
              orgId: org._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                `Passing both \`first\` and \`last\` to paginate the \`Domain\` connection is not supported.`,
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadDomainConnectionsByOrgId.`,
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDomainConnectionsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

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
                  `\`first\` on the \`Domain\` connection cannot be less than zero.`,
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadDomainConnectionsByOrgId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDomainConnectionsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

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
                  `\`last\` on the \`Domain\` connection cannot be less than zero.`,
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadDomainConnectionsByOrgId.`,
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDomainConnectionsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

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
                  `Requesting \`1000\` records on the \`Domain\` connection exceeds the \`first\` limit of 100 records.`,
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` to 1000 for: loadDomainConnectionsByOrgId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDomainConnectionsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

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
                  `Requesting \`1000\` records on the \`Domain\` connection exceeds the \`last\` limit of 100 records.`,
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` to 1000 for: loadDomainConnectionsByOrgId.`,
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
              const connectionLoader = loadDomainConnectionsByOrgId({
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
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadDomainConnectionsByOrgId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = loadDomainConnectionsByOrgId({
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
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadDomainConnectionsByOrgId.`,
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

          const connectionLoader = loadDomainConnectionsByOrgId({
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
              orgId: org._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to load domain(s). Please try again.'),
            )
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to gather domains in loadDomainConnectionsByOrgId, error: Error: Database Error Occurred.`,
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

          const connectionLoader = loadDomainConnectionsByOrgId({
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
              orgId: org._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to load domain(s). Please try again.'),
            )
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user: ${user._key} was trying to gather domains in loadDomainConnectionsByOrgId, error: Error: Cursor error occurred.`,
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
      describe('limits are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadDomainConnectionsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {}
          try {
            await connectionLoader({
              orgId: org._id,
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
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadDomainConnectionsByOrgId.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadDomainConnectionsByOrgId({
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
            await connectionLoader({
              orgId: org._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                "Passer à la fois `first` et `last` pour paginer la connexion `Domain` n'est pas supporté.",
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadDomainConnectionsByOrgId.`,
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDomainConnectionsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

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
                  '`first` sur la connexion `Domain` ne peut être inférieur à zéro.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadDomainConnectionsByOrgId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDomainConnectionsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

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
                  '`last` sur la connexion `Domain` ne peut être inférieur à zéro.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadDomainConnectionsByOrgId.`,
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDomainConnectionsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

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
                  "La demande d'enregistrements `1000` sur la connexion `Domain` dépasse la limite `first` de 100 enregistrements.",
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` to 1000 for: loadDomainConnectionsByOrgId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDomainConnectionsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

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
                  "La demande d'enregistrements `1000` sur la connexion `Domain` dépasse la limite `last` de 100 enregistrements.",
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` to 1000 for: loadDomainConnectionsByOrgId.`,
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
              const connectionLoader = loadDomainConnectionsByOrgId({
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
                  domainId: domain._id,
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
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadDomainConnectionsByOrgId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = loadDomainConnectionsByOrgId({
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
                  domainId: domain._id,
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
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadDomainConnectionsByOrgId.`,
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

          const connectionLoader = loadDomainConnectionsByOrgId({
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
              orgId: org._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Impossible de charger le(s) domaine(s). Veuillez réessayer.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to gather domains in loadDomainConnectionsByOrgId, error: Error: Database Error Occurred.`,
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

          const connectionLoader = loadDomainConnectionsByOrgId({
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
              orgId: org._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Impossible de charger le(s) domaine(s). Veuillez réessayer.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user: ${user._key} was trying to gather domains in loadDomainConnectionsByOrgId, error: Error: Cursor error occurred.`,
          ])
        })
      })
    })
  })
})
