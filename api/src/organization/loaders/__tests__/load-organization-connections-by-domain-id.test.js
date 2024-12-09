import { stringify } from 'jest-matcher-utils'
import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput } from '../../../validators'
import { loadOrgConnectionsByDomainId, loadOrgByKey } from '../index'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the load organizations connection function', () => {
  let query, drop, truncate, collections, user, org, orgTwo, domain, domainTwo, domainThree, i18n

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
      org = await collections.organizations.save({
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
            slug: 'slug-org-one',
            acronym: 'ONE',
            name: 'org One',
            zone: 'zone one',
            sector: 'sector one',
            country: 'country one',
            province: 'province one',
            city: 'city one',
          },
          fr: {
            slug: 'slug-org-one',
            acronym: 'ONE',
            name: 'org One',
            zone: 'zone one',
            sector: 'sector one',
            country: 'country one',
            province: 'province one',
            city: 'city one',
          },
        },
      })
      orgTwo = await collections.organizations.save({
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
            slug: 'slug-org-two',
            acronym: 'TWO',
            name: 'org two',
            zone: 'zone two',
            sector: 'sector two',
            country: 'country two',
            province: 'province two',
            city: 'city two',
          },
          fr: {
            slug: 'slug-org-two',
            acronym: 'TWO',
            name: 'org two',
            zone: 'zone two',
            sector: 'sector two',
            country: 'country two',
            province: 'province two',
            city: 'city two',
          },
        },
      })
      await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'admin',
      })
      await collections.affiliations.save({
        _from: orgTwo._id,
        _to: user._id,
        permission: 'user',
      })
      domain = await collections.domains.save({
        domain: 'test.domain.gc.ca',
      })
      domainThree = await collections.domains.save({
        domain: 'test.domain.canada.gc.ca',
      })
      domainTwo = await collections.domains.save({
        domain: 'test.domain.canada.ca',
      })
      await collections.claims.save({
        _from: org._id,
        _to: domain._id,
      })
      await collections.claims.save({
        _from: orgTwo._id,
        _to: domain._id,
      })
      await collections.claims.save({
        _from: orgTwo._id,
        _to: domainTwo._id,
      })
      await collections.claims.save({
        _from: orgTwo._id,
        _to: domainThree._id,
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('users language is english', () => {
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
        describe('using after cursor', () => {
          it('returns an organization', async () => {
            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'en',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

            const orgLoader = loadOrgByKey({ query, language: 'en' })
            const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

            expectedOrgs[0].id = expectedOrgs[0]._key
            expectedOrgs[1].id = expectedOrgs[1]._key

            const connectionArgs = {
              first: 5,
              after: toGlobalId('organization', expectedOrgs[0].id),
            }
            const orgs = await connectionLoader({
              domainId: domain._id,
              ...connectionArgs,
            })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('organization', expectedOrgs[1]._key),
                  node: {
                    ...expectedOrgs[1],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: toGlobalId('organization', expectedOrgs[1]._key),
                endCursor: toGlobalId('organization', expectedOrgs[1]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('using before cursor', () => {
          it('returns an organization', async () => {
            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'en',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

            const orgLoader = loadOrgByKey({ query, language: 'en' })
            const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

            expectedOrgs[0].id = expectedOrgs[0]._key
            expectedOrgs[1].id = expectedOrgs[1]._key

            const connectionArgs = {
              first: 5,
              before: toGlobalId('organization', expectedOrgs[1].id),
            }
            const orgs = await connectionLoader({
              domainId: domain._id,
              ...connectionArgs,
            })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('organization', expectedOrgs[0]._key),
                  node: {
                    ...expectedOrgs[0],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false,
                startCursor: toGlobalId('organization', expectedOrgs[0]._key),
                endCursor: toGlobalId('organization', expectedOrgs[0]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('using first limit', () => {
          it('returns an organization', async () => {
            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'en',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

            const orgLoader = loadOrgByKey({ query, language: 'en' })
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
                  cursor: toGlobalId('organization', expectedOrgs[0]._key),
                  node: {
                    ...expectedOrgs[0],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false,
                startCursor: toGlobalId('organization', expectedOrgs[0]._key),
                endCursor: toGlobalId('organization', expectedOrgs[0]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('using last limit', () => {
          it('returns an organization', async () => {
            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'en',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

            const orgLoader = loadOrgByKey({ query, language: 'en' })
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
                  cursor: toGlobalId('organization', expectedOrgs[1]._key),
                  node: {
                    ...expectedOrgs[1],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: toGlobalId('organization', expectedOrgs[1]._key),
                endCursor: toGlobalId('organization', expectedOrgs[1]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('using the search argument', () => {
          beforeEach(async () => {
            await query`
              FOR org IN organizationSearch
                SEARCH org._key == 1
                OPTIONS { waitForSync: true }
                RETURN org
            `
          })
          describe('search using name', () => {
            it('returns the filtered organizations', async () => {
              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'en',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

              const orgLoader = loadOrgByKey({ query, language: 'en' })
              const expectedOrg = await orgLoader.load(org._key)

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                search: 'one',
              }
              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('organization', expectedOrg._key),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 1,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('organization', expectedOrg._key),
                  endCursor: toGlobalId('organization', expectedOrg._key),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('search using acronym', () => {
            it('returns the filtered organizations', async () => {
              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'en',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

              const orgLoader = loadOrgByKey({ query, language: 'en' })
              const expectedOrg = await orgLoader.load(org._key)

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                search: 'ONE',
              }
              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('organization', expectedOrg._key),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 1,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('organization', expectedOrg._key),
                  endCursor: toGlobalId('organization', expectedOrg._key),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('search argument is empty', () => {
            it('returns unfiltered organizations', async () => {
              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'en',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

              const orgLoader = loadOrgByKey({ query, language: 'en' })
              const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                search: '',
              }
              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('organization', expectedOrgs[0]._key),
                    node: {
                      ...expectedOrgs[0],
                    },
                  },
                  {
                    cursor: toGlobalId('organization', expectedOrgs[1]._key),
                    node: {
                      ...expectedOrgs[1],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('organization', expectedOrgs[0]._key),
                  endCursor: toGlobalId('organization', expectedOrgs[1]._key),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('using the orderBy field', () => {
          let orgThree
          beforeEach(async () => {
            orgThree = await collections.organizations.save({
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
                  slug: 'slug-org-three',
                  acronym: 'THREE',
                  name: 'org three',
                  zone: 'zone three',
                  sector: 'sector three',
                  country: 'country three',
                  province: 'province three',
                  city: 'city three',
                },
                fr: {
                  slug: 'slug-org-three',
                  acronym: 'THREE',
                  name: 'org three',
                  zone: 'zone three',
                  sector: 'sector three',
                  country: 'country three',
                  province: 'province three',
                  city: 'city three',
                },
              },
            })
            await collections.affiliations.save({
              _from: orgThree._id,
              _to: user._id,
              permission: 'user',
            })
            await collections.claims.save({
              _from: orgThree._id,
              _to: domain._id,
            })
            await collections.claims.save({
              _from: orgThree._id,
              _to: domainTwo._id,
            })
          })
          describe('ordering on ACRONYM', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'acronym',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'acronym',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on NAME', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'name',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'name',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on SLUG', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'slug',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'slug',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on ZONE', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'zone',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'zone',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on SECTOR', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'sector',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'sector',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on COUNTRY', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'country',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'country',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on PROVINCE', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'province',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'province',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on CITY', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'city',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'city',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on VERIFIED', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgTwo._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgThree._key),
                  orderBy: {
                    field: 'verified',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgTwo._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgThree._key),
                  orderBy: {
                    field: 'verified',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on SUMMARY_MAIL_PASS', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-mail-pass',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-mail-pass',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on SUMMARY_MAIL_FAIL', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-mail-fail',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-mail-fail',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on SUMMARY_MAIL_TOTAL', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-mail-total',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-mail-total',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on SUMMARY_WEB_PASS', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-web-pass',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-web-pass',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on SUMMARY_WEB_FAIL', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-web-fail',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-web-fail',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on SUMMARY_WEB_TOTAL', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-web-total',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-web-total',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on DOMAIN_COUNT', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'domain-count',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'en' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'domain-count',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
        })
        describe('no organizations are found', () => {
          it('returns empty structure', async () => {
            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'en',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

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
        describe('isSuperAdmin field is set', () => {
          it('returns all orgs', async () => {
            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'en',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

            const orgLoader = loadOrgByKey({ query, language: 'en' })
            const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

            expectedOrgs[0].id = expectedOrgs[0]._key
            expectedOrgs[1].id = expectedOrgs[1]._key

            const connectionArgs = {
              first: 5,
              isSuperAdmin: true,
            }
            const orgs = await connectionLoader({
              domainId: domain._id,
              ...connectionArgs,
            })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('organization', expectedOrgs[0]._key),
                  node: {
                    ...expectedOrgs[0],
                  },
                },
                {
                  cursor: toGlobalId('organization', expectedOrgs[1]._key),
                  node: {
                    ...expectedOrgs[1],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('organization', expectedOrgs[0]._key),
                endCursor: toGlobalId('organization', expectedOrgs[1]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('isAdmin field is set', () => {
          it('returns orgs that the user is only admin to', async () => {
            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'en',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

            const orgLoader = loadOrgByKey({ query, language: 'en' })
            const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

            const connectionArgs = {
              first: 5,
              isAdmin: true,
            }
            const orgs = await connectionLoader({
              domainId: domain._id,
              ...connectionArgs,
            })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('organization', expectedOrgs[0]._key),
                  node: {
                    ...expectedOrgs[0],
                  },
                },
              ],
              totalCount: 1,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('organization', expectedOrgs[0]._key),
                endCursor: toGlobalId('organization', expectedOrgs[0]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('using the includeSuperAdminOrg field', () => {
          let saOrg
          beforeEach(async () => {
            saOrg = await collections.organizations.save({
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
                  slug: 'super-admin',
                  acronym: 'SA',
                  name: 'Super Admin',
                  zone: 'zone sa',
                  sector: 'sector sa',
                  country: 'country sa',
                  province: 'province sa',
                  city: 'city two',
                },
                fr: {
                  slug: 'super-admin',
                  acronym: 'SA',
                  name: 'Super Admin',
                  zone: 'zone sa',
                  sector: 'sector sa',
                  country: 'country sa',
                  province: 'province sa',
                  city: 'city sa',
                },
              },
            })
            await collections.affiliations.save({
              _from: saOrg._id,
              _to: user._id,
              permission: 'super_admin',
            })
            await collections.claims.save({
              _from: saOrg._id,
              _to: domain._id,
            })
          })
          describe('includeSuperAdminOrg is set to true', () => {
            it('contains the super admin org', async () => {
              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'en',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

              const orgLoader = loadOrgByKey({ query, language: 'en' })
              const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key, saOrg._key])

              const connectionArgs = {
                first: 5,
                includeSuperAdminOrg: true,
              }
              const orgs = await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('organization', expectedOrgs[0]._key),
                    node: {
                      ...expectedOrgs[0],
                    },
                  },
                  {
                    cursor: toGlobalId('organization', expectedOrgs[1]._key),
                    node: {
                      ...expectedOrgs[1],
                    },
                  },
                  {
                    cursor: toGlobalId('organization', expectedOrgs[2]._key),
                    node: {
                      ...expectedOrgs[2],
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('organization', expectedOrgs[0]._key),
                  endCursor: toGlobalId('organization', expectedOrgs[2]._key),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('includeSuperAdminOrg is set to false', () => {
            it('does not contain the super admin org', async () => {
              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'en',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

              const orgLoader = loadOrgByKey({ query, language: 'en' })
              const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key, saOrg._key])

              const connectionArgs = {
                first: 5,
                includeSuperAdminOrg: false,
              }
              const orgs = await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('organization', expectedOrgs[0]._key),
                    node: {
                      ...expectedOrgs[0],
                    },
                  },
                  {
                    cursor: toGlobalId('organization', expectedOrgs[1]._key),
                    node: {
                      ...expectedOrgs[1],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('organization', expectedOrgs[0]._key),
                  endCursor: toGlobalId('organization', expectedOrgs[1]._key),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
      })
    })
    describe('users language is french', () => {
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
        describe('using after cursor', () => {
          it('returns an organization', async () => {
            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'fr',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

            const orgLoader = loadOrgByKey({ query, language: 'fr' })
            const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

            expectedOrgs[0].id = expectedOrgs[0]._key
            expectedOrgs[1].id = expectedOrgs[1]._key

            const connectionArgs = {
              first: 5,
              after: toGlobalId('organization', expectedOrgs[0].id),
            }
            const orgs = await connectionLoader({
              domainId: domain._id,
              ...connectionArgs,
            })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('organization', expectedOrgs[1]._key),
                  node: {
                    ...expectedOrgs[1],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: toGlobalId('organization', expectedOrgs[1]._key),
                endCursor: toGlobalId('organization', expectedOrgs[1]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('using before cursor', () => {
          it('returns an organization', async () => {
            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'fr',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

            const orgLoader = loadOrgByKey({ query, language: 'fr' })
            const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

            expectedOrgs[0].id = expectedOrgs[0]._key
            expectedOrgs[1].id = expectedOrgs[1]._key

            const connectionArgs = {
              first: 5,
              before: toGlobalId('organization', expectedOrgs[1].id),
            }
            const orgs = await connectionLoader({
              domainId: domain._id,
              ...connectionArgs,
            })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('organization', expectedOrgs[0]._key),
                  node: {
                    ...expectedOrgs[0],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false,
                startCursor: toGlobalId('organization', expectedOrgs[0]._key),
                endCursor: toGlobalId('organization', expectedOrgs[0]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('using first limit', () => {
          it('returns an organization', async () => {
            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'fr',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

            const orgLoader = loadOrgByKey({ query, language: 'fr' })
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
                  cursor: toGlobalId('organization', expectedOrgs[0]._key),
                  node: {
                    ...expectedOrgs[0],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false,
                startCursor: toGlobalId('organization', expectedOrgs[0]._key),
                endCursor: toGlobalId('organization', expectedOrgs[0]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('using last limit', () => {
          it('returns an organization', async () => {
            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'fr',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

            const orgLoader = loadOrgByKey({ query, language: 'fr' })
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
                  cursor: toGlobalId('organization', expectedOrgs[1]._key),
                  node: {
                    ...expectedOrgs[1],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: toGlobalId('organization', expectedOrgs[1]._key),
                endCursor: toGlobalId('organization', expectedOrgs[1]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('using the search argument', () => {
          beforeEach(async () => {
            await query`
              FOR org IN organizationSearch
                SEARCH org._key == 1
                OPTIONS { waitForSync: true }
                RETURN org
            `
          })
          describe('search using name', () => {
            it('returns the filtered organizations', async () => {
              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'fr',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

              const orgLoader = loadOrgByKey({ query, language: 'fr' })
              const expectedOrg = await orgLoader.load(org._key)

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                search: 'one',
              }
              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('organization', expectedOrg._key),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 1,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('organization', expectedOrg._key),
                  endCursor: toGlobalId('organization', expectedOrg._key),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('search using acronym', () => {
            it('returns the filtered organizations', async () => {
              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'fr',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

              const orgLoader = loadOrgByKey({ query, language: 'fr' })
              const expectedOrg = await orgLoader.load(org._key)

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                search: 'ONE',
              }
              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('organization', expectedOrg._key),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 1,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('organization', expectedOrg._key),
                  endCursor: toGlobalId('organization', expectedOrg._key),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('search argument is empty', () => {
            it('returns unfiltered organizations', async () => {
              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'fr',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

              const orgLoader = loadOrgByKey({ query, language: 'fr' })
              const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                search: '',
              }
              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('organization', expectedOrgs[0]._key),
                    node: {
                      ...expectedOrgs[0],
                    },
                  },
                  {
                    cursor: toGlobalId('organization', expectedOrgs[1]._key),
                    node: {
                      ...expectedOrgs[1],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('organization', expectedOrgs[0]._key),
                  endCursor: toGlobalId('organization', expectedOrgs[1]._key),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('using the orderBy field', () => {
          let orgThree
          beforeEach(async () => {
            orgThree = await collections.organizations.save({
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
                  slug: 'slug-org-three',
                  acronym: 'THREE',
                  name: 'org three',
                  zone: 'zone three',
                  sector: 'sector three',
                  country: 'country three',
                  province: 'province three',
                  city: 'city three',
                },
                fr: {
                  slug: 'slug-org-three',
                  acronym: 'THREE',
                  name: 'org three',
                  zone: 'zone three',
                  sector: 'sector three',
                  country: 'country three',
                  province: 'province three',
                  city: 'city three',
                },
              },
            })
            await collections.affiliations.save({
              _from: orgThree._id,
              _to: user._id,
              permission: 'user',
            })
            await collections.claims.save({
              _from: orgThree._id,
              _to: domain._id,
            })
            await collections.claims.save({
              _from: orgThree._id,
              _to: domainTwo._id,
            })
          })
          describe('ordering on ACRONYM', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'acronym',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'acronym',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on NAME', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'name',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'name',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on SLUG', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'slug',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'slug',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on ZONE', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'zone',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'zone',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on SECTOR', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'sector',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'sector',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on COUNTRY', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'country',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'country',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on PROVINCE', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'province',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'province',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on CITY', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'city',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'city',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on VERIFIED', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgTwo._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgThree._key),
                  orderBy: {
                    field: 'verified',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgTwo._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgThree._key),
                  orderBy: {
                    field: 'verified',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on SUMMARY_MAIL_PASS', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-mail-pass',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-mail-pass',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on SUMMARY_MAIL_FAIL', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-mail-fail',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-mail-fail',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on SUMMARY_MAIL_TOTAL', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-mail-total',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-mail-total',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on SUMMARY_WEB_PASS', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-web-pass',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-web-pass',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on SUMMARY_WEB_FAIL', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-web-fail',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-web-fail',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on SUMMARY_WEB_TOTAL', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-web-total',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'summary-web-total',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
          describe('ordering on DOMAIN_COUNT', () => {
            describe('direction is set to ASC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  after: toGlobalId('organization', org._key),
                  before: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'domain-count',
                    direction: 'ASC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
            describe('direction is set to DESC', () => {
              it('returns organization', async () => {
                const orgLoader = loadOrgByKey({ query, language: 'fr' })
                const expectedOrg = await orgLoader.load(orgThree._key)

                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
                })
                const connectionArgs = {
                  first: 5,
                  before: toGlobalId('organization', org._key),
                  after: toGlobalId('organization', orgTwo._key),
                  orderBy: {
                    field: 'domain-count',
                    direction: 'DESC',
                  },
                }
                const orgs = await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })

                const expectedStructure = {
                  edges: [
                    {
                      cursor: toGlobalId('organization', expectedOrg._key),
                      node: {
                        ...expectedOrg,
                      },
                    },
                  ],
                  totalCount: 3,
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: toGlobalId('organization', expectedOrg._key),
                    endCursor: toGlobalId('organization', expectedOrg._key),
                  },
                }

                expect(orgs).toEqual(expectedStructure)
              })
            })
          })
        })
        describe('no organizations are found', () => {
          it('returns empty structure', async () => {
            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'fr',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

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
        describe('isSuperAdmin field is set', () => {
          it('returns all orgs', async () => {
            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'fr',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

            const orgLoader = loadOrgByKey({ query, language: 'fr' })
            const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

            expectedOrgs[0].id = expectedOrgs[0]._key
            expectedOrgs[1].id = expectedOrgs[1]._key

            const connectionArgs = {
              first: 5,
              isSuperAdmin: true,
            }
            const orgs = await connectionLoader({
              domainId: domain._id,
              ...connectionArgs,
            })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('organization', expectedOrgs[0]._key),
                  node: {
                    ...expectedOrgs[0],
                  },
                },
                {
                  cursor: toGlobalId('organization', expectedOrgs[1]._key),
                  node: {
                    ...expectedOrgs[1],
                  },
                },
              ],
              totalCount: 2,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('organization', expectedOrgs[0]._key),
                endCursor: toGlobalId('organization', expectedOrgs[1]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('isAdmin field is set', () => {
          it('returns orgs that the user is only admin to', async () => {
            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'fr',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

            const orgLoader = loadOrgByKey({ query, language: 'fr' })
            const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key])

            const connectionArgs = {
              first: 5,
              isAdmin: true,
            }
            const orgs = await connectionLoader({
              domainId: domain._id,
              ...connectionArgs,
            })

            const expectedStructure = {
              edges: [
                {
                  cursor: toGlobalId('organization', expectedOrgs[0]._key),
                  node: {
                    ...expectedOrgs[0],
                  },
                },
              ],
              totalCount: 1,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('organization', expectedOrgs[0]._key),
                endCursor: toGlobalId('organization', expectedOrgs[0]._key),
              },
            }

            expect(orgs).toEqual(expectedStructure)
          })
        })
        describe('using the includeSuperAdminOrg field', () => {
          let saOrg
          beforeEach(async () => {
            saOrg = await collections.organizations.save({
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
                  slug: 'super-admin',
                  acronym: 'SA',
                  name: 'Super Admin',
                  zone: 'zone sa',
                  sector: 'sector sa',
                  country: 'country sa',
                  province: 'province sa',
                  city: 'city two',
                },
                fr: {
                  slug: 'super-admin',
                  acronym: 'SA',
                  name: 'Super Admin',
                  zone: 'zone sa',
                  sector: 'sector sa',
                  country: 'country sa',
                  province: 'province sa',
                  city: 'city sa',
                },
              },
            })
            await collections.affiliations.save({
              _from: saOrg._id,
              _to: user._id,
              permission: 'super_admin',
            })
            await collections.claims.save({
              _from: saOrg._id,
              _to: domain._id,
            })
          })
          describe('includeSuperAdminOrg is set to true', () => {
            it('contains the super admin org', async () => {
              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'fr',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

              const orgLoader = loadOrgByKey({ query, language: 'fr' })
              const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key, saOrg._key])

              const connectionArgs = {
                first: 5,
                includeSuperAdminOrg: true,
              }
              const orgs = await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('organization', expectedOrgs[0]._key),
                    node: {
                      ...expectedOrgs[0],
                    },
                  },
                  {
                    cursor: toGlobalId('organization', expectedOrgs[1]._key),
                    node: {
                      ...expectedOrgs[1],
                    },
                  },
                  {
                    cursor: toGlobalId('organization', expectedOrgs[2]._key),
                    node: {
                      ...expectedOrgs[2],
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('organization', expectedOrgs[0]._key),
                  endCursor: toGlobalId('organization', expectedOrgs[2]._key),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('includeSuperAdminOrg is set to false', () => {
            it('does not contain the super admin org', async () => {
              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'fr',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

              const orgLoader = loadOrgByKey({ query, language: 'fr' })
              const expectedOrgs = await orgLoader.loadMany([org._key, orgTwo._key, saOrg._key])

              const connectionArgs = {
                first: 5,
                includeSuperAdminOrg: false,
              }
              const orgs = await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('organization', expectedOrgs[0]._key),
                    node: {
                      ...expectedOrgs[0],
                    },
                  },
                  {
                    cursor: toGlobalId('organization', expectedOrgs[1]._key),
                    node: {
                      ...expectedOrgs[1],
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('organization', expectedOrgs[0]._key),
                  endCursor: toGlobalId('organization', expectedOrgs[1]._key),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
      })
    })
  })
  describe('given an unsuccessful load', () => {
    describe('users language is english', () => {
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
            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'en',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

            try {
              const connectionArgs = {}
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'You must provide a `first` or `last` value to properly paginate the `Organization` connection.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadOrgConnectionsByDomainId.`,
            ])
          })
        })
        describe('user has first and last arguments set at the same time', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'en',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

            try {
              const connectionArgs = {
                first: 1,
                last: 1,
              }
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Passing both `first` and `last` to paginate the `Organization` connection is not supported.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadOrgConnectionsByDomainId.`,
            ])
          })
        })
        describe('limits are set below minimum', () => {
          describe('first is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'en',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

              try {
                const connectionArgs = {
                  first: -1,
                }
                await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error('`first` on the `Organization` connection cannot be less than zero.'))
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to have \`first\` set below zero for: loadOrgConnectionsByDomainId.`,
              ])
            })
          })
          describe('last is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'en',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

              try {
                const connectionArgs = {
                  last: -1,
                }
                await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error('`last` on the `Organization` connection cannot be less than zero.'))
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to have \`last\` set below zero for: loadOrgConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('limits are set above maximum', () => {
          describe('first is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'en',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

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
                    'Requesting `101` records on the `Organization` connection exceeds the `first` limit of 100 records.',
                  ),
                )
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to have \`first\` to 101 for: loadOrgConnectionsByDomainId.`,
              ])
            })
          })
          describe('last is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'en',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

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
                    'Requesting `101` records on the `Organization` connection exceeds the `last` limit of 100 records.',
                  ),
                )
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to have \`last\` to 101 for: loadOrgConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('limits are not set to numbers', () => {
          describe('first limit is set', () => {
            ;['123', {}, [], null, true].forEach((invalidInput) => {
              it(`returns an error when first set to ${stringify(invalidInput)}`, async () => {
                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
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
                  } attempted to have \`first\` set as a ${typeof invalidInput} for: loadOrgConnectionsByDomainId.`,
                ])
              })
            })
          })
          describe('last limit is set', () => {
            ;['123', {}, [], null, true].forEach((invalidInput) => {
              it(`returns an error when last set to ${stringify(invalidInput)}`, async () => {
                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'en',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
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
                  } attempted to have \`last\` set as a ${typeof invalidInput} for: loadOrgConnectionsByDomainId.`,
                ])
              })
            })
          })
        })
      })
      describe('given a database error', () => {
        describe('when gathering organizations', () => {
          it('returns an error message', async () => {
            const query = jest.fn().mockRejectedValue(new Error('Database error occurred.'))

            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'en',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

            try {
              const connectionArgs = {
                first: 5,
              }
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('Unable to load organization(s). Please try again.'))
            }

            expect(consoleOutput).toEqual([
              `Database error occurred while user: ${user._key} was trying to gather orgs in loadOrgConnectionsByDomainId, error: Error: Database error occurred.`,
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

              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'en',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

              try {
                const connectionArgs = {
                  first: 5,
                }
                await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error('Unable to load organization(s). Please try again.'))
              }

              expect(consoleOutput).toEqual([
                `Cursor error occurred while user: ${user._key} was trying to gather orgs in loadOrgConnectionsByDomainId, error: Error: Cursor error occurred.`,
              ])
            })
          })
        })
      })
    })
    describe('users language is french', () => {
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
            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'fr',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

            try {
              const connectionArgs = {}
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Vous devez fournir une valeur `first` ou `last` pour paginer correctement la connexion `Organization`.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadOrgConnectionsByDomainId.`,
            ])
          })
        })
        describe('user has first and last arguments set at the same time', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'fr',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

            try {
              const connectionArgs = {
                first: 1,
                last: 1,
              }
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  "Passer à la fois `first` et `last` pour paginer la connexion `Organization` n'est pas supporté.",
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadOrgConnectionsByDomainId.`,
            ])
          })
        })
        describe('limits are set below minimum', () => {
          describe('first is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'fr',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

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
                  new Error('`first` sur la connexion `Organization` ne peut être inférieure à zéro.'),
                )
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to have \`first\` set below zero for: loadOrgConnectionsByDomainId.`,
              ])
            })
          })
          describe('last is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'fr',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

              try {
                const connectionArgs = {
                  last: -1,
                }
                await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error('`last` sur la connexion `Organization` ne peut être inférieure à zéro.'))
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to have \`last\` set below zero for: loadOrgConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('limits are set above maximum', () => {
          describe('first is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'fr',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

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
                    "La demande d'enregistrements `101` sur la connexion `Organization` dépasse la limite `first` de 100 enregistrements.",
                  ),
                )
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to have \`first\` to 101 for: loadOrgConnectionsByDomainId.`,
              ])
            })
          })
          describe('last is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'fr',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

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
                    "La demande d'enregistrements `101` sur la connexion `Organization` dépasse la limite `last` de 100 enregistrements.",
                  ),
                )
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to have \`last\` to 101 for: loadOrgConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('limits are not set to numbers', () => {
          describe('first limit is set', () => {
            ;['123', {}, [], null, true].forEach((invalidInput) => {
              it(`returns an error when first set to ${stringify(invalidInput)}`, async () => {
                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
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
                  } attempted to have \`first\` set as a ${typeof invalidInput} for: loadOrgConnectionsByDomainId.`,
                ])
              })
            })
          })
          describe('last limit is set', () => {
            ;['123', {}, [], null, true].forEach((invalidInput) => {
              it(`returns an error when last set to ${stringify(invalidInput)}`, async () => {
                const connectionLoader = loadOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                  auth: { loginRequiredBool: true },
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
                  } attempted to have \`last\` set as a ${typeof invalidInput} for: loadOrgConnectionsByDomainId.`,
                ])
              })
            })
          })
        })
      })
      describe('given a database error', () => {
        describe('when gathering organizations', () => {
          it('returns an error message', async () => {
            const query = jest.fn().mockRejectedValue(new Error('Database error occurred.'))

            const connectionLoader = loadOrgConnectionsByDomainId({
              query,
              language: 'fr',
              userKey: user._key,
              cleanseInput,
              i18n,
              auth: { loginRequiredBool: true },
            })

            try {
              const connectionArgs = {
                first: 5,
              }
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error("Impossible de charger l'organisation (s). Veuillez réessayer."))
            }

            expect(consoleOutput).toEqual([
              `Database error occurred while user: ${user._key} was trying to gather orgs in loadOrgConnectionsByDomainId, error: Error: Database error occurred.`,
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

              const connectionLoader = loadOrgConnectionsByDomainId({
                query,
                language: 'fr',
                userKey: user._key,
                cleanseInput,
                i18n,
                auth: { loginRequiredBool: true },
              })

              try {
                const connectionArgs = {
                  first: 5,
                }
                await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error("Impossible de charger l'organisation (s). Veuillez réessayer."))
              }

              expect(consoleOutput).toEqual([
                `Cursor error occurred while user: ${user._key} was trying to gather orgs in loadOrgConnectionsByDomainId, error: Error: Cursor error occurred.`,
              ])
            })
          })
        })
      })
    })
  })
})
