import { setupI18n } from '@lingui/core'
import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { stringify } from 'jest-matcher-utils'
import { toGlobalId } from 'graphql-relay'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput } from '../../../validators'
import { loadVerifiedDomainConnectionsByOrgId, loadVerifiedDomainByKey } from '../../loaders'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadVerifiedDomainConnectionsByOrgId function', () => {
  let query, drop, truncate, collections, user, org, domain, domainTwo, i18n
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
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('using after cursor', () => {
      it('returns a domain', async () => {
        const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
          query,
          cleanseInput,
        })

        const domainLoader = loadVerifiedDomainByKey({ query })
        const expectedDomains = await domainLoader.loadMany([domain._key, domainTwo._key])

        expectedDomains[0].id = expectedDomains[0]._key
        expectedDomains[1].id = expectedDomains[1]._key

        const connectionArgs = {
          first: 10,
          after: toGlobalId('verifiedDomain', expectedDomains[0]._key),
        }
        const domains = await connectionLoader({
          orgId: org._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('verifiedDomain', expectedDomains[1]._key),
              node: {
                ...expectedDomains[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('verifiedDomain', expectedDomains[1]._key),
            endCursor: toGlobalId('verifiedDomain', expectedDomains[1]._key),
          },
          totalCount: 2,
        }

        expect(domains).toEqual(expectedStructure)
      })
    })
    describe('using before cursor', () => {
      it('returns a domain', async () => {
        const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
          query,
          cleanseInput,
        })

        const domainLoader = loadVerifiedDomainByKey({ query })
        const expectedDomains = await domainLoader.loadMany([domain._key, domainTwo._key])

        expectedDomains[0].id = expectedDomains[0]._key
        expectedDomains[1].id = expectedDomains[1]._key

        const connectionArgs = {
          first: 10,
          before: toGlobalId('verifiedDomain', expectedDomains[1]._key),
        }
        const domains = await connectionLoader({
          orgId: org._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('verifiedDomain', expectedDomains[0]._key),
              node: {
                ...expectedDomains[0],
              },
            },
          ],
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('verifiedDomain', expectedDomains[0]._key),
            endCursor: toGlobalId('verifiedDomain', expectedDomains[0]._key),
          },
          totalCount: 2,
        }

        expect(domains).toEqual(expectedStructure)
      })
    })
    describe('using first limit', () => {
      it('returns a domain', async () => {
        const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
          query,
          cleanseInput,
        })

        const domainLoader = loadVerifiedDomainByKey({ query })
        const expectedDomains = await domainLoader.loadMany([domain._key, domainTwo._key])

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
              cursor: toGlobalId('verifiedDomain', expectedDomains[0]._key),
              node: {
                ...expectedDomains[0],
              },
            },
          ],
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('verifiedDomain', expectedDomains[0]._key),
            endCursor: toGlobalId('verifiedDomain', expectedDomains[0]._key),
          },
          totalCount: 2,
        }

        expect(domains).toEqual(expectedStructure)
      })
    })
    describe('using last limit', () => {
      it('returns a domain', async () => {
        const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
          query,
          cleanseInput,
        })

        const domainLoader = loadVerifiedDomainByKey({ query })
        const expectedDomains = await domainLoader.loadMany([domain._key, domainTwo._key])

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
              cursor: toGlobalId('verifiedDomain', expectedDomains[1]._key),
              node: {
                ...expectedDomains[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('verifiedDomain', expectedDomains[1]._key),
            endCursor: toGlobalId('verifiedDomain', expectedDomains[1]._key),
          },
          totalCount: 2,
        }

        expect(domains).toEqual(expectedStructure)
      })
    })
    describe('using the orderBy field', () => {
      let domainOne, domainTwo, domainThree
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
        domainOne = await collections.domains.save({
          domain: 'test.domain.gc.a.ca',
          status: {
            dkim: 'fail',
            dmarc: 'fail',
            https: 'fail',
            spf: 'fail',
            ssl: 'fail',
          },
          lastRan: '2021-01-01 12:12:12.000000',
        })
        domainTwo = await collections.domains.save({
          domain: 'test.domain.gc.b.ca',
          status: {
            dkim: 'info',
            dmarc: 'info',
            https: 'info',
            spf: 'info',
            ssl: 'info',
          },
          lastRan: '2021-01-02 12:12:12.000000',
        })
        domainThree = await collections.domains.save({
          domain: 'test.domain.gc.c.ca',
          status: {
            dkim: 'pass',
            dmarc: 'pass',
            https: 'pass',
            spf: 'pass',
            ssl: 'pass',
          },
          lastRan: '2021-01-03 12:12:12.000000',
        })
        await collections.claims.save({
          _from: org._id,
          _to: domainOne._id,
        })
        await collections.claims.save({
          _from: org._id,
          _to: domainTwo._id,
        })
        await collections.claims.save({
          _from: org._id,
          _to: domainThree._id,
        })
      })
      describe('ordering on DOMAIN', () => {
        describe('direction is ASC', () => {
          it('returns domains in order', async () => {
            const domainLoader = loadVerifiedDomainByKey({ query })
            const expectedDomain = await domainLoader.load(domainTwo._key)

            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
              cleanseInput,
            })

            const connectionArgs = {
              orgId: org._id,
              first: 5,
              after: toGlobalId('verifiedDomain', domainOne._key),
              before: toGlobalId('verifiedDomain', domainThree._key),
              orderBy: {
                field: 'domain',
                direction: 'ASC',
              },
            }

            const domains = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('verifiedDomain', domainTwo._key),
                  node: {
                    ...expectedDomain,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('verifiedDomain', domainTwo._key),
                endCursor: toGlobalId('verifiedDomain', domainTwo._key),
              },
            }

            expect(domains).toEqual(expectedStructure)
          })
        })
        describe('direction is DESC', () => {
          it('returns domains in order', async () => {
            const domainLoader = loadVerifiedDomainByKey({ query })
            const expectedDomain = await domainLoader.load(domainTwo._key)

            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
              cleanseInput,
            })

            const connectionArgs = {
              orgId: org._id,
              first: 5,
              after: toGlobalId('verifiedDomain', domainThree._key),
              before: toGlobalId('verifiedDomain', domainOne._key),
              orderBy: {
                field: 'domain',
                direction: 'DESC',
              },
            }

            const domains = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('verifiedDomain', domainTwo._key),
                  node: {
                    ...expectedDomain,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('verifiedDomain', domainTwo._key),
                endCursor: toGlobalId('verifiedDomain', domainTwo._key),
              },
            }

            expect(domains).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on LAST_RAN', () => {
        describe('direction is ASC', () => {
          it('returns domains in order', async () => {
            const domainLoader = loadVerifiedDomainByKey({ query })
            const expectedDomain = await domainLoader.load(domainTwo._key)

            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
              cleanseInput,
            })

            const connectionArgs = {
              orgId: org._id,
              first: 5,
              after: toGlobalId('verifiedDomain', domainOne._key),
              before: toGlobalId('verifiedDomain', domainThree._key),
              orderBy: {
                field: 'last-ran',
                direction: 'ASC',
              },
            }

            const domains = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('verifiedDomain', domainTwo._key),
                  node: {
                    ...expectedDomain,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('verifiedDomain', domainTwo._key),
                endCursor: toGlobalId('verifiedDomain', domainTwo._key),
              },
            }

            expect(domains).toEqual(expectedStructure)
          })
        })
        describe('direction is DESC', () => {
          it('returns domains in order', async () => {
            const domainLoader = loadVerifiedDomainByKey({ query })
            const expectedDomain = await domainLoader.load(domainTwo._key)

            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
              cleanseInput,
            })

            const connectionArgs = {
              orgId: org._id,
              first: 5,
              after: toGlobalId('verifiedDomain', domainThree._key),
              before: toGlobalId('verifiedDomain', domainOne._key),
              orderBy: {
                field: 'last-ran',
                direction: 'DESC',
              },
            }

            const domains = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('verifiedDomain', domainTwo._key),
                  node: {
                    ...expectedDomain,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('verifiedDomain', domainTwo._key),
                endCursor: toGlobalId('verifiedDomain', domainTwo._key),
              },
            }

            expect(domains).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on DKIM_STATUS', () => {
        describe('direction is ASC', () => {
          it('returns domains in order', async () => {
            const domainLoader = loadVerifiedDomainByKey({ query })
            const expectedDomain = await domainLoader.load(domainTwo._key)

            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
              cleanseInput,
            })

            const connectionArgs = {
              orgId: org._id,
              first: 5,
              after: toGlobalId('verifiedDomain', domainOne._key),
              before: toGlobalId('verifiedDomain', domainThree._key),
              orderBy: {
                field: 'dkim-status',
                direction: 'ASC',
              },
            }

            const domains = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('verifiedDomain', domainTwo._key),
                  node: {
                    ...expectedDomain,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('verifiedDomain', domainTwo._key),
                endCursor: toGlobalId('verifiedDomain', domainTwo._key),
              },
            }

            expect(domains).toEqual(expectedStructure)
          })
        })
        describe('direction is DESC', () => {
          it('returns domains in order', async () => {
            const domainLoader = loadVerifiedDomainByKey({ query })
            const expectedDomain = await domainLoader.load(domainTwo._key)

            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
              cleanseInput,
            })

            const connectionArgs = {
              orgId: org._id,
              first: 5,
              after: toGlobalId('verifiedDomain', domainThree._key),
              before: toGlobalId('verifiedDomain', domainOne._key),
              orderBy: {
                field: 'dkim-status',
                direction: 'DESC',
              },
            }

            const domains = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('verifiedDomain', domainTwo._key),
                  node: {
                    ...expectedDomain,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('verifiedDomain', domainTwo._key),
                endCursor: toGlobalId('verifiedDomain', domainTwo._key),
              },
            }

            expect(domains).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on DMARC_STATUS', () => {
        describe('direction is ASC', () => {
          it('returns domains in order', async () => {
            const domainLoader = loadVerifiedDomainByKey({ query })
            const expectedDomain = await domainLoader.load(domainTwo._key)

            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
              cleanseInput,
            })

            const connectionArgs = {
              orgId: org._id,
              first: 5,
              after: toGlobalId('verifiedDomain', domainOne._key),
              before: toGlobalId('verifiedDomain', domainThree._key),
              orderBy: {
                field: 'dmarc-status',
                direction: 'ASC',
              },
            }

            const domains = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('verifiedDomain', domainTwo._key),
                  node: {
                    ...expectedDomain,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('verifiedDomain', domainTwo._key),
                endCursor: toGlobalId('verifiedDomain', domainTwo._key),
              },
            }

            expect(domains).toEqual(expectedStructure)
          })
        })
        describe('direction is DESC', () => {
          it('returns domains in order', async () => {
            const domainLoader = loadVerifiedDomainByKey({ query })
            const expectedDomain = await domainLoader.load(domainTwo._key)

            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
              cleanseInput,
            })

            const connectionArgs = {
              orgId: org._id,
              first: 5,
              after: toGlobalId('verifiedDomain', domainThree._key),
              before: toGlobalId('verifiedDomain', domainOne._key),
              orderBy: {
                field: 'dmarc-status',
                direction: 'DESC',
              },
            }

            const domains = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('verifiedDomain', domainTwo._key),
                  node: {
                    ...expectedDomain,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('verifiedDomain', domainTwo._key),
                endCursor: toGlobalId('verifiedDomain', domainTwo._key),
              },
            }

            expect(domains).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on HTTPS_STATUS', () => {
        describe('direction is ASC', () => {
          it('returns domains in order', async () => {
            const domainLoader = loadVerifiedDomainByKey({ query })
            const expectedDomain = await domainLoader.load(domainTwo._key)

            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
              cleanseInput,
            })

            const connectionArgs = {
              orgId: org._id,
              first: 5,
              after: toGlobalId('verifiedDomain', domainOne._key),
              before: toGlobalId('verifiedDomain', domainThree._key),
              orderBy: {
                field: 'https-status',
                direction: 'ASC',
              },
            }

            const domains = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('verifiedDomain', domainTwo._key),
                  node: {
                    ...expectedDomain,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('verifiedDomain', domainTwo._key),
                endCursor: toGlobalId('verifiedDomain', domainTwo._key),
              },
            }

            expect(domains).toEqual(expectedStructure)
          })
        })
        describe('direction is DESC', () => {
          it('returns domains in order', async () => {
            const domainLoader = loadVerifiedDomainByKey({ query })
            const expectedDomain = await domainLoader.load(domainTwo._key)

            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
              cleanseInput,
            })

            const connectionArgs = {
              orgId: org._id,
              first: 5,
              after: toGlobalId('verifiedDomain', domainThree._key),
              before: toGlobalId('verifiedDomain', domainOne._key),
              orderBy: {
                field: 'https-status',
                direction: 'DESC',
              },
            }

            const domains = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('verifiedDomain', domainTwo._key),
                  node: {
                    ...expectedDomain,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('verifiedDomain', domainTwo._key),
                endCursor: toGlobalId('verifiedDomain', domainTwo._key),
              },
            }

            expect(domains).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on SPF_STATUS', () => {
        describe('direction is ASC', () => {
          it('returns domains in order', async () => {
            const domainLoader = loadVerifiedDomainByKey({ query })
            const expectedDomain = await domainLoader.load(domainTwo._key)

            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
              cleanseInput,
            })

            const connectionArgs = {
              orgId: org._id,
              first: 5,
              after: toGlobalId('verifiedDomain', domainOne._key),
              before: toGlobalId('verifiedDomain', domainThree._key),
              orderBy: {
                field: 'spf-status',
                direction: 'ASC',
              },
            }

            const domains = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('verifiedDomain', domainTwo._key),
                  node: {
                    ...expectedDomain,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('verifiedDomain', domainTwo._key),
                endCursor: toGlobalId('verifiedDomain', domainTwo._key),
              },
            }

            expect(domains).toEqual(expectedStructure)
          })
        })
        describe('direction is DESC', () => {
          it('returns domains in order', async () => {
            const domainLoader = loadVerifiedDomainByKey({ query })
            const expectedDomain = await domainLoader.load(domainTwo._key)

            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
              cleanseInput,
            })

            const connectionArgs = {
              orgId: org._id,
              first: 5,
              after: toGlobalId('verifiedDomain', domainThree._key),
              before: toGlobalId('verifiedDomain', domainOne._key),
              orderBy: {
                field: 'spf-status',
                direction: 'DESC',
              },
            }

            const domains = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('verifiedDomain', domainTwo._key),
                  node: {
                    ...expectedDomain,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('verifiedDomain', domainTwo._key),
                endCursor: toGlobalId('verifiedDomain', domainTwo._key),
              },
            }

            expect(domains).toEqual(expectedStructure)
          })
        })
      })
      describe('ordering on SSL_STATUS', () => {
        describe('direction is ASC', () => {
          it('returns domains in order', async () => {
            const domainLoader = loadVerifiedDomainByKey({ query })
            const expectedDomain = await domainLoader.load(domainTwo._key)

            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
              cleanseInput,
            })

            const connectionArgs = {
              orgId: org._id,
              first: 5,
              after: toGlobalId('verifiedDomain', domainOne._key),
              before: toGlobalId('verifiedDomain', domainThree._key),
              orderBy: {
                field: 'ssl-status',
                direction: 'ASC',
              },
            }

            const domains = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('verifiedDomain', domainTwo._key),
                  node: {
                    ...expectedDomain,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('verifiedDomain', domainTwo._key),
                endCursor: toGlobalId('verifiedDomain', domainTwo._key),
              },
            }

            expect(domains).toEqual(expectedStructure)
          })
        })
        describe('direction is DESC', () => {
          it('returns domains in order', async () => {
            const domainLoader = loadVerifiedDomainByKey({ query })
            const expectedDomain = await domainLoader.load(domainTwo._key)

            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
              cleanseInput,
            })

            const connectionArgs = {
              orgId: org._id,
              first: 5,
              after: toGlobalId('verifiedDomain', domainThree._key),
              before: toGlobalId('verifiedDomain', domainOne._key),
              orderBy: {
                field: 'ssl-status',
                direction: 'DESC',
              },
            }

            const domains = await connectionLoader(connectionArgs)

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('verifiedDomain', domainTwo._key),
                  node: {
                    ...expectedDomain,
                  },
                },
              ],
              totalCount: 3,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
                startCursor: toGlobalId('verifiedDomain', domainTwo._key),
                endCursor: toGlobalId('verifiedDomain', domainTwo._key),
              },
            }

            expect(domains).toEqual(expectedStructure)
          })
        })
      })
    })
    describe('no organizations are found', () => {
      it('returns an empty structure', async () => {
        await truncate()
        const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
          query,
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
          const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
            query,
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
                'You must provide a `first` or `last` value to properly paginate the `VerifiedDomain` connection.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User did not have either \`first\` or \`last\` arguments set for: loadVerifiedDomainConnectionsByOrgId.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
            query,
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
                'Passing both `first` and `last` to paginate the `VerifiedDomain` connection is not supported.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User attempted to have \`first\` and \`last\` arguments set for: loadVerifiedDomainConnectionsByOrgId.`,
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
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
              expect(err).toEqual(new Error('`first` on the `VerifiedDomain` connection cannot be less than zero.'))
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`first\` set below zero for: loadVerifiedDomainConnectionsByOrgId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
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
              expect(err).toEqual(new Error('`last` on the `VerifiedDomain` connection cannot be less than zero.'))
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`last\` set below zero for: loadVerifiedDomainConnectionsByOrgId.`,
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
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
                  'Requesting `1000` records on the `VerifiedDomain` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`first\` to 1000 for: loadVerifiedDomainConnectionsByOrgId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
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
                  'Requesting `1000` records on the `VerifiedDomain` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`last\` to 1000 for: loadVerifiedDomainConnectionsByOrgId.`,
            ])
          })
        })
      })
      describe('limits are not set to numbers', () => {
        describe('first limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when first set to ${stringify(invalidInput)}`, async () => {
              const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
                query,
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
                expect(err).toEqual(new Error(`\`first\` must be of type \`number\` not \`${typeof invalidInput}\`.`))
              }
              expect(consoleOutput).toEqual([
                `User attempted to have \`first\` set as a ${typeof invalidInput} for: loadVerifiedDomainConnectionsByOrgId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(invalidInput)}`, async () => {
              const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
                query,
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
                expect(err).toEqual(new Error(`\`last\` must be of type \`number\` not \`${typeof invalidInput}\`.`))
              }
              expect(consoleOutput).toEqual([
                `User attempted to have \`last\` set as a ${typeof invalidInput} for: loadVerifiedDomainConnectionsByOrgId.`,
              ])
            })
          })
        })
      })
    })
    describe('given a database error', () => {
      describe('when gathering domain keys that are claimed by orgs that the user has affiliations to', () => {
        it('returns an error message', async () => {
          const query = jest.fn().mockRejectedValue(new Error('Database Error Occurred.'))

          const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
            query,
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
            expect(err).toEqual(new Error('Unable to load verified domain(s). Please try again.'))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user was trying to gather domains in loadVerifiedDomainConnectionsByOrgId, error: Error: Database Error Occurred.`,
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

          const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
            query,
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
            expect(err).toEqual(new Error('Unable to load verified domain(s). Please try again.'))
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user was trying to gather domains in loadVerifiedDomainConnectionsByOrgId, error: Error: Cursor error occurred.`,
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
          const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
            query,
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
                'Vous devez fournir une valeur `first` ou `last` pour paginer correctement la connexion `VerifiedDomain`.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User did not have either \`first\` or \`last\` arguments set for: loadVerifiedDomainConnectionsByOrgId.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
            query,
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
                "Passer à la fois `first` et `last` pour paginer la connexion `VerifiedDomain` n'est pas supporté.",
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User attempted to have \`first\` and \`last\` arguments set for: loadVerifiedDomainConnectionsByOrgId.`,
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
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
              expect(err).toEqual(new Error('`first` sur la connexion `VerifiedDomain` ne peut être inférieur à zéro.'))
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`first\` set below zero for: loadVerifiedDomainConnectionsByOrgId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
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
              expect(err).toEqual(new Error('`last` sur la connexion `VerifiedDomain` ne peut être inférieur à zéro.'))
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`last\` set below zero for: loadVerifiedDomainConnectionsByOrgId.`,
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
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
                  "La demande d'enregistrements `1000` sur la connexion `VerifiedDomain` dépasse la limite `first` de 100 enregistrements.",
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`first\` to 1000 for: loadVerifiedDomainConnectionsByOrgId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
              query,
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
                  "La demande d'enregistrements `1000` sur la connexion `VerifiedDomain` dépasse la limite `last` de 100 enregistrements.",
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`last\` to 1000 for: loadVerifiedDomainConnectionsByOrgId.`,
            ])
          })
        })
      })
      describe('limits are not set to numbers', () => {
        describe('first limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when first set to ${stringify(invalidInput)}`, async () => {
              const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
                query,
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
                  new Error(`\`first\` doit être de type \`number\` et non \`${typeof invalidInput}\`.`),
                )
              }
              expect(consoleOutput).toEqual([
                `User attempted to have \`first\` set as a ${typeof invalidInput} for: loadVerifiedDomainConnectionsByOrgId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(invalidInput)}`, async () => {
              const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
                query,
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
                  new Error(`\`last\` doit être de type \`number\` et non \`${typeof invalidInput}\`.`),
                )
              }
              expect(consoleOutput).toEqual([
                `User attempted to have \`last\` set as a ${typeof invalidInput} for: loadVerifiedDomainConnectionsByOrgId.`,
              ])
            })
          })
        })
      })
    })
    describe('given a database error', () => {
      describe('when gathering domain keys that are claimed by orgs that the user has affiliations to', () => {
        it('returns an error message', async () => {
          const query = jest.fn().mockRejectedValue(new Error('Database Error Occurred.'))

          const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
            query,
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
            expect(err).toEqual(new Error('Impossible de charger le(s) domaine(s) vérifié(s). Veuillez réessayer.'))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user was trying to gather domains in loadVerifiedDomainConnectionsByOrgId, error: Error: Database Error Occurred.`,
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

          const connectionLoader = loadVerifiedDomainConnectionsByOrgId({
            query,
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
            expect(err).toEqual(new Error('Impossible de charger le(s) domaine(s) vérifié(s). Veuillez réessayer.'))
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user was trying to gather domains in loadVerifiedDomainConnectionsByOrgId, error: Error: Cursor error occurred.`,
          ])
        })
      })
    })
  })
})
