import { setupI18n } from '@lingui/core'
import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { checkOrgOwner, userRequired, verifiedRequired } from '../../../auth'
import { loadOrgByKey } from '../../../organization/loaders'
import { loadUserByKey } from '../../../user/loaders'
import { cleanseInput } from '../../../validators'
import { createMutationSchema } from '../../../mutation'
import { createQuerySchema } from '../../../query'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url, SIGN_IN_KEY } = process.env

describe('given a successful leave', () => {
  let query, drop, truncate, schema, collections, transaction, i18n, user, org, domain, domain2

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
    domain = await collections.domains.save({
      domain: 'test.gc.ca',
      slug: 'test-gc-ca',
    })
    await collections.claims.save({
      _from: org._id,
      _to: domain._id,
    })
    domain2 = await collections.domains.save({
      domain: 'test.canada.ca',
      slug: 'test-canada-ca',
    })
    await collections.claims.save({
      _from: org._id,
      _to: domain2._id,
    })

    const dns = await collections.dns.save({ dns: true })
    await collections.domainsDNS.save({
      _from: domain._id,
      _to: dns._id,
    })

    const web = await collections.web.save({ web: true })
    await collections.domainsWeb.save({
      _from: domain._id,
      _to: web._id,
    })

    const webScan = await collections.webScan.save({
      webScan: true,
    })
    await collections.webToWebScans.save({
      _from: web._id,
      _to: webScan._id,
    })

    const dmarcSummary = await collections.dmarcSummaries.save({
      dmarcSummary: true,
    })
    await collections.domainsToDmarcSummaries.save({
      _from: domain._id,
      _to: dmarcSummary._id,
    })
  })
  afterEach(async () => {
    await truncate()
    await drop()
    consoleOutput.length = 0
  })

  describe('user is an org owner', () => {
    beforeEach(async () => {
      await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'owner',
      })
    })
    describe('only one org claims the domains', () => {
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
        it('returns status success message', async () => {
          const response = await graphql({
            schema,
            source: `
                mutation {
                  leaveOrganization (
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on LeaveOrganizationResult {
                        status
                      }
                      ... on AffiliationError {
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
                checkOrgOwner: checkOrgOwner({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: user._key,
                }),
              },
              validators: { cleanseInput },
            },
          })

          const expectedResult = {
            data: {
              leaveOrganization: {
                result: {
                  status: 'Successfully left organization: treasury-board-secretariat',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([`User: ${user._key} successfully left org: treasury-board-secretariat.`])
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
        it('returns status success message', async () => {
          const response = await graphql({
            schema,
            source: `
                mutation {
                  leaveOrganization (
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on LeaveOrganizationResult {
                        status
                      }
                      ... on AffiliationError {
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
                checkOrgOwner: checkOrgOwner({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: user._key,
                }),
              },
              validators: { cleanseInput },
            },
          })

          const expectedResult = {
            data: {
              leaveOrganization: {
                result: {
                  status: "L'organisation a été quittée avec succès: treasury-board-secretariat",
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([`User: ${user._key} successfully left org: treasury-board-secretariat.`])
        })
      })
    })
    describe('multiple orgs claims the domains', () => {
      let org2
      beforeEach(async () => {
        org2 = await collections.organizations.save({
          orgDetails: {
            en: {
              slug: 'treasury-board-secretariat-2',
              acronym: 'TBS',
              name: 'Treasury Board of Canada Secretariat',
              zone: 'FED',
              sector: 'TBS',
              country: 'Canada',
              province: 'Ontario',
              city: 'Ottawa',
            },
            fr: {
              slug: 'secretariat-conseil-tresor-2',
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
        await collections.claims.save({
          _from: org2._id,
          _to: domain._id,
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
        it('returns status success message', async () => {
          const response = await graphql({
            schema,
            source: `
                mutation {
                  leaveOrganization (
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on LeaveOrganizationResult {
                        status
                      }
                      ... on AffiliationError {
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
                checkOrgOwner: checkOrgOwner({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: user._key,
                }),
              },
              validators: { cleanseInput },
            },
          })

          const expectedResult = {
            data: {
              leaveOrganization: {
                result: {
                  status: 'Successfully left organization: treasury-board-secretariat',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([`User: ${user._key} successfully left org: treasury-board-secretariat.`])
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
        it('returns status success message', async () => {
          const response = await graphql({
            schema,
            source: `
                mutation {
                  leaveOrganization (
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on LeaveOrganizationResult {
                        status
                      }
                      ... on AffiliationError {
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
                checkOrgOwner: checkOrgOwner({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: user._key,
                }),
              },
              validators: { cleanseInput },
            },
          })

          const expectedResult = {
            data: {
              leaveOrganization: {
                result: {
                  status: "L'organisation a été quittée avec succès: treasury-board-secretariat",
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([`User: ${user._key} successfully left org: treasury-board-secretariat.`])
        })
      })
    })
  })
})
describe('given an unsuccessful leave', () => {
  let schema, i18n

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
  })
  afterEach(async () => {
    consoleOutput.length = 0
  })
  describe('language is set to english', () => {
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
    describe('org cannot be found', () => {
      it('returns an error message', async () => {
        const response = await graphql({
          schema,
          source: `
              mutation {
                leaveOrganization (
                  input: {
                    orgId: "${toGlobalId('organizations', 123)}"
                  }
                ) {
                  result {
                    ... on LeaveOrganizationResult {
                      status
                    }
                    ... on AffiliationError {
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
            query: jest.fn(),
            collections: jest.fn(),
            transaction: jest.fn(),
            userKey: '123',
            auth: {
              checkOrgOwner: jest.fn().mockReturnValue(false),
              userRequired: jest.fn().mockReturnValue({
                _key: '123',
                emailValidated: true,
              }),
              verifiedRequired: verifiedRequired({ i18n }),
            },
            loaders: {
              loadOrgByKey: {
                load: jest.fn().mockReturnValue(undefined),
              },
            },
            validators: { cleanseInput },
          },
        })

        const expectedResult = {
          data: {
            leaveOrganization: {
              result: {
                code: 400,
                description: 'Unable to leave undefined organization.',
              },
            },
          },
        }

        expect(response).toEqual(expectedResult)
        expect(consoleOutput).toEqual([`User 123 attempted to leave undefined organization: 123`])
      })
    })
    describe('user is not an org owner', () => {
      describe('when removing affiliation information', () => {
        it('throws an error', async () => {
          const mockedQuery = jest.fn().mockReturnValue({
            count: 1,
            all: jest.fn().mockReturnValue([]),
          })

          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest.fn().mockRejectedValue(new Error('Step error occurred.')),
            abort: jest.fn(),
          })

          const response = await graphql({
            schema,
            source: `
                mutation {
                  leaveOrganization (
                    input: {
                      orgId: "${toGlobalId('organizations', 123)}"
                    }
                  ) {
                    result {
                      ... on LeaveOrganizationResult {
                        status
                      }
                      ... on AffiliationError {
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
              collections: jest.fn({ property: 'string' }),
              transaction: mockedTransaction,
              userKey: '123',
              auth: {
                checkOrgOwner: jest.fn().mockReturnValue(false),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                  emailValidated: true,
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 123 }),
                },
              },
              validators: { cleanseInput },
            },
          })

          const error = [new GraphQLError('Unable leave organization. Please try again.')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Trx step error occurred when removing user: 123 affiliation with org: 123: Error: Step error occurred.`,
          ])
        })
      })
    })
    describe('transaction commit error occurs', () => {
      it('throws an error', async () => {
        const mockedQuery = jest.fn().mockReturnValue({
          count: 1,
          next: jest.fn().mockReturnValue({
            count: 1,
          }),
        })

        const mockedTransaction = jest.fn().mockReturnValue({
          step: jest.fn().mockReturnValue(new Error('Step error occurred.')),
          commit: jest.fn().mockRejectedValue(new Error('Trx Commit Error')),
          abort: jest.fn(),
        })

        const response = await graphql({
          schema,
          source: `
              mutation {
                leaveOrganization (
                  input: {
                    orgId: "${toGlobalId('organizations', 123)}"
                  }
                ) {
                  result {
                    ... on LeaveOrganizationResult {
                      status
                    }
                    ... on AffiliationError {
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
            collections: jest.fn({ property: 'string' }),
            transaction: mockedTransaction,
            userKey: '123',
            auth: {
              checkOrgOwner: jest.fn().mockReturnValue(false),
              userRequired: jest.fn().mockReturnValue({
                _key: '123',
                emailValidated: true,
              }),
              verifiedRequired: verifiedRequired({ i18n }),
            },
            loaders: {
              loadOrgByKey: {
                load: jest.fn().mockReturnValue({ _key: 123 }),
              },
            },
            validators: { cleanseInput },
          },
        })

        const error = [new GraphQLError('Unable leave organization. Please try again.')]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Trx commit error occurred when user: 123 attempted to leave org: 123: Error: Trx Commit Error`,
        ])
      })
    })
  })
  describe('language is set to french', () => {
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
    describe('org cannot be found', () => {
      it('returns an error message', async () => {
        const response = await graphql({
          schema,
          source: `
              mutation {
                leaveOrganization (
                  input: {
                    orgId: "${toGlobalId('organizations', 123)}"
                  }
                ) {
                  result {
                    ... on LeaveOrganizationResult {
                      status
                    }
                    ... on AffiliationError {
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
            query: jest.fn(),
            collections: jest.fn(),
            transaction: jest.fn(),
            userKey: '123',
            auth: {
              checkOrgOwner: jest.fn().mockReturnValue(false),
              userRequired: jest.fn().mockReturnValue({
                _key: '123',
                emailValidated: true,
              }),
              verifiedRequired: verifiedRequired({ i18n }),
            },
            loaders: {
              loadOrgByKey: {
                load: jest.fn().mockReturnValue(undefined),
              },
            },
            validators: { cleanseInput },
          },
        })

        const expectedResult = {
          data: {
            leaveOrganization: {
              result: {
                code: 400,
                description: 'Impossible de quitter une organisation non définie.',
              },
            },
          },
        }

        expect(response).toEqual(expectedResult)
        expect(consoleOutput).toEqual([`User 123 attempted to leave undefined organization: 123`])
      })
    })
    describe('user is not an org owner', () => {
      describe('when removing affiliation information', () => {
        it('throws an error', async () => {
          const mockedQuery = jest.fn().mockReturnValue({
            count: 1,
            all: jest.fn().mockReturnValue([]),
          })

          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest.fn().mockRejectedValue(new Error('Step error occurred.')),
            abort: jest.fn(),
          })

          const response = await graphql({
            schema,
            source: `
                mutation {
                  leaveOrganization (
                    input: {
                      orgId: "${toGlobalId('organizations', 123)}"
                    }
                  ) {
                    result {
                      ... on LeaveOrganizationResult {
                        status
                      }
                      ... on AffiliationError {
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
              collections: jest.fn({ property: 'string' }),
              transaction: mockedTransaction,
              userKey: '123',
              auth: {
                checkOrgOwner: jest.fn().mockReturnValue(false),
                userRequired: jest.fn().mockReturnValue({
                  _key: '123',
                  emailValidated: true,
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 123 }),
                },
              },
              validators: { cleanseInput },
            },
          })

          const error = [new GraphQLError("Impossible de quitter l'organisation. Veuillez réessayer.")]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Trx step error occurred when removing user: 123 affiliation with org: 123: Error: Step error occurred.`,
          ])
        })
      })
    })
    describe('transaction commit error occurs', () => {
      it('throws an error', async () => {
        const mockedQuery = jest.fn().mockReturnValue({
          count: 1,
          next: jest.fn().mockReturnValue({
            count: 1,
          }),
        })

        const mockedTransaction = jest.fn().mockReturnValue({
          step: jest.fn().mockReturnValue(new Error('Step error occurred.')),
          commit: jest.fn().mockRejectedValue(new Error('Trx Commit Error')),
          abort: jest.fn(),
        })

        const response = await graphql({
          schema,
          source: `
              mutation {
                leaveOrganization (
                  input: {
                    orgId: "${toGlobalId('organizations', 123)}"
                  }
                ) {
                  result {
                    ... on LeaveOrganizationResult {
                      status
                    }
                    ... on AffiliationError {
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
            collections: jest.fn({ property: 'string' }),
            transaction: mockedTransaction,
            userKey: '123',
            auth: {
              checkOrgOwner: jest.fn().mockReturnValue(false),
              userRequired: jest.fn().mockReturnValue({
                _key: '123',
                emailValidated: true,
              }),
              verifiedRequired: verifiedRequired({ i18n }),
            },
            loaders: {
              loadOrgByKey: {
                load: jest.fn().mockReturnValue({ _key: 123 }),
              },
            },
            validators: { cleanseInput },
          },
        })

        const error = [new GraphQLError("Impossible de quitter l'organisation. Veuillez réessayer.")]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Trx commit error occurred when user: 123 attempted to leave org: 123: Error: Trx Commit Error`,
        ])
      })
    })
  })
})
