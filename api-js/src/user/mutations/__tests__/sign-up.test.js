import { ensure, dbNameFromFile } from 'arango-tools'
import bcrypt from 'bcryptjs'
import { graphql, GraphQLError, GraphQLSchema } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'
import request from 'supertest'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { tokenize, verifyToken } from '../../../auth'
import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { userLoaderByUserName, loadUserByKey } from '../../loaders'
import { loadOrgByKey } from '../../../organization/loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('user sign up', () => {
  let query,
    drop,
    truncate,
    collections,
    transaction,
    schema,
    i18n,
    mockTokenize

  beforeAll(async () => {
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
    mockTokenize = jest.fn().mockReturnValue('token')
  })

  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
  })

  afterEach(async () => {
    consoleOutput = []
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given successful sign up', () => {
    describe('when user is not signing up without an invite token', () => {
      describe('when the users preferred language is english', () => {
        it('returns auth result with user info', async () => {
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
              collections,
              transaction,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                loadUserByKey: loadUserByKey({ query }),
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
                    id: `${toGlobalId('users', users[0]._key)}`,
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
          expect(consoleOutput).toEqual([
            'User: test.account@istio.actually.exists successfully created a new account.',
          ])
        })
      })
      describe('when the users preferred language is french', () => {
        it('returns auth result with user info', async () => {
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
              query,
              collections,
              transaction,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                loadUserByKey: loadUserByKey({ query }),
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
                    id: `${toGlobalId('users', user._key)}`,
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
          expect(consoleOutput).toEqual([
            'User: test.account@istio.actually.exists successfully created a new account.',
          ])
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
      describe('when the users preferred language is english', () => {
        it('returns auth result with user info', async () => {
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
              collections,
              transaction,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
                verifyToken: verifyToken({ i18n: {} }),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                loadUserByKey: loadUserByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
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
                    id: `${toGlobalId('users', user._key)}`,
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
              collections,
              transaction,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
                verifyToken: verifyToken({ i18n: {} }),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                loadUserByKey: loadUserByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
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
      })
      describe('when the users preferred language is french', () => {
        it('returns auth result with user info', async () => {
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
              query,
              collections,
              transaction,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
                verifyToken: verifyToken({ i18n: {} }),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                loadUserByKey: loadUserByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'fr' }),
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
                    id: `${toGlobalId('users', user._key)}`,
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
              collections,
              transaction,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
                verifyToken: verifyToken({ i18n: {} }),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                loadUserByKey: loadUserByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
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
    describe('given unsuccessful sign up', () => {
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
              collections,
              transaction,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                loadUserByKey: loadUserByKey({ query }),
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
              collections,
              transaction,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                loadUserByKey: loadUserByKey({ query }),
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
      describe('when the user name already in use', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'french',
            phoneValidated: false,
            emailValidated: false,
          })
        })
        it('returns a user name already in use error', async () => {
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
              collections,
              transaction,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              signUp: {
                result: {
                  code: 400,
                  description: 'Username already in use.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            'User: test.account@istio.actually.exists tried to sign up, however there is already an account in use with that username.',
          ])
        })
      })
      describe('user is signing up with invite token', () => {
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
        })
        describe('when the invite token user name and submitted user name do not match', () => {
          beforeEach(() => {
            token = tokenize({
              parameters: {
                userName: 'test.account@istio.actually.exists',
                orgKey: org._key,
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
                collections,
                transaction,
                auth: {
                  bcrypt,
                  tokenize: mockTokenize,
                  verifyToken: verifyToken({ i18n: {} }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  userLoaderByUserName: userLoaderByUserName(query),
                  loadUserByKey: loadUserByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
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
                collections,
                transaction,
                auth: {
                  bcrypt,
                  tokenize: mockTokenize,
                  verifyToken: verifyToken({ i18n: {} }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  userLoaderByUserName: userLoaderByUserName(query),
                  loadUserByKey: loadUserByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
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
    })
    describe('given a transaction error', () => {
      describe('when inserting user', () => {
        it('throws an error', async () => {
          const mockedStep = jest
            .fn()
            .mockRejectedValue('Transaction Step Error')
          const mockedTransaction = jest.fn().mockReturnValue({
            step: mockedStep,
          })

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
              collections,
              transaction: mockedTransaction,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                loadUserByKey: loadUserByKey({ query }),
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
        it('throws an error', async () => {
          const mockedStep = jest
            .fn()
            .mockReturnValueOnce({})
            .mockRejectedValue('Transaction Step Error')
          const mockedTransaction = jest.fn().mockReturnValue({
            step: mockedStep,
          })

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
              collections,
              transaction: mockedTransaction,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
                verifyToken: verifyToken({ i18n: {} }),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                loadUserByKey: loadUserByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
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
          const mockedStep = jest.fn().mockReturnValue({})
          const mockedCommit = jest
            .fn()
            .mockRejectedValue('Transaction Commit Error')
          const mockedTransaction = jest.fn().mockReturnValue({
            step: mockedStep,
            commit: mockedCommit,
          })

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
              collections,
              transaction: mockedTransaction,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                loadUserByKey: loadUserByKey({ query }),
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
    describe('given unsuccessful sign up', () => {
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
              collections,
              transaction,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              signUp: {
                result: {
                  code: 400,
                  description: 'todo',
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
              collections,
              transaction,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              signUp: {
                result: {
                  code: 400,
                  description: 'todo',
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
      describe('when the user name already in use', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'french',
            phoneValidated: false,
            emailValidated: false,
          })
        })
        it('returns a user name already in use error', async () => {
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
              collections,
              transaction,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = {
            data: {
              signUp: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            'User: test.account@istio.actually.exists tried to sign up, however there is already an account in use with that username.',
          ])
        })
      })
      describe('user is signing up with invite token', () => {
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
        })
        describe('when the invite token user name and submitted user name do not match', () => {
          beforeEach(() => {
            token = tokenize({
              parameters: {
                userName: 'test.account@istio.actually.exists',
                orgKey: org._key,
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
                collections,
                transaction,
                auth: {
                  bcrypt,
                  tokenize: mockTokenize,
                  verifyToken: verifyToken({ i18n: {} }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  userLoaderByUserName: userLoaderByUserName(query),
                  loadUserByKey: loadUserByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                },
              },
            )

            const error = {
              data: {
                signUp: {
                  result: {
                    code: 400,
                    description: 'todo',
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
                collections,
                transaction,
                auth: {
                  bcrypt,
                  tokenize: mockTokenize,
                  verifyToken: verifyToken({ i18n: {} }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  userLoaderByUserName: userLoaderByUserName(query),
                  loadUserByKey: loadUserByKey({ query }),
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                },
              },
            )

            const error = {
              data: {
                signUp: {
                  result: {
                    code: 400,
                    description: 'todo',
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
    })
    describe('given a transaction error', () => {
      describe('when inserting user', () => {
        it('throws an error', async () => {
          const mockedStep = jest
            .fn()
            .mockRejectedValue('Transaction Step Error')
          const mockedTransaction = jest.fn().mockReturnValue({
            step: mockedStep,
          })

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
              collections,
              transaction: mockedTransaction,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)

          expect(consoleOutput).toEqual([
            'Transaction step error occurred while user: test.account@istio.actually.exists attempted to sign up, creating user: Transaction Step Error',
          ])
        })
      })
      describe('when inserting affiliation', () => {
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
        it('throws an error', async () => {
          const mockedStep = jest
            .fn()
            .mockReturnValueOnce({})
            .mockRejectedValue('Transaction Step Error')
          const mockedTransaction = jest.fn().mockReturnValue({
            step: mockedStep,
          })

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
              collections,
              transaction: mockedTransaction,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
                verifyToken: verifyToken({ i18n: {} }),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                loadUserByKey: loadUserByKey({ query }),
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)

          expect(consoleOutput).toEqual([
            'Transaction step error occurred while user: test.account@istio.actually.exists attempted to sign up, assigning affiliation: Transaction Step Error',
          ])
        })
      })
      describe('when committing transaction', () => {
        it('throws an error', async () => {
          const mockedStep = jest.fn().mockReturnValue({})
          const mockedCommit = jest
            .fn()
            .mockRejectedValue('Transaction Commit Error')
          const mockedTransaction = jest.fn().mockReturnValue({
            step: mockedStep,
            commit: mockedCommit,
          })

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
              collections,
              transaction: mockedTransaction,
              auth: {
                bcrypt,
                tokenize: mockTokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)

          expect(consoleOutput).toEqual([
            'Transaction commit error occurred while user: test.account@istio.actually.exists attempted to sign up: Transaction Commit Error',
          ])
        })
      })
    })
  })
})
