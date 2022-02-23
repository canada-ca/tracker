import { stringify } from 'jest-matcher-utils'
import { ensure, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput } from '../../../validators'
import {
  loadVerifiedOrgConnectionsByDomainId,
  loadVerifiedOrgByKey,
} from '../../loaders'
import dbschema from '../../../../database.json';

const { DB_PASS: rootPass, DB_URL: url } = process.env

const i18n = setupI18n({
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

const orgOneData = {
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
}

const orgTwoData = {
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
}

const orgThreeData = {
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
}

const domainOneData = {
  domain: 'test.domain.gc.ca',
}

const domainTwoData = {
  domain: 'test.domain.canada.ca',
}

const domainThreeData = {
  domain: 'test.domain.canada.gc.ca',
}

describe('given the load organizations connection function', () => {
  describe('given a successful load', () => {
    describe('users language is english', () => {
      describe('using after cursor', () => {
        let consoleOutput = []
        const mockedError = (output) => consoleOutput.push(output)
        const mockedWarn = (output) => consoleOutput.push(output)
        console.error = mockedError
        console.warn = mockedWarn

        let query,
          drop,
          truncate,
          collections,
          org,
          orgTwo,
          domain,
          domainTwo,
          domainThree

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
          org = await collections.organizations.save(orgOneData)
          orgTwo = await collections.organizations.save(orgTwoData)

          domain = await collections.domains.save(domainOneData)
          domainTwo = await collections.domains.save(domainTwoData)
          domainThree = await collections.domains.save(domainThreeData)

          await collections.claims.import([
            {
              _from: org._id,
              _to: domain._id,
            },
            {
              _from: orgTwo._id,
              _to: domain._id,
            },
            {
              _from: orgTwo._id,
              _to: domainTwo._id,
            },
            {
              _from: orgTwo._id,
              _to: domainThree._id,
            },
          ])
        })

        afterEach(async () => {
          consoleOutput = []
          await truncate()
        })

        afterAll(async () => {
          await drop()
        })

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
            after: toGlobalId('verifiedOrganization', expectedOrgs[0].id),
          }
          const orgs = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId(
                  'verifiedOrganization',
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
                'verifiedOrganization',
                expectedOrgs[1]._key,
              ),
              endCursor: toGlobalId(
                'verifiedOrganization',
                expectedOrgs[1]._key,
              ),
            },
          }

          expect(orgs).toEqual(expectedStructure)
        })
      })
      describe('using before cursor', () => {
        let consoleOutput = []
        const mockedError = (output) => consoleOutput.push(output)
        const mockedWarn = (output) => consoleOutput.push(output)
        console.error = mockedError
        console.warn = mockedWarn

        let query,
          drop,
          truncate,
          collections,
          org,
          orgTwo,
          domain,
          domainTwo,
          domainThree

        beforeEach(async () => {
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
          org = await collections.organizations.save(orgOneData)
          orgTwo = await collections.organizations.save(orgTwoData)

          domain = await collections.domains.save(domainOneData)
          domainTwo = await collections.domains.save(domainTwoData)
          domainThree = await collections.domains.save(domainThreeData)

          await collections.claims.import([
            {
              _from: org._id,
              _to: domain._id,
            },
            {
              _from: orgTwo._id,
              _to: domain._id,
            },
            {
              _from: orgTwo._id,
              _to: domainTwo._id,
            },
            {
              _from: orgTwo._id,
              _to: domainThree._id,
            },
          ])
        })

        afterEach(async () => {
          consoleOutput = []
          await truncate()
        })

        afterAll(async () => {
          await drop()
        })

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
            before: toGlobalId('verifiedOrganization', expectedOrgs[1].id),
          }
          const orgs = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId(
                  'verifiedOrganization',
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
                'verifiedOrganization',
                expectedOrgs[0]._key,
              ),
              endCursor: toGlobalId(
                'verifiedOrganization',
                expectedOrgs[0]._key,
              ),
            },
          }

          expect(orgs).toEqual(expectedStructure)
        })
      })
      describe('using first limit', () => {
        let consoleOutput = []
        const mockedError = (output) => consoleOutput.push(output)
        const mockedWarn = (output) => consoleOutput.push(output)
        console.error = mockedError
        console.warn = mockedWarn

        let query,
          drop,
          truncate,
          collections,
          org,
          orgTwo,
          domain,
          domainTwo,
          domainThree

        beforeEach(async () => {
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
          org = await collections.organizations.save(orgOneData)
          orgTwo = await collections.organizations.save(orgTwoData)

          domain = await collections.domains.save(domainOneData)
          domainTwo = await collections.domains.save(domainTwoData)
          domainThree = await collections.domains.save(domainThreeData)

          await collections.claims.import([
            {
              _from: org._id,
              _to: domain._id,
            },
            {
              _from: orgTwo._id,
              _to: domain._id,
            },
            {
              _from: orgTwo._id,
              _to: domainTwo._id,
            },
            {
              _from: orgTwo._id,
              _to: domainThree._id,
            },
          ])
        })

        afterEach(async () => {
          consoleOutput = []
          await truncate()
        })

        afterAll(async () => {
          await drop()
        })

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
                  'verifiedOrganization',
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
                'verifiedOrganization',
                expectedOrgs[0]._key,
              ),
              endCursor: toGlobalId(
                'verifiedOrganization',
                expectedOrgs[0]._key,
              ),
            },
          }

          expect(orgs).toEqual(expectedStructure)
        })
      })
      describe('using last limit', () => {
        let consoleOutput = []
        const mockedError = (output) => consoleOutput.push(output)
        const mockedWarn = (output) => consoleOutput.push(output)
        console.error = mockedError
        console.warn = mockedWarn

        let query,
          drop,
          truncate,
          collections,
          org,
          orgTwo,
          domain,
          domainTwo,
          domainThree

        beforeEach(async () => {
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
          org = await collections.organizations.save(orgOneData)
          orgTwo = await collections.organizations.save(orgTwoData)

          domain = await collections.domains.save(domainOneData)
          domainTwo = await collections.domains.save(domainTwoData)
          domainThree = await collections.domains.save(domainThreeData)

          await collections.claims.import([
            {
              _from: org._id,
              _to: domain._id,
            },
            {
              _from: orgTwo._id,
              _to: domain._id,
            },
            {
              _from: orgTwo._id,
              _to: domainTwo._id,
            },
            {
              _from: orgTwo._id,
              _to: domainThree._id,
            },
          ])
        })

        afterEach(async () => {
          consoleOutput = []
          await truncate()
        })

        afterAll(async () => {
          await drop()
        })

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
                  'verifiedOrganization',
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
                'verifiedOrganization',
                expectedOrgs[1]._key,
              ),
              endCursor: toGlobalId(
                'verifiedOrganization',
                expectedOrgs[1]._key,
              ),
            },
          }

          expect(orgs).toEqual(expectedStructure)
        })
      })
      describe('using the orderBy field', () => {
        let consoleOutput = []
        const mockedError = (output) => consoleOutput.push(output)
        const mockedWarn = (output) => consoleOutput.push(output)
        console.error = mockedError
        console.warn = mockedWarn

        let query,
          drop,
          truncate,
          collections,
          org,
          orgTwo,
          domain,
          domainTwo,
          domainThree,
          orgThree

        beforeEach(async () => {
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

          org = await collections.organizations.save(orgOneData)
          orgTwo = await collections.organizations.save(orgTwoData)
          orgThree = await collections.organizations.save(orgThreeData)

          domain = await collections.domains.save(domainOneData)
          domainTwo = await collections.domains.save(domainTwoData)
          domainThree = await collections.domains.save(domainThreeData)

          await collections.claims.import([
            {
              _from: org._id,
              _to: domain._id,
            },
            {
              _from: orgTwo._id,
              _to: domain._id,
            },
            {
              _from: orgTwo._id,
              _to: domainTwo._id,
            },
            {
              _from: orgTwo._id,
              _to: domainThree._id,
            },
            {
              _from: orgThree._id,
              _to: domain._id,
            },
            {
              _from: orgThree._id,
              _to: domainTwo._id,
            },
          ])
        })

        afterEach(async () => {
          consoleOutput = []
          await truncate()
        })

        afterAll(async () => {
          await drop()
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
                after: toGlobalId('verifiedOrganization', org._key),
                before: toGlobalId('verifiedOrganization', orgTwo._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', orgTwo._key),
                before: toGlobalId('verifiedOrganization', org._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', org._key),
                before: toGlobalId('verifiedOrganization', orgTwo._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', orgTwo._key),
                before: toGlobalId('verifiedOrganization', org._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', org._key),
                before: toGlobalId('verifiedOrganization', orgTwo._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', orgTwo._key),
                before: toGlobalId('verifiedOrganization', org._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', org._key),
                before: toGlobalId('verifiedOrganization', orgTwo._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', orgTwo._key),
                before: toGlobalId('verifiedOrganization', org._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', org._key),
                before: toGlobalId('verifiedOrganization', orgTwo._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', orgTwo._key),
                before: toGlobalId('verifiedOrganization', org._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', org._key),
                before: toGlobalId('verifiedOrganization', orgTwo._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', orgTwo._key),
                before: toGlobalId('verifiedOrganization', org._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', org._key),
                before: toGlobalId('verifiedOrganization', orgTwo._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', orgTwo._key),
                before: toGlobalId('verifiedOrganization', org._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', org._key),
                before: toGlobalId('verifiedOrganization', orgTwo._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', orgTwo._key),
                before: toGlobalId('verifiedOrganization', org._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', org._key),
                before: toGlobalId('verifiedOrganization', orgTwo._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', orgTwo._key),
                before: toGlobalId('verifiedOrganization', org._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', org._key),
                before: toGlobalId('verifiedOrganization', orgTwo._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', orgTwo._key),
                before: toGlobalId('verifiedOrganization', org._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', org._key),
                before: toGlobalId('verifiedOrganization', orgTwo._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', orgTwo._key),
                before: toGlobalId('verifiedOrganization', org._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', org._key),
                before: toGlobalId('verifiedOrganization', orgTwo._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
                after: toGlobalId('verifiedOrganization', orgTwo._key),
                before: toGlobalId('verifiedOrganization', org._key),
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
                      'verifiedOrganization',
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
                    'verifiedOrganization',
                    expectedOrg._key,
                  ),
                  endCursor: toGlobalId(
                    'verifiedOrganization',
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
        let query, drop

        beforeEach(async () => {
          ;({ query, drop } = await ensure({
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

        afterAll(async () => {
          await drop()
        })

        it('returns empty structure', async () => {
          const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query,
            language: 'en',
            cleanseInput,
            i18n,
          })

          const orgs = await connectionLoader({
            domainId: 'domains/1',
            last: 1,
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
    let i18n
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
      describe('limits are not set', () => {
        let warn, connectionLoader

        beforeAll(() => {
          warn = console.warn
          connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query: jest.fn(),
            language: 'en',
            cleanseInput,
            i18n,
          })
        })
        afterAll(() => {
          console.warn = warn
        })
        it('returns an error message', async () => {
          console.warn = jest.fn()

          try {
            await connectionLoader({
              domainId: '1234',
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'You must provide a `first` or `last` value to properly paginate the `VerifiedOrganization` connection.',
              ),
            )
          }

          expect(console.warn.mock.calls).toEqual([
            [
              'User did not have either `first` or `last` arguments set for: loadVerifiedOrgConnectionsByDomainId.',
            ],
          ])
        })
      })
      describe('user has first and last arguments set at the same time', () => {
        let warn, connectionLoader

        beforeEach(() => {
          warn = console.warn

          connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query: jest.fn(),
            language: 'en',
            cleanseInput,
            i18n,
          })
        })
        afterAll(() => {
          console.warn = warn
        })

        it('returns an error message', async () => {
          console.warn = jest.fn()
          try {
            await connectionLoader({
              domainId: '1234',
              first: 1,
              last: 1,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Passing both `first` and `last` to paginate the `VerifiedOrganization` connection is not supported.',
              ),
            )
          }

          expect(console.warn.mock.calls).toEqual([
            [
              'User attempted to have `first` and `last` arguments set for: loadVerifiedOrgConnectionsByDomainId.',
            ],
          ])
        })
      })
      describe('limits are set below minimum', () => {
        let warn, connectionLoader

        beforeEach(() => {
          warn = console.warn

          connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query: jest.fn(),
            language: 'en',
            cleanseInput,
            i18n,
          })
        })
        afterAll(() => {
          console.warn = warn
        })
        it('rejects values for first below zero', async () => {
          console.warn = jest.fn()

          try {
            await connectionLoader({
              domainId: '1234',
              first: -1,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                '`first` on the `VerifiedOrganization` connection cannot be less than zero.',
              ),
            )
          }

          expect(console.warn.mock.calls).toEqual([
            [
              'User attempted to have `first` set below zero for: loadVerifiedOrgConnectionsByDomainId.',
            ],
          ])
        })
      })
      describe('limits are set below minimum', () => {
        let warn, connectionLoader

        beforeEach(() => {
          warn = console.warn
          connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query: jest.fn(),
            language: 'en',
            cleanseInput,
            i18n,
          })
        })
        afterAll(() => {
          console.warn = warn
        })

        it('rejects values for last below zero', async () => {
          console.warn = jest.fn()
          try {
            await connectionLoader({
              domainId: '1234',
              last: -1,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                '`last` on the `VerifiedOrganization` connection cannot be less than zero.',
              ),
            )
          }

          expect(console.warn.mock.calls).toEqual([
            [
              'User attempted to have `last` set below zero for: loadVerifiedOrgConnectionsByDomainId.',
            ],
          ])
        })
      })
      describe('limits are set above maximum', () => {
        let warn, connectionLoader

        beforeEach(async () => {
          warn = console.warn

          connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query: jest.fn(),
            language: 'en',
            cleanseInput,
            i18n,
          })
        })
        afterAll(() => {
          console.warn = warn
        })
        it('returns an error message', async () => {
          console.warn = jest.fn()

          try {
            await connectionLoader({
              domainId: '1234',
              first: 101,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Requesting `101` records on the `VerifiedOrganization` connection exceeds the `first` limit of 100 records.',
              ),
            )
          }

          expect(console.warn.mock.calls).toEqual([
            [
              'User attempted to have `first` to 101 for: loadVerifiedOrgConnectionsByDomainId.',
            ],
          ])
        })
      })
      describe('last is set', () => {
        let warn, connectionLoader

        beforeEach(() => {
          warn = console.warn

          connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query: jest.fn(),
            language: 'en',
            cleanseInput,
            i18n,
          })
        })
        afterAll(() => {
          console.warn = warn
        })
        it('returns an error message', async () => {
          console.warn = jest.fn()

          try {
            await connectionLoader({
              domainId: '1234',
              last: 101,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Requesting `101` records on the `VerifiedOrganization` connection exceeds the `last` limit of 100 records.',
              ),
            )
          }

          expect(console.warn.mock.calls).toEqual([
            [
              'User attempted to have `last` to 101 for: loadVerifiedOrgConnectionsByDomainId.',
            ],
          ])
        })
      })
      describe('limits are not set to numbers', () => {
        describe('first limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            let warn, connectionLoader

            beforeAll(async () => {
              connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query: jest.fn(),
                language: 'en',
                cleanseInput,
                i18n,
              })
            })
            beforeEach(() => {
              console.warn = jest.fn()
            })
            afterEach(() => {
              console.warn = warn
            })
            afterAll(() => {
              console.warn = warn
            })
            it(`returns an error when first set is to ${stringify(
              invalidInput,
            )}`, async () => {
              try {
                await connectionLoader({
                  first: invalidInput,
                })
              } catch (err) {
                expect(err).toEqual(
                  new Error(
                    `\`first\` must be of type \`number\` not \`${typeof invalidInput}\`.`,
                  ),
                )
              }
              expect(console.warn.mock.calls).toEqual([
                [
                  `User attempted to have \`first\` set as a ${typeof invalidInput} for: loadVerifiedOrgConnectionsByDomainId.`,
                ],
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            let warn, connectionLoader

            beforeAll(() => {
              connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query: jest.fn(),
                language: 'en',
                cleanseInput,
                i18n,
              })
            })
            beforeEach(() => {
              console.warn = jest.fn()
            })
            afterEach(() => {
              console.warn = warn
            })
            afterAll(() => {
              console.warn = warn
            })
            it(`returns an error when last is set to ${stringify(
              invalidInput,
            )}`, async () => {
              try {
                await connectionLoader({
                  last: invalidInput,
                })
              } catch (err) {
                expect(err).toEqual(
                  new Error(
                    `\`last\` must be of type \`number\` not \`${typeof invalidInput}\`.`,
                  ),
                )
              }
              expect(console.warn.mock.calls).toEqual([
                [
                  `User attempted to have \`last\` set as a ${typeof invalidInput} for: loadVerifiedOrgConnectionsByDomainId.`,
                ],
              ])
            })
          })
        })
      })
      describe('given a database error', () => {
        describe('when gathering organizations', () => {
          it('returns an error message', async () => {
            const error = console.error
            console.error = jest.fn()

            const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
              query: jest
                .fn()
                .mockRejectedValue(new Error('Database error occurred.')),
              language: 'en',
              cleanseInput,
              i18n,
            })

            await expect(() =>
              connectionLoader({
                domainId: '1234',
                first: 5,
              }),
            ).rejects.toThrow(
              'Unable to load verified organization(s). Please try again.',
            )

            expect(console.error.mock.calls).toEqual([
              [
                `Database error occurred while user was trying to gather orgs in loadVerifiedOrgConnectionsByDomainId, error: Error: Database error occurred.`,
              ],
            ])
            console.error = error
          })
        })
      })
      describe('given a cursor error', () => {
        describe('when gathering organizations', () => {
          it('returns an error message', async () => {
            const error = console.error
            console.error = jest.fn()

            const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
              query: jest.fn().mockReturnValueOnce({
                next() {
                  throw new Error('Cursor error occurred.')
                },
              }),
              language: 'en',
              cleanseInput,
              i18n,
            })

            await expect(() =>
              connectionLoader({
                domainId: '1234',
                first: 5,
              }),
            ).rejects.toThrow(
              'Unable to load verified organization(s). Please try again.',
            )

            expect(console.error.mock.calls).toEqual([
              [
                `Cursor error occurred while user was trying to gather orgs in loadVerifiedOrgConnectionsByDomainId, error: Error: Cursor error occurred.`,
              ],
            ])
            console.error = error
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
      describe('limits are not set', () => {
        let warn, connectionLoader

        beforeAll(() => {
          warn = console.warn
          connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query: jest.fn(),
            language: 'en',
            cleanseInput,
            i18n,
          })
        })
        afterAll(() => {
          console.warn = warn
        })
        it('returns an error message', async () => {
          console.warn = jest.fn()

          try {
            await connectionLoader({
              domainId: '1234',
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Vous devez fournir une valeur `first` ou `last` pour paginer correctement la connexion `VerifiedOrganization`.',
              ),
            )
          }

          expect(console.warn.mock.calls).toEqual([
            [
              'User did not have either `first` or `last` arguments set for: loadVerifiedOrgConnectionsByDomainId.',
            ],
          ])
        })
      })
      describe('user has first and last arguments set at the same time', () => {
        let warn, connectionLoader

        beforeEach(() => {
          warn = console.warn

          connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query: jest.fn(),
            language: 'en',
            cleanseInput,
            i18n,
          })
        })
        afterAll(() => {
          console.warn = warn
        })

        it('returns an error message', async () => {
          console.warn = jest.fn()
          try {
            await connectionLoader({
              domainId: '1234',
              first: 1,
              last: 1,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                "Passer à la fois `first` et `last` pour paginer la connexion `VerifiedOrganization` n'est pas supporté.",
              ),
            )
          }

          expect(console.warn.mock.calls).toEqual([
            [
              'User attempted to have `first` and `last` arguments set for: loadVerifiedOrgConnectionsByDomainId.',
            ],
          ])
        })
      })
      describe('limits are set below minimum', () => {
        let warn, connectionLoader

        beforeEach(() => {
          warn = console.warn

          connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query: jest.fn(),
            language: 'en',
            cleanseInput,
            i18n,
          })
        })
        afterAll(() => {
          console.warn = warn
        })
        it('rejects values for first below zero', async () => {
          console.warn = jest.fn()

          try {
            await connectionLoader({
              domainId: '1234',
              first: -1,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                '`first` sur la connexion `VerifiedOrganization` ne peut être inférieur à zéro.',
              ),
            )
          }

          expect(console.warn.mock.calls).toEqual([
            [
              'User attempted to have `first` set below zero for: loadVerifiedOrgConnectionsByDomainId.',
            ],
          ])
        })
      })
      describe('limits are set below minimum', () => {
        let warn, connectionLoader

        beforeEach(() => {
          warn = console.warn
          connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query: jest.fn(),
            language: 'en',
            cleanseInput,
            i18n,
          })
        })
        afterAll(() => {
          console.warn = warn
        })

        it('rejects values for last below zero', async () => {
          console.warn = jest.fn()
          try {
            await connectionLoader({
              domainId: '1234',
              last: -1,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                '`last` sur la connexion `VerifiedOrganization` ne peut être inférieur à zéro.',
              ),
            )
          }

          expect(console.warn.mock.calls).toEqual([
            [
              'User attempted to have `last` set below zero for: loadVerifiedOrgConnectionsByDomainId.',
            ],
          ])
        })
      })
      describe('limits are set above maximum', () => {
        let warn, connectionLoader

        beforeEach(async () => {
          warn = console.warn

          connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query: jest.fn(),
            language: 'en',
            cleanseInput,
            i18n,
          })
        })
        afterAll(() => {
          console.warn = warn
        })
        it('returns an error message', async () => {
          console.warn = jest.fn()

          try {
            await connectionLoader({
              domainId: '1234',
              first: 101,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                "La demande d'enregistrements `101` sur la connexion `VerifiedOrganization` dépasse la limite `first` de 100 enregistrements.",
              ),
            )
          }

          expect(console.warn.mock.calls).toEqual([
            [
              'User attempted to have `first` to 101 for: loadVerifiedOrgConnectionsByDomainId.',
            ],
          ])
        })
      })
      describe('last is set', () => {
        let warn, connectionLoader

        beforeEach(() => {
          warn = console.warn

          connectionLoader = loadVerifiedOrgConnectionsByDomainId({
            query: jest.fn(),
            language: 'en',
            cleanseInput,
            i18n,
          })
        })
        afterAll(() => {
          console.warn = warn
        })
        it('returns an error message', async () => {
          console.warn = jest.fn()

          try {
            await connectionLoader({
              domainId: '1234',
              last: 101,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                "La demande d'enregistrements `101` sur la connexion `VerifiedOrganization` dépasse la limite `last` de 100 enregistrements.",
              ),
            )
          }

          expect(console.warn.mock.calls).toEqual([
            [
              'User attempted to have `last` to 101 for: loadVerifiedOrgConnectionsByDomainId.',
            ],
          ])
        })
      })
      describe('limits are not set to numbers', () => {
        describe('first limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            let warn, connectionLoader

            beforeAll(async () => {
              connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query: jest.fn(),
                language: 'en',
                cleanseInput,
                i18n,
              })
            })
            beforeEach(() => {
              console.warn = jest.fn()
            })
            afterEach(() => {
              console.warn = warn
            })
            afterAll(() => {
              console.warn = warn
            })
            it(`returns an error when first set is to ${stringify(
              invalidInput,
            )}`, async () => {
              try {
                await connectionLoader({
                  first: invalidInput,
                })
              } catch (err) {
                expect(err).toEqual(
                  new Error(
                    `\`first\` doit être de type \`number\` et non \`${typeof invalidInput}\`.`,
                  ),
                )
              }
              expect(console.warn.mock.calls).toEqual([
                [
                  `User attempted to have \`first\` set as a ${typeof invalidInput} for: loadVerifiedOrgConnectionsByDomainId.`,
                ],
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            let warn, connectionLoader

            beforeAll(() => {
              connectionLoader = loadVerifiedOrgConnectionsByDomainId({
                query: jest.fn(),
                language: 'en',
                cleanseInput,
                i18n,
              })
            })
            beforeEach(() => {
              console.warn = jest.fn()
            })
            afterEach(() => {
              console.warn = warn
            })
            afterAll(() => {
              console.warn = warn
            })
            it(`returns an error when last is set to ${stringify(
              invalidInput,
            )}`, async () => {
              try {
                await connectionLoader({
                  last: invalidInput,
                })
              } catch (err) {
                expect(err).toEqual(
                  new Error(
                    `\`last\` doit être de type \`number\` et non \`${typeof invalidInput}\`.`,
                  ),
                )
              }
              expect(console.warn.mock.calls).toEqual([
                [
                  `User attempted to have \`last\` set as a ${typeof invalidInput} for: loadVerifiedOrgConnectionsByDomainId.`,
                ],
              ])
            })
          })
        })
      })
      describe('given a database error', () => {
        describe('when gathering organizations', () => {
          it('returns an error message', async () => {
            const error = console.error
            console.error = jest.fn()

            const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
              query: jest
                .fn()
                .mockRejectedValue(new Error('Database error occurred.')),
              language: 'en',
              cleanseInput,
              i18n,
            })

            await expect(() =>
              connectionLoader({
                domainId: '1234',
                first: 5,
              }),
            ).rejects.toThrow(
              'Impossible de charger le(s) organisme(s) vérifié(s). Veuillez réessayer.',
            )

            expect(console.error.mock.calls).toEqual([
              [
                `Database error occurred while user was trying to gather orgs in loadVerifiedOrgConnectionsByDomainId, error: Error: Database error occurred.`,
              ],
            ])
            console.error = error
          })
        })
      })
      describe('given a cursor error', () => {
        describe('when gathering organizations', () => {
          it('returns an error message', async () => {
            const error = console.error
            console.error = jest.fn()

            const connectionLoader = loadVerifiedOrgConnectionsByDomainId({
              query: jest.fn().mockReturnValueOnce({
                next() {
                  throw new Error('Cursor error occurred.')
                },
              }),
              language: 'en',
              cleanseInput,
              i18n,
            })

            await expect(() =>
              connectionLoader({
                domainId: '1234',
                first: 5,
              }),
            ).rejects.toThrow(
              'Impossible de charger le(s) organisme(s) vérifié(s). Veuillez réessayer.',
            )

            expect(console.error.mock.calls).toEqual([
              [
                `Cursor error occurred while user was trying to gather orgs in loadVerifiedOrgConnectionsByDomainId, error: Error: Cursor error occurred.`,
              ],
            ])
            console.error = error
          })
        })
      })
    })
  })
})
