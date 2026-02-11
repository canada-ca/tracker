import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { setupI18n } from '@lingui/core'
import { graphql, GraphQLSchema } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { userRequired, verifiedRequired } from '../../../auth'
import { createMutationSchema } from '../../../mutation'
import { createQuerySchema } from '../../../query'
import { cleanseInput } from '../../../validators'
import { loadOrgByKey, loadOrganizationNamesById } from '../../../organization/loaders'
import { loadUserByKey } from '../../../user/loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url, SIGN_IN_KEY } = process.env

describe('invite user to org', () => {
  let query, drop, truncate, schema, collections, transaction, i18n, tokenize, user, org

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
    tokenize = jest.fn().mockReturnValue('token')
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  // given a successful request to join an org
  describe('given a successful request to join an org', () => {
    beforeAll(async () => {
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
      tokenize = jest.fn().mockReturnValue('token')
    })
    beforeEach(async () => {
      user = await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        emailValidated: true,
        tfaSendMethod: 'email',
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
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
      beforeEach(async () => {
        org = await (
          await collections.organizations.save(
            {
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
            },
            { returnNew: true },
          )
        ).new
      })
      describe('users role is super admin', () => {
        describe('inviting an existing account', () => {
          describe('requested role is admin', () => {
            let secondaryUser
            beforeEach(async () => {
              secondaryUser = await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
              })
              await collections.affiliations.save({
                _from: org._id,
                _to: secondaryUser._id,
                permission: 'admin',
              })
            })
            it('returns status message', async () => {
              const sendInviteRequestEmail = jest.fn()

              const response = await graphql({
                schema,
                source: `
                  mutation {
                    requestOrgAffiliation(input: { orgId: "${toGlobalId('organizations', org._key)}" }) {
                      result {
                        ... on InviteUserToOrgResult {
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
                  request: {
                    language: 'en',
                    protocol: 'https',
                    get: (text) => text,
                  },
                  query,
                  collections: collectionNames,
                  transaction,
                  userKey: user._key,
                  auth: {
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadOrganizationNamesById: loadOrganizationNamesById({ query }),
                  },
                  notify: { sendInviteRequestEmail: sendInviteRequestEmail },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  requestOrgAffiliation: {
                    result: {
                      status: 'Successfully requested invite to organization, and sent notification email.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully requested invite to the org: treasury-board-secretariat.`,
              ])
              expect(sendInviteRequestEmail).toHaveBeenCalledWith({
                user: {
                  _type: 'user',
                  displayName: 'Test Account',
                  id: secondaryUser._key,
                  userName: 'test@email.gc.ca',
                  ...secondaryUser,
                },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
                adminLink: 'https://host/admin/organizations',
              })
            })
          })
        })
      })
    })
  })
  describe('given an unsuccessful invitation', () => {
    beforeAll(async () => {
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
      tokenize = jest.fn().mockReturnValue('token')
    })
    beforeEach(async () => {
      user = (
        await collections.users.save(
          {
            userName: 'test.account@istio.actually.exists',
            emailValidated: true,
            tfaSendMethod: 'email',
          },
          { returnNew: true },
        )
      ).new
      org = (
        await collections.organizations.save(
          {
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
          },
          { returnNew: true },
        )
      ).new
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
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
      describe('user attempts to request an invite to an org that does not exist', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
                   mutation {
                    requestOrgAffiliation(input: { orgId: "${toGlobalId('organizations', 1)}" }) {
                      result {
                        ... on InviteUserToOrgResult {
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
              request: {
                language: 'fr',
                protocol: 'https',
                get: (text) => text,
              },
              query,
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  userName: 'test.account@exists.ca',
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
                loadOrganizationNamesById: {
                  load: jest.fn(),
                },
              },
              notify: { sendInviteRequestEmail: jest.fn() },
              validators: { cleanseInput },
            },
          })

          const error = {
            data: {
              requestOrgAffiliation: {
                result: {
                  code: 400,
                  description: 'Unable to request invite to unknown organization.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to request invite to org: 1 however there is no org associated with that id.`,
          ])
        })
      })
      describe('user has already requested to join org', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'pending',
          })
        })
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
                mutation {
                requestOrgAffiliation(input: { orgId: "${toGlobalId('organizations', org._key)}" }) {
                  result {
                    ... on InviteUserToOrgResult {
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
              request: {
                language: 'en',
              },
              query,
              collections: collectionNames,
              transaction,
              userKey: user._key,
              auth: {
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  _id: user._id,
                  userName: 'test.account@istio.actually.exists',
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _id: org._id }),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
                loadOrganizationNamesById: {
                  load: jest.fn(),
                },
              },
              notify: { sendInviteRequestEmail: jest.fn() },
              validators: { cleanseInput },
            },
          })

          const error = {
            data: {
              requestOrgAffiliation: {
                result: {
                  code: 400,
                  description:
                    'Unable to request invite to organization with which you have already requested to join.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to request invite to org: ${org._key} however they have already requested to join that org.`,
          ])
        })
      })
      describe('user is already a member of org', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
        })
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
                mutation {
                requestOrgAffiliation(input: { orgId: "${toGlobalId('organizations', org._key)}" }) {
                  result {
                    ... on InviteUserToOrgResult {
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
              request: {
                language: 'en',
              },
              query,
              collections: collectionNames,
              transaction,
              userKey: user._key,
              auth: {
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  _id: user._id,
                  userName: 'test.account@istio.actually.exists',
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _id: org._id }),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
                loadOrganizationNamesById: {
                  load: jest.fn(),
                },
              },
              notify: { sendInviteRequestEmail: jest.fn() },
              validators: { cleanseInput },
            },
          })

          const error = {
            data: {
              requestOrgAffiliation: {
                result: {
                  code: 400,
                  description: 'Unable to request invite to organization with which you are already affiliated.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to request invite to org: ${org._key} however they are already affiliated with that org.`,
          ])
        })
      })
    })
    describe('transaction error occurs', () => {
      describe('when creating affiliation', () => {
        it('returns an error message', async () => {
          await graphql({
            schema,
            source: `
                   mutation {
                    requestOrgAffiliation(input: { orgId: "${toGlobalId('organizations', org._key)}" }) {
                      result {
                        ... on InviteUserToOrgResult {
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
              request: {
                language: 'fr',
                protocol: 'https',
                get: (text) => text,
              },
              query,
              collections: collectionNames,
              transaction: jest.fn().mockReturnValue({
                step: jest.fn().mockRejectedValue('trx step err'),
              }),
              userKey: 123,
              auth: {
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  _id: user._id,
                  userName: 'test.account@istio.actually.exists',
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: i18n.locale }),
                loadUserByKey: loadUserByKey({ query }),
                loadOrganizationNamesById: loadOrganizationNamesById({ query }),
              },
              notify: { sendInviteRequestEmail: jest.fn() },
              validators: { cleanseInput },
            },
          })

          expect(consoleOutput).toEqual([
            `Transaction step error occurred while user: 123 attempted to request invite to org: treasury-board-secretariat, error: trx step err`,
          ])
        })
      })
      describe('when committing transaction', () => {
        it('returns an error message', async () => {
          await graphql({
            schema,
            source: `  mutation {
                    requestOrgAffiliation(input: { orgId: "${toGlobalId('organizations', org._key)}" }) {
                      result {
                        ... on InviteUserToOrgResult {
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
              request: {
                language: 'fr',
                protocol: 'https',
                get: (text) => text,
              },
              query,
              collections: collectionNames,
              transaction: jest.fn().mockReturnValue({
                step: jest.fn().mockRejectedValue('trx commit err'),
              }),
              userKey: 123,
              auth: {
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  _id: user._id,
                  userName: 'test.account@istio.actually.exists',
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: i18n.locale }),
                loadUserByKey: loadUserByKey({ query }),
                loadOrganizationNamesById: loadOrganizationNamesById({ query }),
              },
              notify: { sendInviteRequestEmail: jest.fn() },
              validators: { cleanseInput },
            },
          })

          expect(consoleOutput).toEqual([
            `Transaction step error occurred while user: 123 attempted to request invite to org: treasury-board-secretariat, error: trx commit err`,
          ])
        })
      })
    })
  })
})
