import { setupI18n } from '@lingui/core'
import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { checkSuperAdmin, userRequired } from '../../../auth'
import { loadOrgByKey } from '../../../organization/loaders'
import { loadUserByKey } from '../../../user/loaders'
import { cleanseInput } from '../../../validators'
import { createMutationSchema } from '../../../mutation'
import { createQuerySchema } from '../../../query'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the closeAccount mutation', () => {
  let i18n, query, drop, truncate, schema, collections, transaction, user, org, domain

  const consoleOutput = []
  const mockedConsole = (output) => consoleOutput.push(output)
  beforeAll(() => {
    console.info = mockedConsole
    console.warn = mockedConsole
    console.error = mockedConsole
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
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful closing of an account', () => {
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
    })
    afterEach(async () => {
      await truncate()
      await drop()
    })
    describe('user is closing their own account', () => {
      beforeEach(async () => {
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
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'user',
        })
      })
      it('removes the users affiliations', async () => {
        await graphql({
          schema,
          source: `
            mutation {
              closeAccountSelf(input: {}) {
                result {
                  ... on CloseAccountResult {
                    status
                  }
                  ... on CloseAccountError {
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
              checkSuperAdmin: checkSuperAdmin({
                i18n,
                userKey: user._key,
                query,
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

        await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`

        const testAffiliationCursor = await query`
              FOR aff IN affiliations
                OPTIONS { waitForSync: true }
                RETURN aff
            `
        const testAffiliation = await testAffiliationCursor.next()
        expect(testAffiliation).toEqual(undefined)
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
        it('returns a status message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                closeAccountSelf(input: {}) {
                  result {
                    ... on CloseAccountResult {
                      status
                    }
                    ... on CloseAccountError {
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
                checkSuperAdmin: checkSuperAdmin({
                  i18n,
                  userKey: user._key,
                  query,
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

          const expectedResponse = {
            data: {
              closeAccountSelf: {
                result: {
                  status: 'Successfully closed account.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([`User: ${user._key} successfully closed user: ${user._id} account.`])
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
        it('returns a status message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                closeAccountSelf(input: {}) {
                  result {
                    ... on CloseAccountResult {
                      status
                    }
                    ... on CloseAccountError {
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
                checkSuperAdmin: checkSuperAdmin({
                  i18n,
                  userKey: user._key,
                  query,
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

          const expectedResponse = {
            data: {
              closeAccountSelf: {
                result: {
                  status: 'Le compte a été fermé avec succès.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([`User: ${user._key} successfully closed user: ${user._id} account.`])
        })
      })
      it('closes the users account', async () => {
        await graphql({
          schema,
          source: `
            mutation {
              closeAccountSelf(input: {}) {
                result {
                  ... on CloseAccountResult {
                    status
                  }
                  ... on CloseAccountError {
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
              checkSuperAdmin: checkSuperAdmin({
                i18n,
                userKey: user._key,
                query,
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

        await query`FOR user IN users OPTIONS { waitForSync: true } RETURN user`

        const testUserCursor = await query`FOR user IN users OPTIONS { waitForSync: true } RETURN user`
        const testUser = await testUserCursor.next()
        expect(testUser).toEqual(undefined)
      })
    })
    describe('super admin is closing another users account', () => {
      let superAdmin, superAdminOrg
      beforeEach(async () => {
        superAdmin = await collections.users.save({
          userName: 'super.admin@istio.actually.exists',
          emailValidated: true,
        })
        superAdminOrg = await collections.organizations.save({
          orgDetails: {
            en: {
              slug: 'super-admin',
              acronym: 'SA',
              name: 'Super Admin',
              zone: 'FED',
              sector: 'TBS',
              country: 'Canada',
              province: 'Ontario',
              city: 'Ottawa',
            },
            fr: {
              slug: 'super-admin',
              acronym: 'SA',
              name: 'Super Admin',
              zone: 'FED',
              sector: 'TBS',
              country: 'Canada',
              province: 'Ontario',
              city: 'Ottawa',
            },
          },
        })
        await collections.affiliations.save({
          _from: superAdminOrg._id,
          _to: superAdmin._id,
          permission: 'super_admin',
        })
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
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'user',
        })
      })
      it('removes the users affiliations', async () => {
        await graphql({
          schema,
          source: `
            mutation {
              closeAccountSelf(input: {}) {
                result {
                  ... on CloseAccountResult {
                    status
                  }
                  ... on CloseAccountError {
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
              checkSuperAdmin: checkSuperAdmin({
                i18n,
                userKey: user._key,
                query,
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
            },
            loaders: {
              loadOrgByKey: loadOrgByKey({
                query,
                language: 'en',
                i18n,
                userKey: user._key,
              }),
              loadUserByKey: loadUserByKey({
                query,
                userKey: user._key,
                i18n,
              }),
            },
            validators: { cleanseInput },
          },
        })

        await query`FOR aff IN affiliations OPTIONS { waitForSync: true } RETURN aff`

        const testAffiliationCursor = await query`
              FOR aff IN affiliations
                OPTIONS { waitForSync: true }
                FILTER aff._from != ${superAdminOrg._id}
                RETURN aff
            `
        const testAffiliation = await testAffiliationCursor.next()
        expect(testAffiliation).toEqual(undefined)
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
        it('returns a status message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                closeAccountSelf(input: {}) {
                  result {
                    ... on CloseAccountResult {
                      status
                    }
                    ... on CloseAccountError {
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
                checkSuperAdmin: checkSuperAdmin({
                  i18n,
                  userKey: user._key,
                  query,
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
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: user._key,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          })

          const expectedResponse = {
            data: {
              closeAccountSelf: {
                result: {
                  status: 'Successfully closed account.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([`User: ${user._key} successfully closed user: ${user._id} account.`])
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
        it('returns a status message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                closeAccountSelf(input: {}) {
                  result {
                    ... on CloseAccountResult {
                      status
                    }
                    ... on CloseAccountError {
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
                checkSuperAdmin: checkSuperAdmin({
                  i18n,
                  userKey: user._key,
                  query,
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
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: user._key,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          })

          const expectedResponse = {
            data: {
              closeAccountSelf: {
                result: {
                  status: 'Le compte a été fermé avec succès.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([`User: ${user._key} successfully closed user: ${user._id} account.`])
        })
      })
      it('closes the users account', async () => {
        await graphql({
          schema,
          source: `
            mutation {
              closeAccountOther(input:{
                userId: "${toGlobalId('user', user._key)}"
              }) {
                result {
                  ... on CloseAccountResult {
                    status
                  }
                  ... on CloseAccountError {
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
            userKey: superAdmin._key,
            request: { ip: '127.0.0.1' },
            auth: {
              checkSuperAdmin: checkSuperAdmin({
                i18n,
                userKey: superAdmin._key,
                query,
              }),
              userRequired: userRequired({
                i18n,
                userKey: superAdmin._key,
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: superAdmin._key,
                  i18n,
                }),
              }),
            },
            loaders: {
              loadUserByKey: loadUserByKey({
                query,
                userKey: superAdmin._key,
                i18n,
              }),
            },
            validators: { cleanseInput },
          },
        })

        await query`FOR user IN users OPTIONS { waitForSync: true } RETURN user`

        const testUserCursor = await query`
          FOR user IN users
            OPTIONS { waitForSync: true }
            FILTER user.userName != "super.admin@istio.actually.exists"
            RETURN user
        `
        const testUser = await testUserCursor.next()
        expect(testUser).toEqual(undefined)
      })
    })
  })

  describe('given an unsuccessful closing of an account', () => {
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
      describe('user attempts to close another users account', () => {
        describe('requesting user is not a super admin', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  closeAccountOther(input:{
                    userId: "${toGlobalId('user', '456')}"
                  }) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: '123',
                request: { ip: '127.0.0.1' },
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(false),
                  userRequired: jest.fn().mockReturnValue({ _key: '123' }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                },
                validators: { cleanseInput },
              },
            })

            const expectedResponse = {
              data: {
                closeAccountOther: {
                  result: {
                    code: 400,
                    description: "Permission error: Unable to close other user's account.",
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: 123 attempted to close user: 456 account, but requesting user is not a super admin.`,
            ])
          })
        })
        describe('requested user is undefined', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  closeAccountOther(input:{
                    userId: "${toGlobalId('user', '456')}"
                  }) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: '123',
                request: { ip: '127.0.0.1' },
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({ _key: '123' }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                },
                validators: { cleanseInput },
              },
            })

            const expectedResponse = {
              data: {
                closeAccountOther: {
                  result: {
                    code: 400,
                    description: 'Unable to close account of an undefined user.',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: 123 attempted to close user: 456 account, but requested user is undefined.`,
            ])
          })
        })
      })
      describe('trx step error occurs', () => {
        describe('when removing the users affiliations', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([{ count: 2 }]),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockRejectedValue(new Error('trx step error')),
              commit: jest.fn(),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
                mutation {
                  closeAccountSelf(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: '123',
                request: { ip: '127.0.0.1' },
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({ _key: '123', _id: 'users/123' }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({ _key: '123' }),
                  },
                },
                validators: { cleanseInput },
              },
            })

            const error = [new GraphQLError('Unable to close account. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when removing users remaining affiliations when user: 123 attempted to close account: users/123: Error: trx step error`,
            ])
          })
        })
        describe('when removing the user', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([{ count: 2 }]),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockReturnValueOnce().mockRejectedValue(new Error('trx step error')),
              commit: jest.fn(),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
                mutation {
                  closeAccountSelf(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: '123',
                request: { ip: '127.0.0.1' },
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({ _key: '123', _id: 'users/123' }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({ _key: '123' }),
                  },
                },
                validators: { cleanseInput },
              },
            })

            const error = [new GraphQLError('Unable to close account. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when removing user: 123 attempted to close account: users/123: Error: trx step error`,
            ])
          })
        })
      })
      describe('trx commit error occurs', () => {
        it('throws an error', async () => {
          const mockedCursor = {
            all: jest.fn().mockReturnValue([{ count: 2 }]),
          }

          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest.fn().mockReturnValue(),
            commit: jest.fn().mockRejectedValue(new Error('trx commit error')),
            abort: jest.fn(),
          })

          const response = await graphql({
            schema,
            source: `
              mutation {
                closeAccountSelf(input: {}) {
                  result {
                    ... on CloseAccountResult {
                      status
                    }
                    ... on CloseAccountError {
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
              userKey: '123',
              request: { ip: '127.0.0.1' },
              auth: {
                checkSuperAdmin: jest.fn().mockReturnValue(true),
                userRequired: jest.fn().mockReturnValue({ _key: '123', _id: 'users/123' }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: '123',
                }),
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({ _key: '123' }),
                },
              },
              validators: { cleanseInput },
            },
          })

          const error = [new GraphQLError('Unable to close account. Please try again.')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Trx commit error occurred when user: 123 attempted to close account: users/123: Error: trx commit error`,
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
      describe('user attempts to close another users account', () => {
        describe('requesting user is not a super admin', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  closeAccountOther(input:{
                    userId: "${toGlobalId('user', '456')}"
                  }) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: '123',
                request: { ip: '127.0.0.1' },
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(false),
                  userRequired: jest.fn().mockReturnValue({ _key: '123' }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                },
                validators: { cleanseInput },
              },
            })

            const expectedResponse = {
              data: {
                closeAccountOther: {
                  result: {
                    code: 400,
                    description: "Erreur de permission: Impossible de fermer le compte d'un autre utilisateur.",
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: 123 attempted to close user: 456 account, but requesting user is not a super admin.`,
            ])
          })
        })
        describe('requested user is undefined', () => {
          it('returns an error', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  closeAccountOther(input:{
                    userId: "${toGlobalId('user', '456')}"
                  }) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: '123',
                request: { ip: '127.0.0.1' },
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({ _key: '123' }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                },
                validators: { cleanseInput },
              },
            })

            const expectedResponse = {
              data: {
                closeAccountOther: {
                  result: {
                    code: 400,
                    description: "Impossible de fermer le compte d'un utilisateur non défini.",
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: 123 attempted to close user: 456 account, but requested user is undefined.`,
            ])
          })
        })
      })
      describe('trx step error occurs', () => {
        describe('when removing the users affiliations', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([{ count: 2 }]),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockRejectedValue(new Error('trx step error')),
              commit: jest.fn(),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
                mutation {
                  closeAccountSelf(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: '123',
                request: { ip: '127.0.0.1' },
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({ _key: '123', _id: 'users/123' }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({ _key: '123' }),
                  },
                },
                validators: { cleanseInput },
              },
            })

            const error = [new GraphQLError('Impossible de fermer le compte. Veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when removing users remaining affiliations when user: 123 attempted to close account: users/123: Error: trx step error`,
            ])
          })
        })
        describe('when removing the user', () => {
          it('throws an error', async () => {
            const mockedCursor = {
              all: jest.fn().mockReturnValue([{ count: 2 }]),
            }

            const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockReturnValueOnce().mockRejectedValue(new Error('trx step error')),
              commit: jest.fn(),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
                mutation {
                  closeAccountSelf(input: {}) {
                    result {
                      ... on CloseAccountResult {
                        status
                      }
                      ... on CloseAccountError {
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
                userKey: '123',
                request: { ip: '127.0.0.1' },
                auth: {
                  checkSuperAdmin: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({ _key: '123', _id: 'users/123' }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    i18n,
                    userKey: '123',
                  }),
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({ _key: '123' }),
                  },
                },
                validators: { cleanseInput },
              },
            })

            const error = [new GraphQLError('Impossible de fermer le compte. Veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when removing user: 123 attempted to close account: users/123: Error: trx step error`,
            ])
          })
        })
      })
      describe('trx commit error occurs', () => {
        it('throws an error', async () => {
          const mockedCursor = {
            all: jest.fn().mockReturnValue([{ count: 2 }]),
          }

          const mockedQuery = jest.fn().mockReturnValue(mockedCursor)

          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest.fn().mockReturnValue(),
            commit: jest.fn().mockRejectedValue(new Error('trx commit error')),
            abort: jest.fn(),
          })

          const response = await graphql({
            schema,
            source: `
              mutation {
                closeAccountSelf(input: {}) {
                  result {
                    ... on CloseAccountResult {
                      status
                    }
                    ... on CloseAccountError {
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
              userKey: '123',
              request: { ip: '127.0.0.1' },
              auth: {
                checkSuperAdmin: jest.fn().mockReturnValue(true),
                userRequired: jest.fn().mockReturnValue({ _key: '123', _id: 'users/123' }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: '123',
                }),
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({ _key: '123' }),
                },
              },
              validators: { cleanseInput },
            },
          })

          const error = [new GraphQLError('Impossible de fermer le compte. Veuillez réessayer.')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Trx commit error occurred when user: 123 attempted to close account: users/123: Error: trx commit error`,
          ])
        })
      })
    })
  })
})
