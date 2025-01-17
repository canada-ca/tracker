import { setupI18n } from '@lingui/core'
import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput } from '../../../validators'
import { checkPermission, userRequired, verifiedRequired } from '../../../auth'
import { loadUserByKey } from '../../../user/loaders'
import { loadOrgByKey } from '../../loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('archiving an organization', () => {
  let query, drop, truncate, schema, collections, transaction, user, i18n

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(() => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
  })
  afterEach(() => {
    consoleOutput.length = 0
  })
  describe('given a successful archival', () => {
    let org, domain
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
    beforeEach(async () => {
      ;({ query, drop, truncate, collections, transaction } = await ensure({
        variables: {
          dbname: dbNameFromFile(__filename),
          username: 'root',
          rootPassword: rootPass,
          password: rootPass,
          url,
        },

        schema: dbschema,
      }))
      user = await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        emailValidated: true,
      })
      domain = await collections.domains.save({
        domain: 'test.gc.ca',
        slug: 'test-gc-ca',
      })
    })
    afterEach(async () => {
      await truncate()
      await drop()
    })
    describe('users permission is super admin', () => {
      describe('org is verified', () => {
        beforeEach(async () => {
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
          const superAdminOrg = await collections.organizations.save({
            verified: false,
            orgDetails: {
              en: {
                slug: 'super-admin',
                acronym: 'SA',
              },
              fr: {
                slug: 'super-admin',
                acronym: 'SA',
              },
            },
          })
          await collections.affiliations.save({
            _from: superAdminOrg._id,
            _to: user._id,
            permission: 'super_admin',
          })
          await collections.claims.save({
            _from: org._id,
            _to: domain._id,
          })
        })

        describe('org is the only one claiming the domain', () => {
          it('archives the domain', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  archiveOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`

            const domainCursor = await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`
            const domainCheck = await domainCursor.next()
            expect(domainCheck.archived).toEqual(true)
          })
        })
        describe('multiple orgs claim the domain', () => {
          beforeEach(async () => {
            const secondOrg = await collections.organizations.save({})
            await collections.claims.save({
              _from: secondOrg._id,
              _to: domain._id,
            })
          })
          it('does not archive the domain', async () => {
            await graphql({
              schema,
              source: `
                mutation {
                  archiveOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
                      }
                      ... on OrganizationError {
                        code
                        description
                      }
                    }
                  }
                }
              `,
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                },
              },
            })

            await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`

            const domainCursor = await query`FOR domain IN domains OPTIONS { waitForSync: true } RETURN domain`
            const domainCheck = await domainCursor.next()
            expect(domainCheck.archived).toEqual(false || undefined)
          })
        })
      })
    })
  })
  describe('given an unsuccessful archival', () => {
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
      describe('the requested org is undefined', () => {
        it('returns an error', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                archiveOrganization(
                  input: {
                    orgId: "${toGlobalId('organization', 123)}"
                  }
                ) {
                  result {
                    ... on OrganizationResult {
                      status
                      organization {
                        name
                      }
                    }
                    ... on OrganizationError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction,
              userKey: 123,
              request: { ip: '127.0.0.1' },
              auth: {
                checkPermission: jest.fn(),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
            },
          })

          const expectedResponse = {
            data: {
              archiveOrganization: {
                result: {
                  code: 400,
                  description: 'Unable to archive unknown organization.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to archive org: 123, but there is no org associated with that id.`,
          ])
        })
      })
      describe('given an incorrect permission', () => {
        describe('users belong to the org', () => {
          describe('users role is admin', () => {
            describe('user attempts to archive an org', () => {
              it('returns an error', async () => {
                const response = await graphql({
                  schema,
                  source: `
                    mutation {
                      archiveOrganization(
                        input: {
                          orgId: "${toGlobalId('organization', 123)}"
                        }
                      ) {
                        result {
                          ... on OrganizationResult {
                            status
                            organization {
                              name
                            }
                          }
                          ... on OrganizationError {
                            code
                            description
                          }
                        }
                      }
                    }
                  `,
                  rootValue: null,
                  contextValue: {
                    i18n,
                    query,
                    collections: collectionNames,
                    transaction,
                    userKey: 123,
                    request: { ip: '127.0.0.1' },
                    auth: {
                      checkPermission: jest.fn().mockReturnValue('admin'),
                      userRequired: jest.fn(),
                      verifiedRequired: jest.fn(),
                    },
                    validators: { cleanseInput },
                    loaders: {
                      loadOrgByKey: {
                        load: jest.fn().mockReturnValue({
                          _key: 123,
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
                        }),
                      },
                    },
                  },
                })

                const expectedResponse = {
                  data: {
                    archiveOrganization: {
                      result: {
                        code: 403,
                        description:
                          'Permission Denied: Please contact super admin for help with archiving organization.',
                      },
                    },
                  },
                }

                expect(response).toEqual(expectedResponse)
                expect(consoleOutput).toEqual([
                  `User: 123 attempted to archive org: 123, however they do not have the correct permission level. Permission: admin`,
                ])
              })
            })
          })
        })
      })
      describe('given a trx commit error', () => {
        it('throws an error', async () => {
          const mockedCursor = {
            all: jest.fn().mockReturnValueOnce([]).mockReturnValue([]),
          }

          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest.fn().mockReturnValue({}),
            commit: jest.fn().mockRejectedValue(new Error('Commit Error')),
            abort: jest.fn(),
          })

          const response = await graphql({
            schema,
            source: `
            mutation {
              archiveOrganization(
                input: {
                  orgId: "${toGlobalId('organization', 123)}"
                }
              ) {
                result {
                  ... on OrganizationResult {
                    status
                    organization {
                      name
                    }
                  }
                  ... on OrganizationError {
                    code
                    description
                  }
                }
              }
            }
          `,
            rootValue: null,
            contextValue: {
              i18n,
              query: mockedQuery,
              collections: collectionNames,
              transaction: mockedTransaction,
              userKey: 123,
              request: { ip: '127.0.0.1' },
              auth: {
                checkPermission: jest.fn().mockReturnValue('super_admin'),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 123,
                    verified: false,
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
                  }),
                },
              },
            },
          })

          const error = [new GraphQLError('Unable to archive organization. Please try again.')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Trx commit error occurred for user: 123 while attempting archive of org: 123, Error: Commit Error`,
          ])
        })
      })
    })
  })
})
