import { ensure, dbNameFromFile } from 'arango-tools'
import bcrypt from 'bcryptjs'
import { graphql, GraphQLError, GraphQLSchema } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'
import { v4 as uuidv4 } from 'uuid'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { tokenize, verifyToken } from '../../../auth'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { loadUserByUserName, loadUserByKey } from '../../loaders'
import { loadOrgByKey } from '../../../organization/loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url, REFRESH_TOKEN_EXPIRY } = process.env

describe('testing user sign up', () => {
  let query,
    drop,
    truncate,
    collections,
    transaction,
    schema,
    i18n,
    mockTokenize,
    mockNotify,
    request

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(() => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    mockTokenize = jest.fn().mockReturnValue('token')
    request = {
      protocol: 'https',
      get: (text) => text,
    }
  })
  beforeEach(() => {
    mockNotify = jest.fn()
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful sign up', () => {
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
      describe('given a successful sign up', () => {
        describe('when user is not signing up without an invite token', () => {
          describe('user has rememberMe disabled', () => {
            it('returns auth result with user info', async () => {
              const mockedCookie = jest.fn()
              const mockedResponse = { cookie: mockedCookie }

              const response = await graphql(
                schema,
                `
                  mutation {
                    signUp(
                      input: {
                        displayName: "Test Account"
                        userName: "test.account@istio.actually.exists"
                        password: "testpassword123"
                        confirmPassword: "testpassword123"
                        preferredLang: ENGLISH
                      }
                    ) {
                      result {
                        ... on AuthResult {
                          authToken
                          user {
                            id
                            userName
                            displayName
                            preferredLang
                            phoneValidated
                            emailValidated
                          }
                        }
                        ... on SignUpError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  response: mockedResponse,
                  uuidv4,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const cursor = await query`
                  FOR user IN users
                      FILTER user.userName == "test.account@istio.actually.exists"
                      RETURN user
                `
              const users = await cursor.all()

              const expectedResult = {
                data: {
                  signUp: {
                    result: {
                      authToken: 'token',
                      user: {
                        id: `${toGlobalId('user', users[0]._key)}`,
                        userName: 'test.account@istio.actually.exists',
                        displayName: 'Test Account',
                        preferredLang: 'ENGLISH',
                        phoneValidated: false,
                        emailValidated: false,
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResult)
              expect(mockedCookie).toHaveBeenCalledWith(
                'refresh_token',
                'token',
                {
                  httpOnly: true,
                  expires: 0,
                  sameSite: true,
                  secure: true,
                },
              )
              expect(consoleOutput).toEqual([
                'User: test.account@istio.actually.exists successfully created a new account.',
              ])
            })
            it('sends verification email', async () => {
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
                        preferredLang: ENGLISH
                      }
                    ) {
                      result {
                        ... on AuthResult {
                          authToken
                          user {
                            id
                            userName
                            displayName
                            preferredLang
                            phoneValidated
                            emailValidated
                          }
                        }
                        ... on SignUpError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  uuidv4,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const user = await loadUserByUserName({
                query,
                userKey: '1',
                i18n: {},
              }).load('test.account@istio.actually.exists')

              const verifyUrl = `https://${request.get('host')}/validate/token`

              expect(mockNotify).toHaveBeenCalledWith({
                user: user,
                verifyUrl,
              })
            })
          })
          describe('user has rememberMe enabled', () => {
            it('returns auth result with user info', async () => {
              const mockedCookie = jest.fn()
              const mockedResponse = { cookie: mockedCookie }

              const response = await graphql(
                schema,
                `
                  mutation {
                    signUp(
                      input: {
                        displayName: "Test Account"
                        userName: "test.account@istio.actually.exists"
                        password: "testpassword123"
                        confirmPassword: "testpassword123"
                        preferredLang: ENGLISH
                        rememberMe: true
                      }
                    ) {
                      result {
                        ... on AuthResult {
                          authToken
                          user {
                            id
                            userName
                            displayName
                            preferredLang
                            phoneValidated
                            emailValidated
                          }
                        }
                        ... on SignUpError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  response: mockedResponse,
                  uuidv4,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const cursor = await query`
                  FOR user IN users
                      FILTER user.userName == "test.account@istio.actually.exists"
                      RETURN user
                `
              const users = await cursor.all()

              const expectedResult = {
                data: {
                  signUp: {
                    result: {
                      authToken: 'token',
                      user: {
                        id: `${toGlobalId('user', users[0]._key)}`,
                        userName: 'test.account@istio.actually.exists',
                        displayName: 'Test Account',
                        preferredLang: 'ENGLISH',
                        phoneValidated: false,
                        emailValidated: false,
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResult)
              expect(mockedCookie).toHaveBeenCalledWith(
                'refresh_token',
                'token',
                {
                  httpOnly: true,
                  maxAge: REFRESH_TOKEN_EXPIRY * 60 * 24 * 60 * 1000,
                  sameSite: true,
                  secure: true,
                },
              )
              expect(consoleOutput).toEqual([
                'User: test.account@istio.actually.exists successfully created a new account.',
              ])
            })
            it('sends verification email', async () => {
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
                        preferredLang: ENGLISH
                      }
                    ) {
                      result {
                        ... on AuthResult {
                          authToken
                          user {
                            id
                            userName
                            displayName
                            preferredLang
                            phoneValidated
                            emailValidated
                          }
                        }
                        ... on SignUpError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  uuidv4,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const user = await loadUserByUserName({
                query,
                userKey: '1',
                i18n: {},
              }).load('test.account@istio.actually.exists')

              const verifyUrl = `https://${request.get('host')}/validate/token`

              expect(mockNotify).toHaveBeenCalledWith({
                user: user,
                verifyUrl,
              })
            })
          })
        })
        describe('when the user is signing up with an invite token', () => {
          let org, token
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
            token = tokenize({
              parameters: {
                userName: 'test.account@istio.actually.exists',
                orgKey: org._key,
                requestedRole: 'admin',
              },
            })
          })
          describe('user has rememberMe disabled', () => {
            it('returns auth result with user info', async () => {
              const mockedCookie = jest.fn()
              const mockedResponse = { cookie: mockedCookie }

              const response = await graphql(
                schema,
                `
                  mutation {
                    signUp(
                      input: {
                        displayName: "Test Account"
                        userName: "test.account@istio.actually.exists"
                        password: "testpassword123"
                        confirmPassword: "testpassword123"
                        preferredLang: ENGLISH
                        signUpToken: "${token}"
                      }
                    ) {
                      result {
                        ... on AuthResult {
                          authToken
                          user {
                            id
                            userName
                            displayName
                            preferredLang
                            phoneValidated
                            emailValidated
                          }
                        }
                        ... on SignUpError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  response: mockedResponse,
                  uuidv4,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                    verifyToken: verifyToken({ i18n: {} }),
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const cursor = await query`
                FOR user IN users
                    FILTER user.userName == "test.account@istio.actually.exists"
                    RETURN user
              `
              const user = await cursor.next()

              const expectedResult = {
                data: {
                  signUp: {
                    result: {
                      authToken: 'token',
                      user: {
                        id: `${toGlobalId('user', user._key)}`,
                        userName: 'test.account@istio.actually.exists',
                        displayName: 'Test Account',
                        preferredLang: 'ENGLISH',
                        phoneValidated: false,
                        emailValidated: false,
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResult)
              expect(mockedCookie).toHaveBeenCalledWith(
                'refresh_token',
                'token',
                {
                  httpOnly: true,
                  expires: 0,
                  sameSite: true,
                  secure: true,
                },
              )
              expect(consoleOutput).toEqual([
                'User: test.account@istio.actually.exists successfully created a new account.',
              ])
            })
            it('creates affiliation', async () => {
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
                        preferredLang: ENGLISH
                        signUpToken: "${token}"
                      }
                    ) {
                      result {
                        ... on AuthResult {
                          authToken
                          user {
                            id
                            userName
                            displayName
                            preferredLang
                            phoneValidated
                            emailValidated
                          }
                        }
                        ... on SignUpError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  uuidv4,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                    verifyToken: verifyToken({ i18n: {} }),
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const cursor = await query`
                FOR user IN users
                    FILTER user.userName == "test.account@istio.actually.exists"
                    RETURN user
              `
              const user = await cursor.next()

              const affiliationCursor = await query`
                FOR affiliation IN affiliations
                  FILTER affiliation._to == ${user._id}
                  RETURN affiliation
              `
              const checkAffiliation = await affiliationCursor.next()

              const expectedAffiliation = {
                _from: org._id,
                _to: user._id,
                permission: 'admin',
              }

              expect(checkAffiliation).toMatchObject(expectedAffiliation)
            })
            it('sends verification email', async () => {
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
                        preferredLang: ENGLISH
                        signUpToken: "${token}"
                      }
                    ) {
                      result {
                        ... on AuthResult {
                          authToken
                          user {
                            id
                            userName
                            displayName
                            preferredLang
                            phoneValidated
                            emailValidated
                          }
                        }
                        ... on SignUpError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  uuidv4,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                    verifyToken: verifyToken({ i18n: {} }),
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const user = await loadUserByUserName({
                query,
                userKey: '1',
                i18n: {},
              }).load('test.account@istio.actually.exists')

              const verifyUrl = `https://${request.get('host')}/validate/token`

              expect(mockNotify).toHaveBeenCalledWith({
                user: user,
                verifyUrl,
              })
            })
          })
          describe('user has rememberMe enabled', () => {
            it('returns auth result with user info', async () => {
              const mockedCookie = jest.fn()
              const mockedResponse = { cookie: mockedCookie }

              const response = await graphql(
                schema,
                `
                  mutation {
                    signUp(
                      input: {
                        displayName: "Test Account"
                        userName: "test.account@istio.actually.exists"
                        password: "testpassword123"
                        confirmPassword: "testpassword123"
                        preferredLang: ENGLISH
                        signUpToken: "${token}"
                        rememberMe: true
                      }
                    ) {
                      result {
                        ... on AuthResult {
                          authToken
                          user {
                            id
                            userName
                            displayName
                            preferredLang
                            phoneValidated
                            emailValidated
                          }
                        }
                        ... on SignUpError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  response: mockedResponse,
                  uuidv4,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                    verifyToken: verifyToken({ i18n: {} }),
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const cursor = await query`
                FOR user IN users
                    FILTER user.userName == "test.account@istio.actually.exists"
                    RETURN user
              `
              const user = await cursor.next()

              const expectedResult = {
                data: {
                  signUp: {
                    result: {
                      authToken: 'token',
                      user: {
                        id: `${toGlobalId('user', user._key)}`,
                        userName: 'test.account@istio.actually.exists',
                        displayName: 'Test Account',
                        preferredLang: 'ENGLISH',
                        phoneValidated: false,
                        emailValidated: false,
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResult)
              expect(mockedCookie).toHaveBeenCalledWith(
                'refresh_token',
                'token',
                {
                  httpOnly: true,
                  maxAge: REFRESH_TOKEN_EXPIRY * 60 * 24 * 60 * 1000,
                  sameSite: true,
                  secure: true,
                },
              )
              expect(consoleOutput).toEqual([
                'User: test.account@istio.actually.exists successfully created a new account.',
              ])
            })
            it('creates affiliation', async () => {
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
                        preferredLang: ENGLISH
                        signUpToken: "${token}"
                      }
                    ) {
                      result {
                        ... on AuthResult {
                          authToken
                          user {
                            id
                            userName
                            displayName
                            preferredLang
                            phoneValidated
                            emailValidated
                          }
                        }
                        ... on SignUpError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  uuidv4,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                    verifyToken: verifyToken({ i18n: {} }),
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const cursor = await query`
                FOR user IN users
                    FILTER user.userName == "test.account@istio.actually.exists"
                    RETURN user
              `
              const user = await cursor.next()

              const affiliationCursor = await query`
                FOR affiliation IN affiliations
                  FILTER affiliation._to == ${user._id}
                  RETURN affiliation
              `
              const checkAffiliation = await affiliationCursor.next()

              const expectedAffiliation = {
                _from: org._id,
                _to: user._id,
                permission: 'admin',
              }

              expect(checkAffiliation).toMatchObject(expectedAffiliation)
            })
            it('sends verification email', async () => {
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
                        preferredLang: ENGLISH
                        signUpToken: "${token}"
                      }
                    ) {
                      result {
                        ... on AuthResult {
                          authToken
                          user {
                            id
                            userName
                            displayName
                            preferredLang
                            phoneValidated
                            emailValidated
                          }
                        }
                        ... on SignUpError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  uuidv4,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                    verifyToken: verifyToken({ i18n: {} }),
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const user = await loadUserByUserName({
                query,
                userKey: '1',
                i18n: {},
              }).load('test.account@istio.actually.exists')

              const verifyUrl = `https://${request.get('host')}/validate/token`

              expect(mockNotify).toHaveBeenCalledWith({
                user: user,
                verifyUrl,
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
      describe('given successful sign up', () => {
        describe('when user is not signing up without an invite token', () => {
          describe('user has rememberMe disabled', () => {
            it('returns auth result with user info', async () => {
              const mockedCookie = jest.fn()
              const mockedResponse = { cookie: mockedCookie }

              const response = await graphql(
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
                          authToken
                          user {
                            id
                            userName
                            displayName
                            preferredLang
                            phoneValidated
                            emailValidated
                          }
                        }
                        ... on SignUpError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  response: mockedResponse,
                  uuidv4,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const cursor = await query`
                            FOR user IN users
                                FILTER user.userName == "test.account@istio.actually.exists"
                                RETURN user
                        `
              const user = await cursor.next()

              const expectedResult = {
                data: {
                  signUp: {
                    result: {
                      authToken: 'token',
                      user: {
                        id: `${toGlobalId('user', user._key)}`,
                        userName: 'test.account@istio.actually.exists',
                        displayName: 'Test Account',
                        preferredLang: 'FRENCH',
                        phoneValidated: false,
                        emailValidated: false,
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResult)
              expect(mockedCookie).toHaveBeenCalledWith(
                'refresh_token',
                'token',
                {
                  httpOnly: true,
                  expires: 0,
                  sameSite: true,
                  secure: true,
                },
              )
              expect(consoleOutput).toEqual([
                'User: test.account@istio.actually.exists successfully created a new account.',
              ])
            })
            it('sends verification email', async () => {
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
                        preferredLang: ENGLISH
                      }
                    ) {
                      result {
                        ... on AuthResult {
                          authToken
                          user {
                            id
                            userName
                            displayName
                            preferredLang
                            phoneValidated
                            emailValidated
                          }
                        }
                        ... on SignUpError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  uuidv4,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const user = await loadUserByUserName({
                query,
                userKey: '1',
                i18n: {},
              }).load('test.account@istio.actually.exists')

              const verifyUrl = `https://${request.get('host')}/validate/token`

              expect(mockNotify).toHaveBeenCalledWith({
                user: user,
                verifyUrl,
              })
            })
          })
          describe('user has rememberMe enabled', () => {
            it('returns auth result with user info', async () => {
              const mockedCookie = jest.fn()
              const mockedResponse = { cookie: mockedCookie }

              const response = await graphql(
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
                        rememberMe: true
                      }
                    ) {
                      result {
                        ... on AuthResult {
                          authToken
                          user {
                            id
                            userName
                            displayName
                            preferredLang
                            phoneValidated
                            emailValidated
                          }
                        }
                        ... on SignUpError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  response: mockedResponse,
                  uuidv4,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const cursor = await query`
                FOR user IN users
                    FILTER user.userName == "test.account@istio.actually.exists"
                    RETURN user
              `
              const user = await cursor.next()

              const expectedResult = {
                data: {
                  signUp: {
                    result: {
                      authToken: 'token',
                      user: {
                        id: `${toGlobalId('user', user._key)}`,
                        userName: 'test.account@istio.actually.exists',
                        displayName: 'Test Account',
                        preferredLang: 'FRENCH',
                        phoneValidated: false,
                        emailValidated: false,
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResult)
              expect(mockedCookie).toHaveBeenCalledWith(
                'refresh_token',
                'token',
                {
                  httpOnly: true,
                  maxAge: REFRESH_TOKEN_EXPIRY * 60 * 24 * 60 * 1000,
                  sameSite: true,
                  secure: true,
                },
              )
              expect(consoleOutput).toEqual([
                'User: test.account@istio.actually.exists successfully created a new account.',
              ])
            })
            it('sends verification email', async () => {
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
                        preferredLang: ENGLISH
                      }
                    ) {
                      result {
                        ... on AuthResult {
                          authToken
                          user {
                            id
                            userName
                            displayName
                            preferredLang
                            phoneValidated
                            emailValidated
                          }
                        }
                        ... on SignUpError {
                          code
                          description
                        }
                      }
                    }
                  }
                `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  uuidv4,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const user = await loadUserByUserName({
                query,
                userKey: '1',
                i18n: {},
              }).load('test.account@istio.actually.exists')

              const verifyUrl = `https://${request.get('host')}/validate/token`

              expect(mockNotify).toHaveBeenCalledWith({
                user: user,
                verifyUrl,
              })
            })
          })
        })
        describe('when the user is signing up with an invite token', () => {
          let org, token
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
            token = tokenize({
              parameters: {
                userName: 'test.account@istio.actually.exists',
                orgKey: org._key,
                requestedRole: 'admin',
              },
            })
          })
          describe('user has rememberMe disabled', () => {
            it('returns auth result with user info', async () => {
              const mockedCookie = jest.fn()
              const mockedResponse = { cookie: mockedCookie }

              const response = await graphql(
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
                          signUpToken: "${token}"
                        }
                      ) {
                        result {
                          ... on AuthResult {
                            authToken
                            user {
                              id
                              userName
                              displayName
                              preferredLang
                              phoneValidated
                              emailValidated
                            }
                          }
                          ... on SignUpError {
                            code
                            description
                          }
                        }
                      }
                    }
                  `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  uuidv4,
                  response: mockedResponse,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                    verifyToken: verifyToken({ i18n: {} }),
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const cursor = await query`
                  FOR user IN users
                      FILTER user.userName == "test.account@istio.actually.exists"
                      RETURN user
                `
              const user = await cursor.next()

              const expectedResult = {
                data: {
                  signUp: {
                    result: {
                      authToken: 'token',
                      user: {
                        id: `${toGlobalId('user', user._key)}`,
                        userName: 'test.account@istio.actually.exists',
                        displayName: 'Test Account',
                        preferredLang: 'FRENCH',
                        phoneValidated: false,
                        emailValidated: false,
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResult)
              expect(mockedCookie).toHaveBeenCalledWith(
                'refresh_token',
                'token',
                {
                  httpOnly: true,
                  expires: 0,
                  sameSite: true,
                  secure: true,
                },
              )
              expect(consoleOutput).toEqual([
                'User: test.account@istio.actually.exists successfully created a new account.',
              ])
            })
            it('creates affiliation', async () => {
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
                          preferredLang: ENGLISH
                          signUpToken: "${token}"
                        }
                      ) {
                        result {
                          ... on AuthResult {
                            authToken
                            user {
                              id
                              userName
                              displayName
                              preferredLang
                              phoneValidated
                              emailValidated
                            }
                          }
                          ... on SignUpError {
                            code
                            description
                          }
                        }
                      }
                    }
                  `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  uuidv4,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                    verifyToken: verifyToken({ i18n: {} }),
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const cursor = await query`
                  FOR user IN users
                      FILTER user.userName == "test.account@istio.actually.exists"
                      RETURN user
                `
              const user = await cursor.next()

              const affiliationCursor = await query`
                  FOR affiliation IN affiliations
                    FILTER affiliation._to == ${user._id}
                    RETURN affiliation
                `
              const checkAffiliation = await affiliationCursor.next()

              const expectedAffiliation = {
                _from: org._id,
                _to: user._id,
                permission: 'admin',
              }

              expect(checkAffiliation).toMatchObject(expectedAffiliation)
            })
            it('sends verification email', async () => {
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
                          preferredLang: ENGLISH
                          signUpToken: "${token}"
                        }
                      ) {
                        result {
                          ... on AuthResult {
                            authToken
                            user {
                              id
                              userName
                              displayName
                              preferredLang
                              phoneValidated
                              emailValidated
                            }
                          }
                          ... on SignUpError {
                            code
                            description
                          }
                        }
                      }
                    }
                  `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  uuidv4,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                    verifyToken: verifyToken({ i18n: {} }),
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const user = await loadUserByUserName({
                query,
                userKey: '1',
                i18n: {},
              }).load('test.account@istio.actually.exists')

              const verifyUrl = `https://${request.get('host')}/validate/token`

              expect(mockNotify).toHaveBeenCalledWith({
                user: user,
                verifyUrl,
              })
            })
          })
          describe('user has rememberMe enabled', () => {
            it('returns auth result with user info', async () => {
              const mockedCookie = jest.fn()
              const mockedResponse = { cookie: mockedCookie }

              const response = await graphql(
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
                          signUpToken: "${token}"
                          rememberMe: true
                        }
                      ) {
                        result {
                          ... on AuthResult {
                            authToken
                            user {
                              id
                              userName
                              displayName
                              preferredLang
                              phoneValidated
                              emailValidated
                            }
                          }
                          ... on SignUpError {
                            code
                            description
                          }
                        }
                      }
                    }
                  `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  uuidv4,
                  response: mockedResponse,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                    verifyToken: verifyToken({ i18n: {} }),
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const cursor = await query`
                  FOR user IN users
                      FILTER user.userName == "test.account@istio.actually.exists"
                      RETURN user
                `
              const user = await cursor.next()

              const expectedResult = {
                data: {
                  signUp: {
                    result: {
                      authToken: 'token',
                      user: {
                        id: `${toGlobalId('user', user._key)}`,
                        userName: 'test.account@istio.actually.exists',
                        displayName: 'Test Account',
                        preferredLang: 'FRENCH',
                        phoneValidated: false,
                        emailValidated: false,
                      },
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResult)
              expect(mockedCookie).toHaveBeenCalledWith(
                'refresh_token',
                'token',
                {
                  httpOnly: true,
                  maxAge: REFRESH_TOKEN_EXPIRY * 60 * 24 * 60 * 1000,
                  sameSite: true,
                  secure: true,
                },
              )
              expect(consoleOutput).toEqual([
                'User: test.account@istio.actually.exists successfully created a new account.',
              ])
            })
            it('creates affiliation', async () => {
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
                          preferredLang: ENGLISH
                          signUpToken: "${token}"
                        }
                      ) {
                        result {
                          ... on AuthResult {
                            authToken
                            user {
                              id
                              userName
                              displayName
                              preferredLang
                              phoneValidated
                              emailValidated
                            }
                          }
                          ... on SignUpError {
                            code
                            description
                          }
                        }
                      }
                    }
                  `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  uuidv4,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                    verifyToken: verifyToken({ i18n: {} }),
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const cursor = await query`
                  FOR user IN users
                      FILTER user.userName == "test.account@istio.actually.exists"
                      RETURN user
                `
              const user = await cursor.next()

              const affiliationCursor = await query`
                  FOR affiliation IN affiliations
                    FILTER affiliation._to == ${user._id}
                    RETURN affiliation
                `
              const checkAffiliation = await affiliationCursor.next()

              const expectedAffiliation = {
                _from: org._id,
                _to: user._id,
                permission: 'admin',
              }

              expect(checkAffiliation).toMatchObject(expectedAffiliation)
            })
            it('sends verification email', async () => {
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
                          preferredLang: ENGLISH
                          signUpToken: "${token}"
                        }
                      ) {
                        result {
                          ... on AuthResult {
                            authToken
                            user {
                              id
                              userName
                              displayName
                              preferredLang
                              phoneValidated
                              emailValidated
                            }
                          }
                          ... on SignUpError {
                            code
                            description
                          }
                        }
                      }
                    }
                  `,
                null,
                {
                  request,
                  query,
                  collections: collectionNames,
                  transaction,
                  uuidv4,
                  auth: {
                    bcrypt,
                    tokenize: mockTokenize,
                    verifyToken: verifyToken({ i18n: {} }),
                  },
                  validators: {
                    cleanseInput,
                  },
                  loaders: {
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
                  },
                  notify: {
                    sendVerificationEmail: mockNotify,
                  },
                },
              )

              const user = await loadUserByUserName({
                query,
                userKey: '1',
                i18n: {},
              }).load('test.account@istio.actually.exists')

              const verifyUrl = `https://${request.get('host')}/validate/token`

              expect(mockNotify).toHaveBeenCalledWith({
                user: user,
                verifyUrl,
              })
            })
          })
        })
      })
    })
  })
  describe('given an unsuccessful sign up', () => {
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
      describe('when the password is not strong enough', () => {
        it('returns a password too short error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                signUp(
                  input: {
                    displayName: "Test Account"
                    userName: "test.account@istio.actually.exists"
                    password: "123"
                    confirmPassword: "123"
                    preferredLang: FRENCH
                  }
                ) {
                  result {
                    ... on AuthResult {
                      authToken
                      user {
                        id
                        userName
                        displayName
                        preferredLang
                        phoneValidated
                        emailValidated
                      }
                    }
                    ... on SignUpError {
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
              query,
              collections: collectionNames,
              transaction,
              uuidv4,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn(),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
              notify: {
                sendVerificationEmail: mockNotify,
              },
            },
          )

          const error = {
            data: {
              signUp: {
                result: {
                  code: 400,
                  description: 'Password does not meet requirements.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            'User: test.account@istio.actually.exists tried to sign up but did not meet requirements.',
          ])
        })
      })
      describe('when the passwords do not match', () => {
        it('returns a password not matching error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                signUp(
                  input: {
                    displayName: "Test Account"
                    userName: "test.account@istio.actually.exists"
                    password: "testpassword123"
                    confirmPassword: "321drowssaptset"
                    preferredLang: FRENCH
                  }
                ) {
                  result {
                    ... on AuthResult {
                      authToken
                      user {
                        id
                        userName
                        displayName
                        preferredLang
                        phoneValidated
                        emailValidated
                      }
                    }
                    ... on SignUpError {
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
              query,
              collections: collectionNames,
              transaction,
              uuidv4,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn(),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
              notify: {
                sendVerificationEmail: mockNotify,
              },
            },
          )

          const error = {
            data: {
              signUp: {
                result: {
                  code: 400,
                  description: 'Passwords do not match.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            'User: test.account@istio.actually.exists tried to sign up but passwords do not match.',
          ])
        })
      })
      describe('when the user name (email) already in use', () => {
        it('returns an email already in use error', async () => {
          const response = await graphql(
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
                      authToken
                      user {
                        id
                        userName
                        displayName
                        preferredLang
                        phoneValidated
                        emailValidated
                      }
                    }
                    ... on SignUpError {
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
              query,
              collections: collectionNames,
              transaction,
              uuidv4,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                    displayName: 'Test Account',
                    preferredLang: 'french',
                    phoneValidated: false,
                    emailValidated: false,
                  }),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
              notify: {
                sendVerificationEmail: mockNotify,
              },
            },
          )

          const error = {
            data: {
              signUp: {
                result: {
                  code: 400,
                  description: 'Email already in use.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            'User: test.account@istio.actually.exists tried to sign up, however there is already an account in use with that email.',
          ])
        })
      })
      describe('user is signing up with invite token', () => {
        describe('when the invite token user name and submitted user name do not match', () => {
          let token
          beforeEach(() => {
            token = tokenize({
              parameters: {
                userName: 'test.account@istio.actually.exists',
                orgKey: '123',
                requestedRole: 'admin',
              },
            })
          })
          it('returns an error', async () => {
            const response = await graphql(
              schema,
              `
                  mutation {
                    signUp(
                      input: {
                        displayName: "Test Account"
                        userName: "test@email.ca"
                        password: "testpassword123"
                        confirmPassword: "testpassword123"
                        preferredLang: FRENCH
                        signUpToken: "${token}"
                      }
                    ) {
                      result {
                        ... on AuthResult {
                          authToken
                          user {
                            id
                            userName
                            displayName
                            preferredLang
                            phoneValidated
                            emailValidated
                          }
                        }
                        ... on SignUpError {
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
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({
                    next: jest.fn(),
                  }),
                }),
                uuidv4,
                auth: {
                  bcrypt,
                  tokenize: mockTokenize,
                  verifyToken: verifyToken({ i18n }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn(),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                notify: {
                  sendVerificationEmail: mockNotify,
                },
              },
            )

            const error = {
              data: {
                signUp: {
                  result: {
                    code: 400,
                    description:
                      'Unable to sign up, please contact org admin for a new invite.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              'User: test@email.ca attempted to sign up with an invite token, however emails do not match.',
            ])
          })
        })
        describe('when the invite token org key is not a defined org', () => {
          let token
          beforeEach(() => {
            token = tokenize({
              parameters: {
                userName: 'test.account@istio.actually.exists',
                orgKey: '456',
                requestedRole: 'admin',
              },
            })
          })
          it('returns an error', async () => {
            const response = await graphql(
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
                        signUpToken: "${token}"
                      }
                    ) {
                      result {
                        ... on AuthResult {
                          authToken
                          user {
                            id
                            userName
                            displayName
                            preferredLang
                            phoneValidated
                            emailValidated
                          }
                        }
                        ... on SignUpError {
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
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({
                    next: jest.fn(),
                  }),
                }),
                uuidv4,
                auth: {
                  bcrypt,
                  tokenize: mockTokenize,
                  verifyToken: verifyToken({ i18n }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn(),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                notify: {
                  sendVerificationEmail: mockNotify,
                },
              },
            )

            const error = {
              data: {
                signUp: {
                  result: {
                    code: 400,
                    description:
                      'Unable to sign up, please contact org admin for a new invite.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              'User: test.account@istio.actually.exists attempted to sign up with an invite token, however the org could not be found.',
            ])
          })
        })
      })
      describe('given a cursor error', () => {
        describe('when gathering inserted user', () => {
          it('throws an error', async () => {
            const response = await graphql(
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
                        authToken
                        user {
                          id
                          userName
                          displayName
                          preferredLang
                          phoneValidated
                          emailValidated
                        }
                      }
                      ... on SignUpError {
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
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({
                    next: jest.fn().mockRejectedValue('Cursor Error'),
                  }),
                }),
                uuidv4,
                auth: {
                  bcrypt,
                  tokenize: mockTokenize,
                  verifyToken: verifyToken({ i18n }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn(),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                notify: {
                  sendVerificationEmail: mockNotify,
                },
              },
            )

            const error = [
              new GraphQLError('Unable to sign up. Please try again.'),
            ]

            expect(response.errors).toEqual(error)

            expect(consoleOutput).toEqual([
              'Cursor error occurred while user: test.account@istio.actually.exists attempted to sign up, creating user: Cursor Error',
            ])
          })
        })
      })
      describe('given a transaction error', () => {
        describe('when inserting user', () => {
          it('throws an error', async () => {
            const response = await graphql(
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
                        authToken
                        user {
                          id
                          userName
                          displayName
                          preferredLang
                          phoneValidated
                          emailValidated
                        }
                      }
                      ... on SignUpError {
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
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockRejectedValue('Transaction Step Error'),
                }),
                uuidv4,
                auth: {
                  bcrypt,
                  tokenize: mockTokenize,
                  verifyToken: verifyToken({ i18n }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn(),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                notify: {
                  sendVerificationEmail: mockNotify,
                },
              },
            )

            const error = [
              new GraphQLError('Unable to sign up. Please try again.'),
            ]

            expect(response.errors).toEqual(error)

            expect(consoleOutput).toEqual([
              'Transaction step error occurred while user: test.account@istio.actually.exists attempted to sign up, creating user: Transaction Step Error',
            ])
          })
        })
        describe('when inserting affiliation', () => {
          let token
          beforeEach(() => {
            token = tokenize({
              parameters: {
                userName: 'test.account@istio.actually.exists',
                orgKey: '123',
                requestedRole: 'admin',
              },
            })
          })
          it('throws an error', async () => {
            const response = await graphql(
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
                      signUpToken: "${token}"
                    }
                  ) {
                    result {
                      ... on AuthResult {
                        authToken
                        user {
                          id
                          userName
                          displayName
                          preferredLang
                          phoneValidated
                          emailValidated
                        }
                      }
                      ... on SignUpError {
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
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockReturnValueOnce({ next: jest.fn() })
                    .mockRejectedValue('Transaction Step Error'),
                }),
                uuidv4,
                auth: {
                  bcrypt,
                  tokenize: mockTokenize,
                  verifyToken: verifyToken({ i18n }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn(),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                notify: {
                  sendVerificationEmail: mockNotify,
                },
              },
            )

            const error = [
              new GraphQLError('Unable to sign up. Please try again.'),
            ]

            expect(response.errors).toEqual(error)

            expect(consoleOutput).toEqual([
              'Transaction step error occurred while user: test.account@istio.actually.exists attempted to sign up, assigning affiliation: Transaction Step Error',
            ])
          })
        })
        describe('when committing transaction', () => {
          it('throws an error', async () => {
            const response = await graphql(
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
                        authToken
                        user {
                          id
                          userName
                          displayName
                          preferredLang
                          phoneValidated
                          emailValidated
                        }
                      }
                      ... on SignUpError {
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
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({ next: jest.fn() }),
                  commit: jest
                    .fn()
                    .mockRejectedValue('Transaction Commit Error'),
                }),
                uuidv4,
                auth: {
                  bcrypt,
                  tokenize: mockTokenize,
                  verifyToken: verifyToken({ i18n }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn(),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                notify: {
                  sendVerificationEmail: mockNotify,
                },
              },
            )

            const error = [
              new GraphQLError('Unable to sign up. Please try again.'),
            ]

            expect(response.errors).toEqual(error)

            expect(consoleOutput).toEqual([
              'Transaction commit error occurred while user: test.account@istio.actually.exists attempted to sign up: Transaction Commit Error',
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
      describe('when the password is not strong enough', () => {
        it('returns a password too short error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                signUp(
                  input: {
                    displayName: "Test Account"
                    userName: "test.account@istio.actually.exists"
                    password: "123"
                    confirmPassword: "123"
                    preferredLang: FRENCH
                  }
                ) {
                  result {
                    ... on AuthResult {
                      authToken
                      user {
                        id
                        userName
                        displayName
                        preferredLang
                        phoneValidated
                        emailValidated
                      }
                    }
                    ... on SignUpError {
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
              query,
              collections: collectionNames,
              transaction,
              uuidv4,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn(),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
              notify: {
                sendVerificationEmail: mockNotify,
              },
            },
          )

          const error = {
            data: {
              signUp: {
                result: {
                  code: 400,
                  description: 'Le mot de passe ne répond pas aux exigences.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            'User: test.account@istio.actually.exists tried to sign up but did not meet requirements.',
          ])
        })
      })
      describe('when the passwords do not match', () => {
        it('returns a password not matching error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                signUp(
                  input: {
                    displayName: "Test Account"
                    userName: "test.account@istio.actually.exists"
                    password: "testpassword123"
                    confirmPassword: "321drowssaptset"
                    preferredLang: FRENCH
                  }
                ) {
                  result {
                    ... on AuthResult {
                      authToken
                      user {
                        id
                        userName
                        displayName
                        preferredLang
                        phoneValidated
                        emailValidated
                      }
                    }
                    ... on SignUpError {
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
              query,
              collections: collectionNames,
              transaction,
              uuidv4,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn(),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
              notify: {
                sendVerificationEmail: mockNotify,
              },
            },
          )

          const error = {
            data: {
              signUp: {
                result: {
                  code: 400,
                  description: 'Les mots de passe ne correspondent pas.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            'User: test.account@istio.actually.exists tried to sign up but passwords do not match.',
          ])
        })
      })
      describe('when the user name (email) already in use', () => {
        it('returns an email already in use error', async () => {
          const response = await graphql(
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
                      authToken
                      user {
                        id
                        userName
                        displayName
                        preferredLang
                        phoneValidated
                        emailValidated
                      }
                    }
                    ... on SignUpError {
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
              query,
              collections: collectionNames,
              transaction,
              uuidv4,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                    displayName: 'Test Account',
                    preferredLang: 'french',
                    phoneValidated: false,
                    emailValidated: false,
                  }),
                },
                loadUserByKey: {
                  load: jest.fn(),
                },
              },
              notify: {
                sendVerificationEmail: mockNotify,
              },
            },
          )

          const error = {
            data: {
              signUp: {
                result: {
                  code: 400,
                  description: 'Courriel déjà utilisé.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            'User: test.account@istio.actually.exists tried to sign up, however there is already an account in use with that email.',
          ])
        })
      })
      describe('user is signing up with invite token', () => {
        describe('when the invite token user name and submitted user name do not match', () => {
          let token
          beforeEach(() => {
            token = tokenize({
              parameters: {
                userName: 'test.account@istio.actually.exists',
                orgKey: '123',
                requestedRole: 'admin',
              },
            })
          })
          it('returns an error', async () => {
            const response = await graphql(
              schema,
              `
                  mutation {
                    signUp(
                      input: {
                        displayName: "Test Account"
                        userName: "test@email.ca"
                        password: "testpassword123"
                        confirmPassword: "testpassword123"
                        preferredLang: FRENCH
                        signUpToken: "${token}"
                      }
                    ) {
                      result {
                        ... on AuthResult {
                          authToken
                          user {
                            id
                            userName
                            displayName
                            preferredLang
                            phoneValidated
                            emailValidated
                          }
                        }
                        ... on SignUpError {
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
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({
                    next: jest.fn(),
                  }),
                }),
                uuidv4,
                auth: {
                  bcrypt,
                  tokenize: mockTokenize,
                  verifyToken: verifyToken({ i18n }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn(),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                notify: {
                  sendVerificationEmail: mockNotify,
                },
              },
            )

            const error = {
              data: {
                signUp: {
                  result: {
                    code: 400,
                    description:
                      "Impossible de s'inscrire, veuillez contacter l'administrateur de l'organisation pour obtenir une nouvelle invitation.",
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              'User: test@email.ca attempted to sign up with an invite token, however emails do not match.',
            ])
          })
        })
        describe('when the invite token org key is not a defined org', () => {
          let token
          beforeEach(() => {
            token = tokenize({
              parameters: {
                userName: 'test.account@istio.actually.exists',
                orgKey: '456',
                requestedRole: 'admin',
              },
            })
          })
          it('returns an error', async () => {
            const response = await graphql(
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
                        signUpToken: "${token}"
                      }
                    ) {
                      result {
                        ... on AuthResult {
                          authToken
                          user {
                            id
                            userName
                            displayName
                            preferredLang
                            phoneValidated
                            emailValidated
                          }
                        }
                        ... on SignUpError {
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
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({
                    next: jest.fn(),
                  }),
                }),
                uuidv4,
                auth: {
                  bcrypt,
                  tokenize: mockTokenize,
                  verifyToken: verifyToken({ i18n }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn(),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                notify: {
                  sendVerificationEmail: mockNotify,
                },
              },
            )

            const error = {
              data: {
                signUp: {
                  result: {
                    code: 400,
                    description:
                      "Impossible de s'inscrire, veuillez contacter l'administrateur de l'organisation pour obtenir une nouvelle invitation.",
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              'User: test.account@istio.actually.exists attempted to sign up with an invite token, however the org could not be found.',
            ])
          })
        })
      })
      describe('given a cursor error', () => {
        describe('when gathering inserted user', () => {
          it('throws an error', async () => {
            const response = await graphql(
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
                        authToken
                        user {
                          id
                          userName
                          displayName
                          preferredLang
                          phoneValidated
                          emailValidated
                        }
                      }
                      ... on SignUpError {
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
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({
                    next: jest.fn().mockRejectedValue('Cursor Error'),
                  }),
                }),
                uuidv4,
                auth: {
                  bcrypt,
                  tokenize: mockTokenize,
                  verifyToken: verifyToken({ i18n }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn(),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                notify: {
                  sendVerificationEmail: mockNotify,
                },
              },
            )

            const error = [
              new GraphQLError("Impossible de s'inscrire. Veuillez réessayer."),
            ]

            expect(response.errors).toEqual(error)

            expect(consoleOutput).toEqual([
              'Cursor error occurred while user: test.account@istio.actually.exists attempted to sign up, creating user: Cursor Error',
            ])
          })
        })
      })
      describe('given a transaction error', () => {
        describe('when inserting user', () => {
          it('throws an error', async () => {
            const response = await graphql(
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
                        authToken
                        user {
                          id
                          userName
                          displayName
                          preferredLang
                          phoneValidated
                          emailValidated
                        }
                      }
                      ... on SignUpError {
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
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockRejectedValue('Transaction Step Error'),
                }),
                uuidv4,
                auth: {
                  bcrypt,
                  tokenize: mockTokenize,
                  verifyToken: verifyToken({ i18n }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn(),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                notify: {
                  sendVerificationEmail: mockNotify,
                },
              },
            )

            const error = [
              new GraphQLError("Impossible de s'inscrire. Veuillez réessayer."),
            ]

            expect(response.errors).toEqual(error)

            expect(consoleOutput).toEqual([
              'Transaction step error occurred while user: test.account@istio.actually.exists attempted to sign up, creating user: Transaction Step Error',
            ])
          })
        })
        describe('when inserting affiliation', () => {
          let token
          beforeEach(() => {
            token = tokenize({
              parameters: {
                userName: 'test.account@istio.actually.exists',
                orgKey: '123',
                requestedRole: 'admin',
              },
            })
          })
          it('throws an error', async () => {
            const response = await graphql(
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
                      signUpToken: "${token}"
                    }
                  ) {
                    result {
                      ... on AuthResult {
                        authToken
                        user {
                          id
                          userName
                          displayName
                          preferredLang
                          phoneValidated
                          emailValidated
                        }
                      }
                      ... on SignUpError {
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
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockReturnValueOnce({ next: jest.fn() })
                    .mockRejectedValue('Transaction Step Error'),
                }),
                uuidv4,
                auth: {
                  bcrypt,
                  tokenize: mockTokenize,
                  verifyToken: verifyToken({ i18n }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn(),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                notify: {
                  sendVerificationEmail: mockNotify,
                },
              },
            )

            const error = [
              new GraphQLError("Impossible de s'inscrire. Veuillez réessayer."),
            ]

            expect(response.errors).toEqual(error)

            expect(consoleOutput).toEqual([
              'Transaction step error occurred while user: test.account@istio.actually.exists attempted to sign up, assigning affiliation: Transaction Step Error',
            ])
          })
        })
        describe('when committing transaction', () => {
          it('throws an error', async () => {
            const response = await graphql(
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
                        authToken
                        user {
                          id
                          userName
                          displayName
                          preferredLang
                          phoneValidated
                          emailValidated
                        }
                      }
                      ... on SignUpError {
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
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({ next: jest.fn() }),
                  commit: jest
                    .fn()
                    .mockRejectedValue('Transaction Commit Error'),
                }),
                uuidv4,
                auth: {
                  bcrypt,
                  tokenize: mockTokenize,
                  verifyToken: verifyToken({ i18n }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn(),
                  },
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 123,
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
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                notify: {
                  sendVerificationEmail: mockNotify,
                },
              },
            )

            const error = [
              new GraphQLError("Impossible de s'inscrire. Veuillez réessayer."),
            ]

            expect(response.errors).toEqual(error)

            expect(consoleOutput).toEqual([
              'Transaction commit error occurred while user: test.account@istio.actually.exists attempted to sign up: Transaction Commit Error',
            ])
          })
        })
      })
    })
  })
})
