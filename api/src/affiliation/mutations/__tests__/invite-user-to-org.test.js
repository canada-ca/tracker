import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { setupI18n } from '@lingui/core'
import { graphql, GraphQLSchema } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { checkPermission, userRequired, verifiedRequired, tfaRequired } from '../../../auth'
import { createMutationSchema } from '../../../mutation'
import { createQuerySchema } from '../../../query'
import { cleanseInput } from '../../../validators'
import { loadOrgByKey } from '../../../organization/loaders'
import { loadUserByKey, loadUserByUserName } from '../../../user/loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url, SIGN_IN_KEY } = process.env

describe('invite user to org', () => {
  let query, drop, truncate, schema, collections, transaction, i18n, tokenize, user, org, userToInvite

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

  describe('given a successful invitation', () => {
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
      let org
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
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        describe('inviting an existing account', () => {
          describe('requested role is super_admin', () => {
            let secondaryUser
            beforeEach(async () => {
              secondaryUser = await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
              })
            })
            it('returns status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql({
                schema,
                source: `
                    mutation {
                      inviteUserToOrg(
                        input: {
                          userName: "test@email.gc.ca"
                          requestedRole: SUPER_ADMIN
                          orgId: "${toGlobalId('organizations', org._key)}"
                        }
                      ) {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'Successfully invited user to organization, and sent notification email.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: {
                  _type: 'user',
                  displayName: 'Test Account',
                  id: secondaryUser._key,
                  userName: 'test@email.gc.ca',
                  ...secondaryUser,
                },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
              })
            })
          })
          describe('requested role is admin', () => {
            let secondaryUser
            beforeEach(async () => {
              secondaryUser = await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
              })
            })
            it('returns status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql({
                schema,
                source: `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: ADMIN
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'Successfully invited user to organization, and sent notification email.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: {
                  _type: 'user',
                  displayName: 'Test Account',
                  id: secondaryUser._key,
                  userName: 'test@email.gc.ca',
                  ...secondaryUser,
                },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
              })
            })
          })
          describe('requested role is user', () => {
            let secondaryUser
            beforeEach(async () => {
              secondaryUser = await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
              })
            })
            it('returns status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql({
                schema,
                source: `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: USER
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'Successfully invited user to organization, and sent notification email.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: {
                  _type: 'user',
                  displayName: 'Test Account',
                  id: secondaryUser._key,
                  userName: 'test@email.gc.ca',
                  ...secondaryUser,
                },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
              })
            })
          })
        })
        describe('inviting a non-existing account', () => {
          describe('requested role is super_admin', () => {
            it('returns status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()
              const response = await graphql({
                schema,
                source: `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: SUPER_ADMIN
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'Successfully sent invitation to service, and organization email.',
                    },
                  },
                },
              }

              const token = tokenize({
                parameters: {
                  userName: 'test@email.gc.ca',
                  orgId: org._id,
                  requestedRole: 'super_admin',
                },
              })
              const createAccountLink = `https://host/create-user/${token}`
              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: {
                  userName: 'test@email.gc.ca',
                },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
                createAccountLink,
              })
            })
          })
          describe('requested role is admin', () => {
            it('returns status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()

              const response = await graphql({
                schema,
                source: `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: ADMIN
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'Successfully sent invitation to service, and organization email.',
                    },
                  },
                },
              }

              const token = tokenize({
                parameters: {
                  userName: 'test@email.gc.ca',
                  orgId: org._id,
                  requestedRole: 'admin',
                },
              })
              const createAccountLink = `https://host/create-user/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: {
                  userName: 'test@email.gc.ca',
                },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
                createAccountLink,
              })
            })
          })
          describe('requested role is user', () => {
            it('returns status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()

              const response = await graphql({
                schema,
                source: `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: USER
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'Successfully sent invitation to service, and organization email.',
                    },
                  },
                },
              }

              const token = tokenize({
                parameters: {
                  userName: 'test@email.gc.ca',
                  orgId: org._id,
                  requestedRole: 'user',
                },
              })
              const createAccountLink = `https://host/create-user/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: {
                  userName: 'test@email.gc.ca',
                },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
                createAccountLink,
              })
            })
          })
        })
      })
      describe('users role is admin', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        describe('inviting an existing account', () => {
          describe('requested role is admin', () => {
            let secondaryUser
            beforeEach(async () => {
              secondaryUser = await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
              })
            })
            it('returns status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql({
                schema,
                source: `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: ADMIN
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'Successfully invited user to organization, and sent notification email.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: {
                  _type: 'user',
                  displayName: 'Test Account',
                  id: secondaryUser._key,
                  userName: 'test@email.gc.ca',
                  ...secondaryUser,
                },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
              })
            })
          })
          describe('requested role is user', () => {
            let secondaryUser
            beforeEach(async () => {
              secondaryUser = await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
              })
            })
            it('returns status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql({
                schema,
                source: `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: USER
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'Successfully invited user to organization, and sent notification email.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: {
                  _type: 'user',
                  displayName: 'Test Account',
                  id: secondaryUser._key,
                  userName: 'test@email.gc.ca',
                  ...secondaryUser,
                },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
              })
            })
          })
        })
        describe('inviting a non-existing account', () => {
          describe('requested role is admin', () => {
            it('returns status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()

              const response = await graphql({
                schema,
                source: `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: ADMIN
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'Successfully sent invitation to service, and organization email.',
                    },
                  },
                },
              }

              const token = tokenize({
                parameters: {
                  userName: 'test@email.gc.ca',
                  orgId: org._id,
                  requestedRole: 'admin',
                },
              })
              const createAccountLink = `https://host/create-user/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: {
                  userName: 'test@email.gc.ca',
                },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
                createAccountLink,
              })
            })
          })
          describe('requested role is user', () => {
            it('returns status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()

              const response = await graphql({
                schema,
                source: `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: USER
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'Successfully sent invitation to service, and organization email.',
                    },
                  },
                },
              }

              const token = tokenize({
                parameters: {
                  userName: 'test@email.gc.ca',
                  orgId: org._id,
                  requestedRole: 'user',
                },
              })
              const createAccountLink = `https://host/create-user/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: {
                  userName: 'test@email.gc.ca',
                },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
                createAccountLink,
              })
            })
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
      let org
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
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        describe('inviting an existing account', () => {
          describe('requested role is super_admin', () => {
            let secondaryUser
            beforeEach(async () => {
              secondaryUser = await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
              })
            })
            it('returns a status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql({
                schema,
                source: `
                    mutation {
                      inviteUserToOrg(
                        input: {
                          userName: "test@email.gc.ca"
                          requestedRole: SUPER_ADMIN
                          orgId: "${toGlobalId('organizations', org._key)}"
                        }
                      ) {
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
                  },
                  query,
                  collections: collectionNames,
                  transaction,
                  userKey: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status:
                        "L'utilisateur a été invité avec succès à l'organisation et l'email de notification a été envoyé.",
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: {
                  _type: 'user',
                  displayName: 'Test Account',
                  id: secondaryUser._key,
                  userName: 'test@email.gc.ca',
                  ...secondaryUser,
                },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
              })
            })
          })
          describe('requested role is admin', () => {
            let secondaryUser
            beforeEach(async () => {
              secondaryUser = await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
              })
            })
            it('returns a status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql({
                schema,
                source: `
                    mutation {
                      inviteUserToOrg(
                        input: {
                          userName: "test@email.gc.ca"
                          requestedRole: ADMIN
                          orgId: "${toGlobalId('organizations', org._key)}"
                        }
                      ) {
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
                  },
                  query,
                  collections: collectionNames,
                  transaction,
                  userKey: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status:
                        "L'utilisateur a été invité avec succès à l'organisation et l'email de notification a été envoyé.",
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: {
                  _type: 'user',
                  displayName: 'Test Account',
                  id: secondaryUser._key,
                  userName: 'test@email.gc.ca',
                  ...secondaryUser,
                },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
              })
            })
          })
          describe('requested role is user', () => {
            let secondaryUser
            beforeEach(async () => {
              secondaryUser = await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
              })
            })
            it('returns a status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql({
                schema,
                source: `
                    mutation {
                      inviteUserToOrg(
                        input: {
                          userName: "test@email.gc.ca"
                          requestedRole: USER
                          orgId: "${toGlobalId('organizations', org._key)}"
                        }
                      ) {
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
                  },
                  query,
                  collections: collectionNames,
                  transaction,
                  userKey: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status:
                        "L'utilisateur a été invité avec succès à l'organisation et l'email de notification a été envoyé.",
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: {
                  _type: 'user',
                  displayName: 'Test Account',
                  id: secondaryUser._key,
                  userName: 'test@email.gc.ca',
                  ...secondaryUser,
                },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
              })
            })
          })
        })
        describe('inviting a non-existing account', () => {
          describe('requested role is super_admin', () => {
            it('returns a status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()

              const response = await graphql({
                schema,
                source: `
                    mutation {
                      inviteUserToOrg(
                        input: {
                          userName: "test@email.gc.ca"
                          requestedRole: SUPER_ADMIN
                          orgId: "${toGlobalId('organizations', org._key)}"
                        }
                      ) {
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
                  userKey: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: "Envoi réussi de l'invitation au service, et de l'email de l'organisation.",
                    },
                  },
                },
              }

              const token = tokenize({
                parameters: {
                  userName: 'test@email.gc.ca',
                  orgId: org._id,
                  requestedRole: 'super_admin',
                },
              })
              const createAccountLink = `https://host/create-user/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: { userName: 'test@email.gc.ca' },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
                createAccountLink,
              })
            })
          })
          describe('requested role is admin', () => {
            it('returns a status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()

              const response = await graphql({
                schema,
                source: `
                    mutation {
                      inviteUserToOrg(
                        input: {
                          userName: "test@email.gc.ca"
                          requestedRole: ADMIN
                          orgId: "${toGlobalId('organizations', org._key)}"
                        }
                      ) {
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
                  userKey: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: "Envoi réussi de l'invitation au service, et de l'email de l'organisation.",
                    },
                  },
                },
              }

              const token = tokenize({
                parameters: {
                  userName: 'test@email.gc.ca',
                  orgId: org._id,
                  requestedRole: 'admin',
                },
              })
              const createAccountLink = `https://host/create-user/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: { userName: 'test@email.gc.ca' },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
                createAccountLink,
              })
            })
          })
          describe('requested role is user', () => {
            it('returns a status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()

              const response = await graphql({
                schema,
                source: `
                    mutation {
                      inviteUserToOrg(
                        input: {
                          userName: "test@email.gc.ca"
                          requestedRole: USER
                          orgId: "${toGlobalId('organizations', org._key)}"
                        }
                      ) {
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
                  userKey: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: "Envoi réussi de l'invitation au service, et de l'email de l'organisation.",
                    },
                  },
                },
              }

              const token = tokenize({
                parameters: {
                  userName: 'test@email.gc.ca',
                  orgId: org._id,
                  requestedRole: 'user',
                },
              })
              const createAccountLink = `https://host/create-user/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: { userName: 'test@email.gc.ca' },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
                createAccountLink,
              })
            })
          })
        })
      })
      describe('users role is admin', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        describe('inviting an existing account', () => {
          describe('requested role is admin', () => {
            let secondaryUser
            beforeEach(async () => {
              secondaryUser = await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
              })
            })
            it('returns a status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql({
                schema,
                source: `
                    mutation {
                      inviteUserToOrg(
                        input: {
                          userName: "test@email.gc.ca"
                          requestedRole: ADMIN
                          orgId: "${toGlobalId('organizations', org._key)}"
                        }
                      ) {
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
                  },
                  query,
                  collections: collectionNames,
                  transaction,
                  userKey: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status:
                        "L'utilisateur a été invité avec succès à l'organisation et l'email de notification a été envoyé.",
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: {
                  _type: 'user',
                  displayName: 'Test Account',
                  id: secondaryUser._key,
                  userName: 'test@email.gc.ca',
                  ...secondaryUser,
                },

                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
              })
            })
          })
          describe('requested role is user', () => {
            let secondaryUser
            beforeEach(async () => {
              secondaryUser = await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
              })
            })
            it('returns a status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql({
                schema,
                source: `
                    mutation {
                      inviteUserToOrg(
                        input: {
                          userName: "test@email.gc.ca"
                          requestedRole: USER
                          orgId: "${toGlobalId('organizations', org._key)}"
                        }
                      ) {
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
                  },
                  query,
                  collections: collectionNames,
                  transaction,
                  userKey: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status:
                        "L'utilisateur a été invité avec succès à l'organisation et l'email de notification a été envoyé.",
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: {
                  _type: 'user',
                  displayName: 'Test Account',
                  id: secondaryUser._key,
                  userName: 'test@email.gc.ca',
                  ...secondaryUser,
                },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
              })
            })
          })
        })
        describe('inviting a non-existing account', () => {
          describe('requested role is admin', () => {
            it('returns a status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()

              const response = await graphql({
                schema,
                source: `
                    mutation {
                      inviteUserToOrg(
                        input: {
                          userName: "test@email.gc.ca"
                          requestedRole: ADMIN
                          orgId: "${toGlobalId('organizations', org._key)}"
                        }
                      ) {
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
                  userKey: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: "Envoi réussi de l'invitation au service, et de l'email de l'organisation.",
                    },
                  },
                },
              }

              const token = tokenize({
                parameters: {
                  userName: 'test@email.gc.ca',
                  orgId: org._id,
                  requestedRole: 'admin',
                },
              })
              const createAccountLink = `https://host/create-user/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: { userName: 'test@email.gc.ca' },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
                createAccountLink,
              })
            })
          })
          describe('requested role is user', () => {
            it('returns a status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()

              const response = await graphql({
                schema,
                source: `
                    mutation {
                      inviteUserToOrg(
                        input: {
                          userName: "test@email.gc.ca"
                          requestedRole: USER
                          orgId: "${toGlobalId('organizations', org._key)}"
                        }
                      ) {
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
                  userKey: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    tokenize,
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                    tfaRequired: tfaRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              })

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: "Envoi réussi de l'invitation au service, et de l'email de l'organisation.",
                    },
                  },
                },
              }

              const token = tokenize({
                parameters: {
                  userName: 'test@email.gc.ca',
                  orgId: org._id,
                  requestedRole: 'user',
                },
              })
              const createAccountLink = `https://host/create-user/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: { userName: 'test@email.gc.ca' },
                orgNameEN: 'Treasury Board of Canada Secretariat',
                orgNameFR: 'Secrétariat du Conseil Trésor du Canada',
                createAccountLink,
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
      userToInvite = (
        await collections.users.save(
          {
            userName: 'usertoinvite@istio.actually.exists',
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
      describe('user attempts to invite themselves', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
                mutation {
                  inviteUserToOrg(
                    input: {
                      userName: "${user.userName}"
                      requestedRole: USER
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
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
                checkPermission: jest.fn().mockReturnValue('admin'),
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  userName: 'test.account@istio.actually.exists',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: i18n.locale }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query, i18n }),
              },
              notify: { sendOrgInviteCreateAccount: jest.fn() },
              validators: { cleanseInput },
            },
          })

          const error = {
            data: {
              inviteUserToOrg: {
                result: {
                  code: 400,
                  description: "Impossible de s'inviter à un org.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([`User: 123 attempted to invite themselves to ${org._key}.`])
        })
      })
      describe('user attempts to invite to an org that does not exist', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
                mutation {
                  inviteUserToOrg(
                    input: {
                      userName: "test@email.gc.ca"
                      requestedRole: USER
                      orgId: "${toGlobalId('organizations', 1)}"
                    }
                  ) {
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
                checkPermission: jest.fn().mockReturnValue('admin'),
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  userName: 'test.account@exists.ca',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
                loadUserByUserName: {
                  load: jest.fn(),
                },
              },
              notify: { sendOrgInviteCreateAccount: jest.fn() },
              validators: { cleanseInput },
            },
          })

          const error = {
            data: {
              inviteUserToOrg: {
                result: {
                  code: 400,
                  description: "Impossible d'inviter un utilisateur à une organisation inconnue.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to invite user: test@email.gc.ca to 1 however there is no org associated with that id.`,
          ])
        })
      })
      describe('user with undefined permission attempts to invite a user', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
                mutation {
                  inviteUserToOrg(
                    input: {
                      userName: "test@email.gc.ca"
                      requestedRole: USER
                      orgId: "${toGlobalId('organizations', 123)}"
                    }
                  ) {
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
                checkPermission: jest.fn().mockReturnValue(undefined),
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  userName: 'test.account@exists.ca',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 123 }),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
                loadUserByUserName: {
                  load: jest.fn(),
                },
              },
              notify: { sendOrgInviteCreateAccount: jest.fn() },
              validators: { cleanseInput },
            },
          })

          const error = {
            data: {
              inviteUserToOrg: {
                result: {
                  code: 403,
                  description:
                    "Permission refusée : Veuillez contacter l'administrateur de l'organisation pour obtenir de l'aide concernant les invitations d'utilisateurs.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to invite user: test@email.gc.ca to org: 123 with role: user but does not have permission to do so.`,
          ])
        })
      })
      describe('user with user level permission attempts to invite a user', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
                mutation {
                  inviteUserToOrg(
                    input: {
                      userName: "test@email.gc.ca"
                      requestedRole: USER
                      orgId: "${toGlobalId('organizations', 123)}"
                    }
                  ) {
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
                checkPermission: jest.fn().mockReturnValue('user'),
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  userName: 'test.account@exists.ca',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 123 }),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
                loadUserByUserName: {
                  load: jest.fn(),
                },
              },
              notify: { sendOrgInviteCreateAccount: jest.fn() },
              validators: { cleanseInput },
            },
          })

          const error = {
            data: {
              inviteUserToOrg: {
                result: {
                  code: 403,
                  description:
                    "Permission refusée : Veuillez contacter l'administrateur de l'organisation pour obtenir de l'aide concernant les invitations d'utilisateurs.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to invite user: test@email.gc.ca to org: 123 with role: user but does not have permission to do so.`,
          ])
        })
      })
      describe('user with admin level permission attempts to invite a user to super_admin permission', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
                mutation {
                  inviteUserToOrg(
                    input: {
                      userName: "test@email.gc.ca"
                      requestedRole: SUPER_ADMIN
                      orgId: "${toGlobalId('organizations', 123)}"
                    }
                  ) {
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
                checkPermission: jest.fn().mockReturnValue('admin'),
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  userName: 'test.account@exists.ca',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 123 }),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
                loadUserByUserName: {
                  load: jest.fn(),
                },
              },
              notify: { sendOrgInviteCreateAccount: jest.fn() },
              validators: { cleanseInput },
            },
          })

          const error = {
            data: {
              inviteUserToOrg: {
                result: {
                  code: 403,
                  description:
                    "Permission refusée : Veuillez contacter l'administrateur de l'organisation pour obtenir de l'aide concernant les invitations d'utilisateurs.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to invite user: test@email.gc.ca to org: 123 with role: super_admin but does not have permission to do so.`,
          ])
        })
      })
      describe('transaction error occurs', () => {
        describe('when creating affiliation', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  inviteUserToOrg(
                    input: {
                      userName: "${userToInvite.userName}"
                      requestedRole: USER
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
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
                  abort: jest.fn(),
                }),
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  tokenize,
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@exists.ca',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: i18n.locale }),
                  loadUserByKey: loadUserByKey({ query }),
                  loadUserByUserName: loadUserByUserName({ query, i18n }),
                },
                notify: { sendOrgInviteCreateAccount: jest.fn() },
                validators: { cleanseInput },
              },
            })

            const error = {
              data: {
                inviteUserToOrg: {
                  result: {
                    code: 500,
                    description: "Impossible d'inviter un utilisateur. Veuillez réessayer.",
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction step error occurred while user: 123 attempted to invite user: ${userToInvite._key} to org: ${org.orgDetails.fr.slug}, error: trx step err`,
            ])
          })
        })
        describe('when committing transaction', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  inviteUserToOrg(
                    input: {
                      userName: "${userToInvite.userName}"
                      requestedRole: USER
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
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
                  step: jest.fn(),
                  commit: jest.fn().mockRejectedValue('trx commit err'),
                  abort: jest.fn(),
                }),
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  tokenize,
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@exists.ca',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: i18n.locale }),
                  loadUserByKey: loadUserByKey({ query }),
                  loadUserByUserName: loadUserByUserName({ query }),
                },
                notify: {
                  sendOrgInviteCreateAccount: jest.fn(),
                  sendOrgInviteEmail: jest.fn(),
                },
                validators: { cleanseInput },
              },
            })

            const error = {
              data: {
                inviteUserToOrg: {
                  result: {
                    code: 500,
                    description: "Impossible d'inviter un utilisateur. Veuillez réessayer.",
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction commit error occurred while user: 123 attempted to invite user: ${userToInvite._key} to org: secretariat-conseil-tresor, error: trx commit err`,
            ])
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
      describe('user attempts to invite themselves', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
                mutation {
                  inviteUserToOrg(
                    input: {
                      userName: "test.account@istio.actually.exists"
                      requestedRole: USER
                      orgId: "${toGlobalId('organizations', 1)}"
                    }
                  ) {
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
                checkPermission: jest.fn().mockReturnValue('admin'),
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  userName: 'test.account@istio.actually.exists',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn(),
                  },
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                  loadUserByUserName: {
                    load: jest.fn(),
                  },
                },
              },
              notify: { sendOrgInviteCreateAccount: jest.fn() },
              validators: { cleanseInput },
            },
          })

          const error = {
            data: {
              inviteUserToOrg: {
                result: {
                  code: 400,
                  description: 'Unable to invite yourself to an org.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([`User: 123 attempted to invite themselves to 1.`])
        })
      })
      describe('user attempts to invite to an org that does not exist', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
                mutation {
                  inviteUserToOrg(
                    input: {
                      userName: "test@email.gc.ca"
                      requestedRole: USER
                      orgId: "${toGlobalId('organizations', 1)}"
                    }
                  ) {
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
                checkPermission: jest.fn().mockReturnValue('admin'),
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  userName: 'test.account@exists.ca',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
                loadUserByUserName: {
                  load: jest.fn(),
                },
              },
              notify: { sendOrgInviteCreateAccount: jest.fn() },
              validators: { cleanseInput },
            },
          })

          const error = {
            data: {
              inviteUserToOrg: {
                result: {
                  code: 400,
                  description: 'Unable to invite user to unknown organization.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to invite user: test@email.gc.ca to 1 however there is no org associated with that id.`,
          ])
        })
      })
      describe('user with undefined permission attempts to invite a user', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
                mutation {
                  inviteUserToOrg(
                    input: {
                      userName: "test@email.gc.ca"
                      requestedRole: USER
                      orgId: "${toGlobalId('organizations', 123)}"
                    }
                  ) {
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
                checkPermission: jest.fn().mockReturnValue(undefined),
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  userName: 'test.account@exists.ca',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 123 }),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
                loadUserByUserName: {
                  load: jest.fn(),
                },
              },
              notify: { sendOrgInviteCreateAccount: jest.fn() },
              validators: { cleanseInput },
            },
          })

          const error = {
            data: {
              inviteUserToOrg: {
                result: {
                  code: 403,
                  description: 'Permission Denied: Please contact organization admin for help with user invitations.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to invite user: test@email.gc.ca to org: 123 with role: user but does not have permission to do so.`,
          ])
        })
      })
      describe('user with user level permission attempts to invite a user', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
                mutation {
                  inviteUserToOrg(
                    input: {
                      userName: "test@email.gc.ca"
                      requestedRole: USER
                      orgId: "${toGlobalId('organizations', 123)}"
                    }
                  ) {
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
                checkPermission: jest.fn().mockReturnValue('user'),
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  userName: 'test.account@exists.ca',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 123 }),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
                loadUserByUserName: {
                  load: jest.fn(),
                },
              },
              notify: { sendOrgInviteCreateAccount: jest.fn() },
              validators: { cleanseInput },
            },
          })

          const error = {
            data: {
              inviteUserToOrg: {
                result: {
                  code: 403,
                  description: 'Permission Denied: Please contact organization admin for help with user invitations.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to invite user: test@email.gc.ca to org: 123 with role: user but does not have permission to do so.`,
          ])
        })
      })
      describe('user with admin level permission attempts to invite a user to super_admin permission', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
                mutation {
                  inviteUserToOrg(
                    input: {
                      userName: "test@email.gc.ca"
                      requestedRole: SUPER_ADMIN
                      orgId: "${toGlobalId('organizations', 123)}"
                    }
                  ) {
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
                checkPermission: jest.fn().mockReturnValue('admin'),
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  userName: 'test.account@exists.ca',
                }),
                verifiedRequired: jest.fn(),
                tfaRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({ _key: 123 }),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
                loadUserByUserName: {
                  load: jest.fn(),
                },
              },
              notify: { sendOrgInviteCreateAccount: jest.fn() },
              validators: { cleanseInput },
            },
          })

          const error = {
            data: {
              inviteUserToOrg: {
                result: {
                  code: 403,
                  description: 'Permission Denied: Please contact organization admin for help with user invitations.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to invite user: test@email.gc.ca to org: 123 with role: super_admin but does not have permission to do so.`,
          ])
        })
      })
      describe('transaction error occurs', () => {
        describe('when creating affiliation', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  inviteUserToOrg(
                    input: {
                      userName: "${userToInvite.userName}"
                      requestedRole: USER
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
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
                  abort: jest.fn(),
                }),
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  tokenize,
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@exists.ca',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: i18n.locale }),
                  loadUserByKey: loadUserByKey({ query }),
                  loadUserByUserName: loadUserByUserName({ query }),
                },
                notify: { sendOrgInviteCreateAccount: jest.fn() },
                validators: { cleanseInput },
              },
            })

            const error = {
              data: {
                inviteUserToOrg: {
                  result: {
                    code: 500,
                    description: 'Unable to invite user. Please try again.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction step error occurred while user: 123 attempted to invite user: ${userToInvite._key} to org: treasury-board-secretariat, error: trx step err`,
            ])
          })
        })
        describe('when committing transaction', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  inviteUserToOrg(
                    input: {
                      userName: "${userToInvite.userName}"
                      requestedRole: USER
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
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
                  step: jest.fn(),
                  commit: jest.fn().mockRejectedValue('trx commit err'),
                  abort: jest.fn(),
                }),
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  tokenize,
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@exists.ca',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: i18n.locale }),
                  loadUserByKey: loadUserByKey({ query }),
                  loadUserByUserName: loadUserByUserName({ query }),
                },
                notify: {
                  sendOrgInviteCreateAccount: jest.fn(),
                  sendOrgInviteEmail: jest.fn(),
                },
                validators: { cleanseInput },
              },
            })

            const error = {
              data: {
                inviteUserToOrg: {
                  result: {
                    code: 500,
                    description: 'Unable to invite user. Please try again.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction commit error occurred while user: 123 attempted to invite user: ${userToInvite._key} to org: treasury-board-secretariat, error: trx commit err`,
            ])
          })
        })
      })
    })
  })
})
