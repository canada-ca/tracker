import { stringify } from 'jest-matcher-utils'
import { ensure, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { cleanseInput } from '../../../validators'
import {
  loadVerifiedOrgConnectionsByDomainId,
  loadVerifiedOrgByKey,
} from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the load organizations connection function', () => {
  let query,
    drop,
    truncate,
    collections,
    org,
    orgTwo,
    i18n,
    domain,
    domainTwo,
    domainThree

  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.error = mockedError
    console.warn = mockedWarn
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeEach(async () => {
    org = await collections.organizations.save({
      verified: true,
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
      verified: true,
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
    consoleOutput = []
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful load', () => {
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
      describe('using after cursor', () => {
        it('returns an organization', async () => {
          const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query,
            language: 'en',
            cleanseInput,
            i18n,
          })

          const orgLoader = loadVerifiedOrgByKey({ query, language: 'en' })
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
          const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query,
            language: 'en',
            cleanseInput,
            i18n,
          })

          const orgLoader = loadVerifiedOrgByKey({ query, language: 'en' })
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
          const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query,
            language: 'en',
            cleanseInput,
            i18n,
          })

          const orgLoader = loadVerifiedOrgByKey({ query, language: 'en' })
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
          const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query,
            language: 'en',
            cleanseInput,
            i18n,
          })

          const orgLoader = loadVerifiedOrgByKey({ query, language: 'en' })
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
      describe('using the orderBy field', () => {
        let orgThree
        beforeEach(async () => {
          orgThree = await collections.organizations.save({
            verified: true,
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
          await collections.claims.save({
            _from: orgThree._id,
            _to: domain._id,
          })
          await collections.claims.save({
            _from: orgThree._id,
            _to: domainTwo._id,
          })
        })
        describe('ordering by ACRONYM', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'acronym',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'acronym',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by NAME', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'name',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'name',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by ZONE', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'zone',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'zone',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by SECTOR', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'sector',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'sector',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by COUNTRY', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'country',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'country',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by SUMMARY_MAIL_PASS', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'summary-mail-pass',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'summary-mail-pass',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by SUMMARY_MAIL_FAIL', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'summary-mail-fail',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'summary-mail-fail',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by SUMMARY_MAIL_TOTAL', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'summary-mail-total',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'summary-mail-total',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by SUMMARY_WEB_PASS', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'summary-web-pass',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'summary-web-pass',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by SUMMARY_WEB_FAIL', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'summary-web-fail',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'summary-web-fail',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by SUMMARY_WEB_TOTAL', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'summary-web-total',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'summary-web-total',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by DOMAIN_COUNT', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'domain-count',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'en',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'domain-count',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
      })
      describe('no organizations are found', () => {
        it('returns empty structure', async () => {
          const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query,
            language: 'en',
            cleanseInput,
            i18n,
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
      describe('using after cursor', () => {
        it('returns an organization', async () => {
          const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query,
            language: 'fr',
            cleanseInput,
            i18n,
          })

          const orgLoader = loadVerifiedOrgByKey({ query, language: 'fr' })
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
          const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query,
            language: 'fr',
            cleanseInput,
            i18n,
          })

          const orgLoader = loadVerifiedOrgByKey({ query, language: 'fr' })
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
          const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query,
            language: 'fr',
            cleanseInput,
            i18n,
          })

          const orgLoader = loadVerifiedOrgByKey({ query, language: 'fr' })
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
          const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query,
            language: 'fr',
            cleanseInput,
            i18n,
          })

          const orgLoader = loadVerifiedOrgByKey({ query, language: 'fr' })
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
      describe('using the orderBy field', () => {
        let orgThree
        beforeEach(async () => {
          orgThree = await collections.organizations.save({
            verified: true,
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
          await collections.claims.save({
            _from: orgThree._id,
            _to: domain._id,
          })
          await collections.claims.save({
            _from: orgThree._id,
            _to: domainTwo._id,
          })
        })
        describe('ordering by ACRONYM', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'acronym',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'acronym',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by NAME', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'name',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'name',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by ZONE', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'zone',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'zone',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by SECTOR', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'sector',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'sector',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by COUNTRY', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'country',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'country',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by SUMMARY_MAIL_PASS', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'summary-mail-pass',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'summary-mail-pass',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by SUMMARY_MAIL_FAIL', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'summary-mail-fail',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'summary-mail-fail',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by SUMMARY_MAIL_TOTAL', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'summary-mail-total',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'summary-mail-total',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by SUMMARY_WEB_PASS', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'summary-web-pass',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'summary-web-pass',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by SUMMARY_WEB_FAIL', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'summary-web-fail',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'summary-web-fail',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by SUMMARY_WEB_TOTAL', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'summary-web-total',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'summary-web-total',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
        describe('ordering by DOMAIN_COUNT', () => {
          describe('direction is set to ASC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', org._key),
                before: toGlobalId('verifiedOrganizations', orgTwo._key),
                orderBy: {
                  field: 'domain-count',
                  direction: 'ASC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
          describe('direction is set to DESC', () => {
            it('returns organizations', async () => {
              const orgLoader = loadVerifiedOrgByKey({
                query,
                language: 'fr',
              })
              const expectedOrg = await orgLoader.load(orgThree._key)

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                domainId: domain._id,
                first: 5,
                after: toGlobalId('verifiedOrganizations', orgTwo._key),
                before: toGlobalId('verifiedOrganizations', org._key),
                orderBy: {
                  field: 'domain-count',
                  direction: 'DESC',
                },
              }

              const orgs = await connectionLoader({
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId(
                      'verifiedOrganizations',
                      expectedOrg._key,
                    ),
                    node: {
                      ...expectedOrg,
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: true,
                  startCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganizations',
                    expectedOrg._key,
                  ),
                },
              }

              expect(orgs).toEqual(expectedStructure)
            })
          })
        })
      })
      describe('no organizations are found', () => {
        it('returns empty structure', async () => {
          const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query,
            language: 'fr',
            cleanseInput,
            i18n,
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
            const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
              query,
              language: 'en',
              cleanseInput,
              i18n,
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
                  'You must provide a `first` or `last` value to properly paginate the `VerifiedOrganization` connection.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              'User did not have either `first` or `last` arguments set for: loadVerifiedOrgConnectionsByDomainId.',
            ])
          })
        })
        describe('user has first and last arguments set at the same time', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
              query,
              language: 'en',
              cleanseInput,
              i18n,
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
                  'Passing both `first` and `last` to paginate the `VerifiedOrganization` connection is not supported.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              'User attempted to have `first` and `last` arguments set for: loadVerifiedOrgConnectionsByDomainId.',
            ])
          })
        })
        describe('limits are set below minimum', () => {
          describe('first is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
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
                  new Error(
                    '`first` on the `VerifiedOrganization` connection cannot be less than zero.',
                  ),
                )
              }

              expect(consoleOutput).toEqual([
                'User attempted to have `first` set below zero for: loadVerifiedOrgConnectionsByDomainId.',
              ])
            })
          })
          describe('last is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
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
                expect(err).toEqual(
                  new Error(
                    '`last` on the `VerifiedOrganization` connection cannot be less than zero.',
                  ),
                )
              }

              expect(consoleOutput).toEqual([
                'User attempted to have `last` set below zero for: loadVerifiedOrgConnectionsByDomainId.',
              ])
            })
          })
        })
        describe('limits are set above maximum', () => {
          describe('first is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
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
                    'Requesting `101` records on the `VerifiedOrganization` connection exceeds the `first` limit of 100 records.',
                  ),
                )
              }

              expect(consoleOutput).toEqual([
                'User attempted to have `first` to 101 for: loadVerifiedOrgConnectionsByDomainId.',
              ])
            })
          })
          describe('last is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
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
                    'Requesting `101` records on the `VerifiedOrganization` connection exceeds the `last` limit of 100 records.',
                  ),
                )
              }

              expect(consoleOutput).toEqual([
                'User attempted to have `last` to 101 for: loadVerifiedOrgConnectionsByDomainId.',
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
                const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                  query,
                  language: 'en',
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
                    new Error(
                      `\`first\` must be of type \`number\` not \`${typeof invalidInput}\`.`,
                    ),
                  )
                }
                expect(consoleOutput).toEqual([
                  `User attempted to have \`first\` set as a ${typeof invalidInput} for: loadVerifiedOrgConnectionsByDomainId.`,
                ])
              })
            })
          })
          describe('last limit is set', () => {
            ;['123', {}, [], null, true].forEach((invalidInput) => {
              it(`returns an error when last set to ${stringify(
                invalidInput,
              )}`, async () => {
                const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                  query,
                  language: 'en',
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
                    new Error(
                      `\`last\` must be of type \`number\` not \`${typeof invalidInput}\`.`,
                    ),
                  )
                }
                expect(consoleOutput).toEqual([
                  `User attempted to have \`last\` set as a ${typeof invalidInput} for: loadVerifiedOrgConnectionsByDomainId.`,
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

            const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
              query,
              language: 'en',
              cleanseInput,
              i18n,
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
              expect(err).toEqual(
                new Error(
                  'Unable to load verified organization(s). Please try again.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `Database error occurred while user was trying to gather orgs in loadVerifiedOrgConnectionsByDomainId, error: Error: Database error occurred.`,
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

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'en',
                cleanseInput,
                i18n,
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
                expect(err).toEqual(
                  new Error(
                    'Unable to load verified organization(s). Please try again.',
                  ),
                )
              }

              expect(consoleOutput).toEqual([
                `Cursor error occurred while user was trying to gather orgs in loadVerifiedOrgConnectionsByDomainId, error: Error: Cursor error occurred.`,
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
            const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
              query,
              language: 'fr',
              cleanseInput,
              i18n,
            })

            try {
              const connectionArgs = {}
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `User did not have either \`first\` or \`last\` arguments set for: loadVerifiedOrgConnectionsByDomainId.`,
            ])
          })
        })
        describe('user has first and last arguments set at the same time', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
              query,
              language: 'fr',
              cleanseInput,
              i18n,
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
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `User attempted to have \`first\` and \`last\` arguments set for: loadVerifiedOrgConnectionsByDomainId.`,
            ])
          })
        })
        describe('limits are set below minimum', () => {
          describe('first is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
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
                expect(err).toEqual(new Error('todo'))
              }

              expect(consoleOutput).toEqual([
                `User attempted to have \`first\` set below zero for: loadVerifiedOrgConnectionsByDomainId.`,
              ])
            })
          })
          describe('last is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
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
                expect(err).toEqual(new Error('todo'))
              }

              expect(consoleOutput).toEqual([
                `User attempted to have \`last\` set below zero for: loadVerifiedOrgConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('limits are set above maximum', () => {
          describe('first is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
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
                expect(err).toEqual(new Error('todo'))
              }

              expect(consoleOutput).toEqual([
                `User attempted to have \`first\` to 101 for: loadVerifiedOrgConnectionsByDomainId.`,
              ])
            })
          })
          describe('last is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
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
                expect(err).toEqual(new Error('todo'))
              }

              expect(consoleOutput).toEqual([
                `User attempted to have \`last\` to 101 for: loadVerifiedOrgConnectionsByDomainId.`,
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
                const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
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
                  expect(err).toEqual(new Error(`todo`))
                }
                expect(consoleOutput).toEqual([
                  `User attempted to have \`first\` set as a ${typeof invalidInput} for: loadVerifiedOrgConnectionsByDomainId.`,
                ])
              })
            })
          })
          describe('last limit is set', () => {
            ;['123', {}, [], null, true].forEach((invalidInput) => {
              it(`returns an error when last set to ${stringify(
                invalidInput,
              )}`, async () => {
                const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                  query,
                  language: 'fr',
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
                  expect(err).toEqual(new Error(`todo`))
                }
                expect(consoleOutput).toEqual([
                  `User attempted to have \`last\` set as a ${typeof invalidInput} for: loadVerifiedOrgConnectionsByDomainId.`,
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

            const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
              query,
              language: 'fr',
              cleanseInput,
              i18n,
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
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `Database error occurred while user was trying to gather orgs in loadVerifiedOrgConnectionsByDomainId, error: Error: Database error occurred.`,
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

              const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query,
                language: 'fr',
                cleanseInput,
                i18n,
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
                expect(err).toEqual(new Error('todo'))
              }

              expect(consoleOutput).toEqual([
                `Cursor error occurred while user was trying to gather orgs in loadVerifiedOrgConnectionsByDomainId, error: Error: Cursor error occurred.`,
              ])
            })
          })
        })
      })
    })
  })
})
