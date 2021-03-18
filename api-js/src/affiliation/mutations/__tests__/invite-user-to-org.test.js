import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'
import bcrypt from 'bcryptjs'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { checkPermission, userRequired } from '../../../auth'
import { databaseOptions } from '../../../../database-options'
import { createMutationSchema } from '../../../mutation'
import { createQuerySchema } from '../../../query'
import { cleanseInput } from '../../../validators'
import { orgLoaderByKey } from '../../../organization/loaders'
import { userLoaderByKey, userLoaderByUserName } from '../../../user/loaders'

const { DB_PASS: rootPass, DB_URL: url, SIGN_IN_KEY } = process.env

describe('invite user to org', () => {
  let query, drop, truncate, schema, collections, transaction, i18n, tokenize

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
    ;({ query, drop, truncate, collections, transaction } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
    tokenize = jest.fn().mockReturnValue('token')
  })

  beforeEach(async () => {
    await graphql(
      schema,
      `
        mutation {
          signUp(
            input: {
              displayName: "Test Account"
              userName: "test.account@istio.actually.exists"
              password: "testpassword123"
              confirmPassword: "testpassword123"
              preferredLang: FRENCH
            }
          ) {
            result {
              ... on AuthResult {
                user {
                  id
                }
              }
            }
          }
        }
      `,
      null,
      {
        query,
        auth: {
          bcrypt,
          tokenize,
        },
        validators: {
          cleanseInput,
        },
        loaders: {
          userLoaderByUserName: userLoaderByUserName(query),
        },
      },
    )
    consoleOutput.length = 0
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
    describe('given a successful invitation', () => {
      let org, user
      beforeEach(async () => {
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
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN MERGE({ id: user._key }, user)
        `
        user = await userCursor.next()
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
              await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
                preferredLang: 'english',
              })
              const userCursor = await query`
                  FOR user IN users
                    FILTER user.userName == "test@email.gc.ca"
                    RETURN MERGE({ id: user._key, _type: 'user' }, user)
                `
              secondaryUser = await userCursor.next()
            })
            it('returns status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql(
                schema,
                `
                    mutation {
                      inviteUserToOrg(
                        input: {
                          userName: "test@email.gc.ca"
                          requestedRole: SUPER_ADMIN
                          orgId: "${toGlobalId('organizations', org._key)}"
                          preferredLang: ENGLISH
                        }
                      ) {
                        result {
                          ... on InviteUserToOrgResult {
                            status
                          }
                          ... on InviteUserToOrgError {
                            code
                            description
                          }
                        }
                      }
                    }
                  `,
                null,
                {
                  i18n,
                  request: {
                    language: 'en',
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status:
                        'Successfully invited user to organization, and sent notification email.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: secondaryUser,
                orgName: 'Treasury Board of Canada Secretariat',
              })
            })
          })
          describe('requested role is admin', () => {
            let secondaryUser
            beforeEach(async () => {
              await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
                preferredLang: 'english',
              })
              const userCursor = await query`
                FOR user IN users
                  FILTER user.userName == "test@email.gc.ca"
                  RETURN MERGE({ id: user._key, _type: 'user' }, user)
              `
              secondaryUser = await userCursor.next()
            })
            it('returns status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: ADMIN
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: ENGLISH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'en',
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status:
                        'Successfully invited user to organization, and sent notification email.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: secondaryUser,
                orgName: 'Treasury Board of Canada Secretariat',
              })
            })
          })
          describe('requested role is user', () => {
            let secondaryUser
            beforeEach(async () => {
              await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
                preferredLang: 'english',
              })
              const userCursor = await query`
                FOR user IN users
                  FILTER user.userName == "test@email.gc.ca"
                  RETURN MERGE({ id: user._key, _type: 'user' }, user)
              `
              secondaryUser = await userCursor.next()
            })
            it('returns status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: USER
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: ENGLISH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'en',
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status:
                        'Successfully invited user to organization, and sent notification email.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: secondaryUser,
                orgName: 'Treasury Board of Canada Secretariat',
              })
            })
          })
        })
        describe('inviting a non-existing account', () => {
          describe('requested role is super_admin', () => {
            it('returns status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()
              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: SUPER_ADMIN
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: ENGLISH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'en',
                    protocol: 'http',
                    get: (text) => text,
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status:
                        'Successfully sent invitation to service, and organization email.',
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
              const createAccountLink = `http://host/create-user/${token}`
              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: {
                  userName: 'test@email.gc.ca',
                  preferredLang: 'english',
                },
                orgName: 'Treasury Board of Canada Secretariat',
                createAccountLink,
              })
            })
          })
          describe('requested role is admin', () => {
            it('returns status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()

              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: ADMIN
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: ENGLISH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'en',
                    protocol: 'http',
                    get: (text) => text,
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status:
                        'Successfully sent invitation to service, and organization email.',
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
              const createAccountLink = `http://host/create-user/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: {
                  userName: 'test@email.gc.ca',
                  preferredLang: 'english',
                },
                orgName: 'Treasury Board of Canada Secretariat',
                createAccountLink,
              })
            })
          })
          describe('requested role is user', () => {
            it('returns status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()

              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: USER
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: ENGLISH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'en',
                    protocol: 'http',
                    get: (text) => text,
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status:
                        'Successfully sent invitation to service, and organization email.',
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
              const createAccountLink = `http://host/create-user/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: {
                  userName: 'test@email.gc.ca',
                  preferredLang: 'english',
                },
                orgName: 'Treasury Board of Canada Secretariat',
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
              await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
                preferredLang: 'english',
              })
              const userCursor = await query`
                FOR user IN users
                  FILTER user.userName == "test@email.gc.ca"
                  RETURN MERGE({ id: user._key, _type: 'user' }, user)
              `
              secondaryUser = await userCursor.next()
            })
            it('returns status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: ADMIN
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: ENGLISH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'en',
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status:
                        'Successfully invited user to organization, and sent notification email.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: secondaryUser,
                orgName: 'Treasury Board of Canada Secretariat',
              })
            })
          })
          describe('requested role is user', () => {
            let secondaryUser
            beforeEach(async () => {
              await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
                preferredLang: 'english',
              })
              const userCursor = await query`
                FOR user IN users
                  FILTER user.userName == "test@email.gc.ca"
                  RETURN MERGE({ id: user._key, _type: 'user' }, user)
              `
              secondaryUser = await userCursor.next()
            })
            it('returns status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: USER
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: ENGLISH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'en',
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status:
                        'Successfully invited user to organization, and sent notification email.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: secondaryUser,
                orgName: 'Treasury Board of Canada Secretariat',
              })
            })
          })
        })
        describe('inviting a non-existing account', () => {
          describe('requested role is admin', () => {
            it('returns status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()

              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: ADMIN
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: ENGLISH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'en',
                    protocol: 'http',
                    get: (text) => text,
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status:
                        'Successfully sent invitation to service, and organization email.',
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
              const createAccountLink = `http://host/create-user/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: {
                  userName: 'test@email.gc.ca',
                  preferredLang: 'english',
                },
                orgName: 'Treasury Board of Canada Secretariat',
                createAccountLink,
              })
            })
          })
          describe('requested role is user', () => {
            it('returns status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()

              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: USER
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: ENGLISH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'en',
                    protocol: 'http',
                    get: (text) => text,
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status:
                        'Successfully sent invitation to service, and organization email.',
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
              const createAccountLink = `http://host/create-user/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: {
                  userName: 'test@email.gc.ca',
                  preferredLang: 'english',
                },
                orgName: 'Treasury Board of Canada Secretariat',
                createAccountLink,
              })
            })
          })
        })
      })
    })
    describe('given an unsuccessful invitation', () => {
      describe('user attempts to invite themselves', () => {
        let user
        beforeEach(async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          user = await userCursor.next()
        })
        it('returns an error message', async () => {
          const sendOrgInviteCreateAccount = jest.fn()

          const response = await graphql(
            schema,
            `
              mutation {
                inviteUserToOrg(
                  input: {
                    userName: "test.account@istio.actually.exists"
                    requestedRole: USER
                    orgId: "${toGlobalId('organizations', 1)}"
                    preferredLang: FRENCH
                  }
                ) {
                  result {
                    ... on InviteUserToOrgResult {
                      status
                    }
                    ... on InviteUserToOrgError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'fr',
                protocol: 'http',
                get: (text) => text,
              },
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                tokenize,
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              notify: { sendOrgInviteCreateAccount },
              validators: { cleanseInput },
            },
          )

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
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to invite themselves to 1.`,
          ])
        })
      })
      describe('user attempts to invite to an org that does not exist', () => {
        let user
        beforeEach(async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          user = await userCursor.next()
        })
        it('returns an error message', async () => {
          const sendOrgInviteCreateAccount = jest.fn()

          const response = await graphql(
            schema,
            `
              mutation {
                inviteUserToOrg(
                  input: {
                    userName: "test@email.gc.ca"
                    requestedRole: USER
                    orgId: "${toGlobalId('organizations', 1)}"
                    preferredLang: FRENCH
                  }
                ) {
                  result {
                    ... on InviteUserToOrgResult {
                      status
                    }
                    ... on InviteUserToOrgError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'fr',
                protocol: 'http',
                get: (text) => text,
              },
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                tokenize,
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              notify: { sendOrgInviteCreateAccount },
              validators: { cleanseInput },
            },
          )

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
            `User: ${user._key} attempted to invite user: test@email.gc.ca to 1 however there is no org associated with that id.`,
          ])
        })
      })
      describe('user with undefined permission attempts to invite a user', () => {
        let org, user
        beforeEach(async () => {
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

          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          user = await userCursor.next()
        })
        it('returns an error message', async () => {
          const sendOrgInviteCreateAccount = jest.fn()

          const response = await graphql(
            schema,
            `
              mutation {
                inviteUserToOrg(
                  input: {
                    userName: "test@email.gc.ca"
                    requestedRole: USER
                    orgId: "${toGlobalId('organizations', org._key)}"
                    preferredLang: FRENCH
                  }
                ) {
                  result {
                    ... on InviteUserToOrgResult {
                      status
                    }
                    ... on InviteUserToOrgError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'fr',
                protocol: 'http',
                get: (text) => text,
              },
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                tokenize,
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              notify: { sendOrgInviteCreateAccount },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              inviteUserToOrg: {
                result: {
                  code: 403,
                  description:
                    'Permission Denied: Please contact organization admin for help with user invitations.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to invite user: test@email.gc.ca to org: ${org._key} with role: user but does not have permission to do so.`,
          ])
        })
      })
      describe('user with user level permission attempts to invite a user', () => {
        let org, user
        beforeEach(async () => {
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
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          user = await userCursor.next()
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
        })
        it('returns an error message', async () => {
          const sendOrgInviteCreateAccount = jest.fn()

          const response = await graphql(
            schema,
            `
              mutation {
                inviteUserToOrg(
                  input: {
                    userName: "test@email.gc.ca"
                    requestedRole: USER
                    orgId: "${toGlobalId('organizations', org._key)}"
                    preferredLang: FRENCH
                  }
                ) {
                  result {
                    ... on InviteUserToOrgResult {
                      status
                    }
                    ... on InviteUserToOrgError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'fr',
                protocol: 'http',
                get: (text) => text,
              },
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                tokenize,
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              notify: { sendOrgInviteCreateAccount },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              inviteUserToOrg: {
                result: {
                  code: 403,
                  description:
                    'Permission Denied: Please contact organization admin for help with user invitations.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to invite user: test@email.gc.ca to org: ${org._key} with role: user but does not have permission to do so.`,
          ])
        })
      })
      describe('user with admin level permission attempts to invite a user to super_admin permission', () => {
        let org, user
        beforeEach(async () => {
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
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          user = await userCursor.next()
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        it('returns an error message', async () => {
          const sendOrgInviteCreateAccount = jest.fn()

          const response = await graphql(
            schema,
            `
              mutation {
                inviteUserToOrg(
                  input: {
                    userName: "test@email.gc.ca"
                    requestedRole: SUPER_ADMIN
                    orgId: "${toGlobalId('organizations', org._key)}"
                    preferredLang: FRENCH
                  }
                ) {
                  result {
                    ... on InviteUserToOrgResult {
                      status
                    }
                    ... on InviteUserToOrgError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'fr',
                protocol: 'http',
                get: (text) => text,
              },
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                tokenize,
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              notify: { sendOrgInviteCreateAccount },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              inviteUserToOrg: {
                result: {
                  code: 403,
                  description:
                    'Permission Denied: Please contact organization admin for help with user invitations.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to invite user: test@email.gc.ca to org: ${org._key} with role: super_admin but does not have permission to do so.`,
          ])
        })
      })
    })
    describe('transaction error occurs', () => {
      let org, user, secondaryUser
      beforeEach(async () => {
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
        let userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
        user = await userCursor.next()
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'super_admin',
        })

        await collections.users.save({
          displayName: 'Test Account',
          userName: 'test@email.gc.ca',
          preferredLang: 'french',
        })
        userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test@email.gc.ca"
            RETURN MERGE({ id: user._key }, user)
        `
        secondaryUser = await userCursor.next()
      })
      describe('when creating affiliation', () => {
        it('returns an error message', async () => {
          const sendOrgInviteEmail = jest.fn()

          const mockedTransaction = jest.fn().mockReturnValue({
            step() {
              throw new Error('Transaction error occurred.')
            },
          })

          const response = await graphql(
            schema,
            `
              mutation {
                inviteUserToOrg(
                  input: {
                    userName: "test@email.gc.ca"
                    requestedRole: USER
                    orgId: "${toGlobalId('organizations', org._key)}"
                    preferredLang: FRENCH
                  }
                ) {
                  result {
                    ... on InviteUserToOrgResult {
                      status
                    }
                    ... on InviteUserToOrgError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'fr',
                protocol: 'http',
                get: (text) => text,
              },
              query,
              collections,
              transaction: mockedTransaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                tokenize,
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              notify: { sendOrgInviteEmail },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to add user to organization. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction step error occurred while user: ${user._key} attempted to invite user: ${secondaryUser._key} to org: secretariat-conseil-tresor, error: Error: Transaction error occurred.`,
          ])
        })
      })
      describe('when committing transaction', () => {
        it('returns an error message', async () => {
          const sendOrgInviteEmail = jest.fn()

          const mockedTransaction = jest.fn().mockReturnValue({
            step() {
              return undefined
            },
            commit() {
              throw new Error('Transaction error occurred.')
            },
          })

          const response = await graphql(
            schema,
            `
              mutation {
                inviteUserToOrg(
                  input: {
                    userName: "test@email.gc.ca"
                    requestedRole: USER
                    orgId: "${toGlobalId('organizations', org._key)}"
                    preferredLang: FRENCH
                  }
                ) {
                  result {
                    ... on InviteUserToOrgResult {
                      status
                    }
                    ... on InviteUserToOrgError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'fr',
                protocol: 'http',
                get: (text) => text,
              },
              query,
              collections,
              transaction: mockedTransaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                tokenize,
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              notify: { sendOrgInviteEmail },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError('Unable to invite user. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction commit error occurred while user: ${user._key} attempted to invite user: ${secondaryUser._key} to org: secretariat-conseil-tresor, error: Error: Transaction error occurred.`,
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
    describe('given a successful invitation', () => {
      let org, user
      beforeEach(async () => {
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
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN MERGE({ id: user._key }, user)
        `
        user = await userCursor.next()
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
              await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
                preferredLang: 'french',
              })
              const userCursor = await query`
                FOR user IN users
                  FILTER user.userName == "test@email.gc.ca"
                  RETURN MERGE({ id: user._key, _type: 'user' }, user)
              `
              secondaryUser = await userCursor.next()
            })
            it('returns a status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: SUPER_ADMIN
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: FRENCH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'fr',
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'todo',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: secondaryUser,
                orgName: 'Secrétariat du Conseil Trésor du Canada',
              })
            })
          })
          describe('requested role is admin', () => {
            let secondaryUser
            beforeEach(async () => {
              await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
                preferredLang: 'french',
              })
              const userCursor = await query`
                FOR user IN users
                  FILTER user.userName == "test@email.gc.ca"
                  RETURN MERGE({ id: user._key, _type: 'user' }, user)
              `
              secondaryUser = await userCursor.next()
            })
            it('returns a status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: ADMIN
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: FRENCH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'fr',
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'todo',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: secondaryUser,
                orgName: 'Secrétariat du Conseil Trésor du Canada',
              })
            })
          })
          describe('requested role is user', () => {
            let secondaryUser
            beforeEach(async () => {
              await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
                preferredLang: 'french',
              })
              const userCursor = await query`
                FOR user IN users
                  FILTER user.userName == "test@email.gc.ca"
                  RETURN MERGE({ id: user._key, _type: 'user' }, user)
              `
              secondaryUser = await userCursor.next()
            })
            it('returns a status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: USER
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: FRENCH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'fr',
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'todo',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: secondaryUser,
                orgName: 'Secrétariat du Conseil Trésor du Canada',
              })
            })
          })
        })
        describe('inviting a non-existing account', () => {
          describe('requested role is super_admin', () => {
            it('returns a status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()

              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: SUPER_ADMIN
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: FRENCH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'fr',
                    protocol: 'http',
                    get: (text) => text,
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'todo',
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
              const createAccountLink = `http://host/create-user/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: { userName: 'test@email.gc.ca', preferredLang: 'french' },
                orgName: 'Secrétariat du Conseil Trésor du Canada',
                createAccountLink,
              })
            })
          })
          describe('requested role is admin', () => {
            it('returns a status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()

              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: ADMIN
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: FRENCH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'fr',
                    protocol: 'http',
                    get: (text) => text,
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'todo',
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
              const createAccountLink = `http://host/create-user/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: { userName: 'test@email.gc.ca', preferredLang: 'french' },
                orgName: 'Secrétariat du Conseil Trésor du Canada',
                createAccountLink,
              })
            })
          })
          describe('requested role is user', () => {
            it('returns a status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()

              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: USER
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: FRENCH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'fr',
                    protocol: 'http',
                    get: (text) => text,
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'todo',
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
              const createAccountLink = `http://host/create-user/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: { userName: 'test@email.gc.ca', preferredLang: 'french' },
                orgName: 'Secrétariat du Conseil Trésor du Canada',
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
              await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
                preferredLang: 'french',
              })
              const userCursor = await query`
                FOR user IN users
                  FILTER user.userName == "test@email.gc.ca"
                  RETURN MERGE({ id: user._key, _type: 'user' }, user)
              `
              secondaryUser = await userCursor.next()
            })
            it('returns a status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: ADMIN
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: FRENCH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'fr',
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'todo',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: secondaryUser,
                orgName: 'Secrétariat du Conseil Trésor du Canada',
              })
            })
          })
          describe('requested role is user', () => {
            let secondaryUser
            beforeEach(async () => {
              await collections.users.save({
                displayName: 'Test Account',
                userName: 'test@email.gc.ca',
                preferredLang: 'french',
              })
              const userCursor = await query`
                FOR user IN users
                  FILTER user.userName == "test@email.gc.ca"
                  RETURN MERGE({ id: user._key, _type: 'user' }, user)
              `
              secondaryUser = await userCursor.next()
            })
            it('returns a status message', async () => {
              const sendOrgInviteEmail = jest.fn()

              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: USER
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: FRENCH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'fr',
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteEmail: sendOrgInviteEmail },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'todo',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                user: secondaryUser,
                orgName: 'Secrétariat du Conseil Trésor du Canada',
              })
            })
          })
        })
        describe('inviting a non-existing account', () => {
          describe('requested role is admin', () => {
            it('returns a status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()

              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: ADMIN
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: FRENCH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'fr',
                    protocol: 'http',
                    get: (text) => text,
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'todo',
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
              const createAccountLink = `http://host/create-user/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: { userName: 'test@email.gc.ca', preferredLang: 'french' },
                orgName: 'Secrétariat du Conseil Trésor du Canada',
                createAccountLink,
              })
            })
          })
          describe('requested role is user', () => {
            it('returns a status message', async () => {
              const sendOrgInviteCreateAccount = jest.fn()

              const response = await graphql(
                schema,
                `
                  mutation {
                    inviteUserToOrg(
                      input: {
                        userName: "test@email.gc.ca"
                        requestedRole: USER
                        orgId: "${toGlobalId('organizations', org._key)}"
                        preferredLang: FRENCH
                      }
                    ) {
                      result {
                        ... on InviteUserToOrgResult {
                          status
                        }
                        ... on InviteUserToOrgError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  i18n,
                  request: {
                    language: 'fr',
                    protocol: 'http',
                    get: (text) => text,
                  },
                  query,
                  collections,
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
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  notify: { sendOrgInviteCreateAccount },
                  validators: { cleanseInput },
                },
              )

              const expectedResponse = {
                data: {
                  inviteUserToOrg: {
                    result: {
                      status: 'todo',
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
              const createAccountLink = `http://host/create-user/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                user: { userName: 'test@email.gc.ca', preferredLang: 'french' },
                orgName: 'Secrétariat du Conseil Trésor du Canada',
                createAccountLink,
              })
            })
          })
        })
      })
    })
    describe('given an unsuccessful invitation', () => {
      describe('user attempts to invite themselves', () => {
        let user
        beforeEach(async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          user = await userCursor.next()
        })
        it('returns an error message', async () => {
          const sendOrgInviteCreateAccount = jest.fn()

          const response = await graphql(
            schema,
            `
              mutation {
                inviteUserToOrg(
                  input: {
                    userName: "test.account@istio.actually.exists"
                    requestedRole: USER
                    orgId: "${toGlobalId('organizations', 1)}"
                    preferredLang: FRENCH
                  }
                ) {
                  result {
                    ... on InviteUserToOrgResult {
                      status
                    }
                    ... on InviteUserToOrgError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'fr',
                protocol: 'http',
                get: (text) => text,
              },
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                tokenize,
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              notify: { sendOrgInviteCreateAccount },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              inviteUserToOrg: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to invite themselves to 1.`,
          ])
        })
      })
      describe('user attempts to invite to an org that does not exist', () => {
        let user
        beforeEach(async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          user = await userCursor.next()
        })
        it('returns an error message', async () => {
          const sendOrgInviteCreateAccount = jest.fn()

          const response = await graphql(
            schema,
            `
              mutation {
                inviteUserToOrg(
                  input: {
                    userName: "test@email.gc.ca"
                    requestedRole: USER
                    orgId: "${toGlobalId('organizations', 1)}"
                    preferredLang: FRENCH
                  }
                ) {
                  result {
                    ... on InviteUserToOrgResult {
                      status
                    }
                    ... on InviteUserToOrgError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'fr',
                protocol: 'http',
                get: (text) => text,
              },
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                tokenize,
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              notify: { sendOrgInviteCreateAccount },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              inviteUserToOrg: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to invite user: test@email.gc.ca to 1 however there is no org associated with that id.`,
          ])
        })
      })
      describe('user with user level permission attempts to invite a user', () => {
        let org, user
        beforeEach(async () => {
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
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          user = await userCursor.next()
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
        })
        it('returns an error message', async () => {
          const sendOrgInviteCreateAccount = jest.fn()

          const response = await graphql(
            schema,
            `
              mutation {
                inviteUserToOrg(
                  input: {
                    userName: "test@email.gc.ca"
                    requestedRole: USER
                    orgId: "${toGlobalId('organizations', org._key)}"
                    preferredLang: FRENCH
                  }
                ) {
                  result {
                    ... on InviteUserToOrgResult {
                      status
                    }
                    ... on InviteUserToOrgError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'fr',
                protocol: 'http',
                get: (text) => text,
              },
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                tokenize,
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              notify: { sendOrgInviteCreateAccount },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              inviteUserToOrg: {
                result: {
                  code: 403,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to invite user: test@email.gc.ca to org: ${org._key} with role: user but does not have permission to do so.`,
          ])
        })
      })
      describe('user with admin level permission attempts to invite a user to super_admin permission', () => {
        let org, user
        beforeEach(async () => {
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
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
          user = await userCursor.next()
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        it('returns an error message', async () => {
          const sendOrgInviteCreateAccount = jest.fn()

          const response = await graphql(
            schema,
            `
              mutation {
                inviteUserToOrg(
                  input: {
                    userName: "test@email.gc.ca"
                    requestedRole: SUPER_ADMIN
                    orgId: "${toGlobalId('organizations', org._key)}"
                    preferredLang: FRENCH
                  }
                ) {
                  result {
                    ... on InviteUserToOrgResult {
                      status
                    }
                    ... on InviteUserToOrgError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'fr',
                protocol: 'http',
                get: (text) => text,
              },
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                tokenize,
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              notify: { sendOrgInviteCreateAccount },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              inviteUserToOrg: {
                result: {
                  code: 403,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to invite user: test@email.gc.ca to org: ${org._key} with role: super_admin but does not have permission to do so.`,
          ])
        })
      })
    })
    describe('transaction error occurs', () => {
      let org, user, secondaryUser
      beforeEach(async () => {
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
        let userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
          `
        user = await userCursor.next()
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'super_admin',
        })

        await collections.users.save({
          displayName: 'Test Account',
          userName: 'test@email.gc.ca',
          preferredLang: 'french',
        })
        userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test@email.gc.ca"
            RETURN MERGE({ id: user._key }, user)
        `
        secondaryUser = await userCursor.next()
      })
      describe('when creating affiliation', () => {
        it('returns an error message', async () => {
          const sendOrgInviteEmail = jest.fn()

          const mockedTransaction = jest.fn().mockReturnValue({
            step() {
              throw new Error('Transaction error occurred.')
            },
          })

          const response = await graphql(
            schema,
            `
              mutation {
                inviteUserToOrg(
                  input: {
                    userName: "test@email.gc.ca"
                    requestedRole: USER
                    orgId: "${toGlobalId('organizations', org._key)}"
                    preferredLang: FRENCH
                  }
                ) {
                  result {
                    ... on InviteUserToOrgResult {
                      status
                    }
                    ... on InviteUserToOrgError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'fr',
                protocol: 'http',
                get: (text) => text,
              },
              query,
              collections,
              transaction: mockedTransaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                tokenize,
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              notify: { sendOrgInviteEmail },
              validators: { cleanseInput },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction step error occurred while user: ${user._key} attempted to invite user: ${secondaryUser._key} to org: secretariat-conseil-tresor, error: Error: Transaction error occurred.`,
          ])
        })
      })
      describe('when committing transaction', () => {
        it('returns an error message', async () => {
          const sendOrgInviteEmail = jest.fn()

          const mockedTransaction = jest.fn().mockReturnValue({
            step() {
              return undefined
            },
            commit() {
              throw new Error('Transaction error occurred.')
            },
          })

          const response = await graphql(
            schema,
            `
              mutation {
                inviteUserToOrg(
                  input: {
                    userName: "test@email.gc.ca"
                    requestedRole: USER
                    orgId: "${toGlobalId('organizations', org._key)}"
                    preferredLang: FRENCH
                  }
                ) {
                  result {
                    ... on InviteUserToOrgResult {
                      status
                    }
                    ... on InviteUserToOrgError {
                      code
                      description
                    }
                  }
                }
              }
            `,
            null,
            {
              i18n,
              request: {
                language: 'fr',
                protocol: 'http',
                get: (text) => text,
              },
              query,
              collections,
              transaction: mockedTransaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                tokenize,
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              notify: { sendOrgInviteEmail },
              validators: { cleanseInput },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction commit error occurred while user: ${user._key} attempted to invite user: ${secondaryUser._key} to org: secretariat-conseil-tresor, error: Error: Transaction error occurred.`,
          ])
        })
      })
    })
  })
})
