const { SIGN_IN_KEY } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const bcrypt = require('bcrypt')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../../../locale/en/messages')
const frenchMessages = require('../../../locale/fr/messages')
const { toGlobalId } = require('graphql-relay')
const { makeMigrations } = require('../../../../migrations')
const { createQuerySchema } = require('../../../queries')
const { createMutationSchema } = require('../..')
const { cleanseInput } = require('../../../validators')
const { checkPermission, userRequired } = require('../../../auth')
const {
  orgLoaderByKey,
  userLoaderByKey,
  userLoaderByUserName,
} = require('../../../loaders')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('invite user to org', () => {
  let query,
    drop,
    truncate,
    migrate,
    schema,
    collections,
    transaction,
    i18n,
    tokenize

  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })

    tokenize = jest.fn().mockReturnValue('token')
  })

  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections, transaction } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    await truncate()
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
            authResult {
              user {
                id
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
    consoleOutput = []
  })

  afterEach(async () => {
    await drop()
  })

  describe('users language is set to english', () => {
    beforeAll(() => {
      i18n = setupI18n({
        language: 'en',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
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
                    RETURN MERGE({ id: user._key }, user)
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
                        status
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
                    status:
                      'Successfully invited user to organization, and sent notification email.',
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                templateId: 'eccc6a60-44e8-40ff-8b15-ed82155b769f',
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
                  RETURN MERGE({ id: user._key }, user)
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
                      status
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
                    status:
                      'Successfully invited user to organization, and sent notification email.',
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                templateId: 'eccc6a60-44e8-40ff-8b15-ed82155b769f',
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
                  RETURN MERGE({ id: user._key }, user)
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
                      status
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
                    status:
                      'Successfully invited user to organization, and sent notification email.',
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                templateId: 'eccc6a60-44e8-40ff-8b15-ed82155b769f',
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
                      status
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
                    status:
                      'Successfully sent invitation to service, and organization email.',
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
              const createAccountLink = `http://host/create-account/${token}`
              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                templateId: 'e66e1a68-8041-40be-af0e-83d064965431',
                user: { userName: 'test@email.gc.ca' },
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
                      status
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
                    status:
                      'Successfully sent invitation to service, and organization email.',
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
              const createAccountLink = `http://host/create-account/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                templateId: 'e66e1a68-8041-40be-af0e-83d064965431',
                user: { userName: 'test@email.gc.ca' },
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
                      status
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
                    status:
                      'Successfully sent invitation to service, and organization email.',
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
              const createAccountLink = `http://host/create-account/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                templateId: 'e66e1a68-8041-40be-af0e-83d064965431',
                user: { userName: 'test@email.gc.ca' },
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
                  RETURN MERGE({ id: user._key }, user)
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
                      status
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
                    status:
                      'Successfully invited user to organization, and sent notification email.',
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                templateId: 'eccc6a60-44e8-40ff-8b15-ed82155b769f',
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
                  RETURN MERGE({ id: user._key }, user)
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
                      status
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
                    status:
                      'Successfully invited user to organization, and sent notification email.',
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                templateId: 'eccc6a60-44e8-40ff-8b15-ed82155b769f',
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
                      status
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
                    status:
                      'Successfully sent invitation to service, and organization email.',
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
              const createAccountLink = `http://host/create-account/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                templateId: 'e66e1a68-8041-40be-af0e-83d064965431',
                user: { userName: 'test@email.gc.ca' },
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
                      status
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
                    status:
                      'Successfully sent invitation to service, and organization email.',
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
              const createAccountLink = `http://host/create-account/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: treasury-board-secretariat.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                templateId: 'e66e1a68-8041-40be-af0e-83d064965431',
                user: { userName: 'test@email.gc.ca' },
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
                  status
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

          const error = [
            new GraphQLError(
              'Unable to invite yourself to an org. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
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
                  status
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

          const error = [
            new GraphQLError('Unable to invite user. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
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
                  status
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

          const error = [
            new GraphQLError('Unable to invite user. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to invite user: test@email.gc.ca to org: secretariat-conseil-tresor with role: user but does not have permission to do so.`,
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
                  status
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

          const error = [
            new GraphQLError('Unable to invite user. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to invite user: test@email.gc.ca to org: secretariat-conseil-tresor with role: super_admin but does not have permission to do so.`,
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

          transaction = jest.fn().mockReturnValue({
            run() {
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
                  status
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
              notify: { sendOrgInviteEmail },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError('Unable to invite user. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction run error occurred while user: ${user._key} attempted to invite user: ${secondaryUser._key} to org: secretariat-conseil-tresor, error: Error: Transaction error occurred.`,
          ])
        })
      })
      describe('when committing transaction', () => {
        it('returns an error message', async () => {
          const sendOrgInviteEmail = jest.fn()

          transaction = jest.fn().mockReturnValue({
            run() {
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
                  status
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
        language: 'fr',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
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
                  RETURN MERGE({ id: user._key }, user)
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
                      status
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
                    status: 'todo',
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                templateId: 'a6eb3fdd-c7ab-4404-af04-316abd2fb221',
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
                  RETURN MERGE({ id: user._key }, user)
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
                      status
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
                    status: 'todo',
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                templateId: 'a6eb3fdd-c7ab-4404-af04-316abd2fb221',
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
                  RETURN MERGE({ id: user._key }, user)
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
                      status
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
                    status: 'todo',
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                templateId: 'a6eb3fdd-c7ab-4404-af04-316abd2fb221',
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
                      status
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
                    status: 'todo',
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
              const createAccountLink = `http://host/create-account/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                templateId: '3c10d11b-f502-439d-bca1-afa551012310',
                user: { userName: 'test@email.gc.ca' },
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
                      status
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
                    status: 'todo',
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
              const createAccountLink = `http://host/create-account/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                templateId: '3c10d11b-f502-439d-bca1-afa551012310',
                user: { userName: 'test@email.gc.ca' },
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
                      status
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
                    status: 'todo',
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
              const createAccountLink = `http://host/create-account/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                templateId: '3c10d11b-f502-439d-bca1-afa551012310',
                user: { userName: 'test@email.gc.ca' },
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
                  RETURN MERGE({ id: user._key }, user)
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
                      status
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
                    status: 'todo',
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                templateId: 'a6eb3fdd-c7ab-4404-af04-316abd2fb221',
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
                  RETURN MERGE({ id: user._key }, user)
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
                      status
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
                    status: 'todo',
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: ${secondaryUser._key} to the org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteEmail).toHaveBeenCalledWith({
                templateId: 'a6eb3fdd-c7ab-4404-af04-316abd2fb221',
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
                      status
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
                    status: 'todo',
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
              const createAccountLink = `http://host/create-account/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                templateId: '3c10d11b-f502-439d-bca1-afa551012310',
                user: { userName: 'test@email.gc.ca' },
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
                      status
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
                    status: 'todo',
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
              const createAccountLink = `http://host/create-account/${token}`

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully invited user: test@email.gc.ca to the service, and org: secretariat-conseil-tresor.`,
              ])
              expect(sendOrgInviteCreateAccount).toHaveBeenCalledWith({
                templateId: '3c10d11b-f502-439d-bca1-afa551012310',
                user: { userName: 'test@email.gc.ca' },
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
                  status
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

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
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
                  status
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

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
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
                  status
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

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to invite user: test@email.gc.ca to org: secretariat-conseil-tresor with role: user but does not have permission to do so.`,
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
                  status
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

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to invite user: test@email.gc.ca to org: secretariat-conseil-tresor with role: super_admin but does not have permission to do so.`,
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

          transaction = jest.fn().mockReturnValue({
            run() {
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
                  status
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
              notify: { sendOrgInviteEmail },
              validators: { cleanseInput },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction run error occurred while user: ${user._key} attempted to invite user: ${secondaryUser._key} to org: secretariat-conseil-tresor, error: Error: Transaction error occurred.`,
          ])
        })
      })
      describe('when committing transaction', () => {
        it('returns an error message', async () => {
          const sendOrgInviteEmail = jest.fn()

          transaction = jest.fn().mockReturnValue({
            run() {
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
                  status
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
