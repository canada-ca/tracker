import { ensure, dbNameFromFile } from 'arango-tools'
import bcrypt from 'bcryptjs'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { tokenize, verifyToken } from '../../../auth'
import { userLoaderByKey } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url, SIGN_IN_KEY } = process.env

describe('authenticate user account', () => {
  let query, drop, truncate, schema, collections, mockTokenize

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
    // Generate DB Items
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
    mockTokenize = jest.fn().mockReturnValue('token')
  })


  beforeEach(async () => {
    consoleOutput.length = 0
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given successful authentication', () => {
    beforeEach(async () => {
      await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
        preferredLang: 'french',
        phoneValidated: false,
        emailValidated: false,
        tfaCode: 123456,
      })
    })
    it('returns users information and JWT', async () => {
      let cursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      let user = await cursor.next()

      const token = tokenize({
        parameters: { userKey: user._key },
        secret: String(SIGN_IN_KEY),
      })
      const response = await graphql(
        schema,
        `
          mutation {
            authenticate(
              input: {
                authenticationCode: 123456
                authenticateToken: "${token}"
              }
            ) {
              authResult {
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
            }
          }
        `,
        null,
        {
          query,
          auth: {
            bcrypt,
            tokenize: mockTokenize,
            verifyToken: verifyToken({}),
          },
          validators: {
            cleanseInput,
          },
          loaders: {
            userLoaderByKey: userLoaderByKey(query),
          },
        },
      )

      const expectedResult = {
        data: {
          authenticate: {
            authResult: {
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

      cursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      user = await cursor.next()

      expect(response).toEqual(expectedResult)
      expect(user.tfaCode).toEqual(null)
      expect(consoleOutput).toEqual([
        `User: ${user._key} successfully authenticated their account.`,
      ])
    })
  })
  describe('given unsuccessful authentication', () => {
    let i18n
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
      describe('when userKey in token is undefined', () => {
        it('returns an error message', async () => {
          const token = tokenize({
            parameters: { userKey: undefined },
            secret: String(SIGN_IN_KEY),
          })
          const response = await graphql(
            schema,
            `
              mutation {
                authenticate(
                  input: {
                    authenticationCode: 654321
                    authenticateToken: "${token}"
                  }
                ) {
                  authResult {
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
                }
              }
            `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError('Unable to authenticate. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Authentication token does not contain the userKey`,
          ])
        })
      })
      describe('when userKey is not a field in the token parameters', () => {
        it('returns an error message', async () => {
          const token = tokenize({
            parameters: {},
            secret: String(SIGN_IN_KEY),
          })
          const response = await graphql(
            schema,
            `
              mutation {
                authenticate(
                  input: {
                    authenticationCode: 654321
                    authenticateToken: "${token}"
                  }
                ) {
                  authResult {
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
                }
              }
            `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError('Unable to authenticate. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Authentication token does not contain the userKey`,
          ])
        })
      })
      describe('when user cannot be found in database', () => {
        it('returns an error message', async () => {
          const token = tokenize({
            parameters: { userKey: 1 },
            secret: String(SIGN_IN_KEY),
          })
          const response = await graphql(
            schema,
            `
              mutation {
                authenticate(
                  input: {
                    authenticationCode: 654321
                    authenticateToken: "${token}"
                  }
                ) {
                  authResult {
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
                }
              }
            `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError('Unable to authenticate. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 1 attempted to authenticate, no account is associated with this id.`,
          ])
        })
      })
      describe('when tfa codes do not match', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'french',
            phoneValidated: false,
            emailValidated: false,
            tfaCode: 123456,
          })
        })
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await cursor.next()

          const token = tokenize({
            parameters: { userKey: user._key },
            secret: String(SIGN_IN_KEY),
          })
          const response = await graphql(
            schema,
            `
              mutation {
                authenticate(
                  input: {
                    authenticationCode: 654321
                    authenticateToken: "${token}"
                  }
                ) {
                  authResult {
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
                }
              }
            `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError('Unable to authenticate. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to authenticate their account, however the tfaCodes did not match.`,
          ])
        })
      })
      describe('database error occurs when setting tfaCode to null', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'french',
            phoneValidated: false,
            emailValidated: false,
            tfaCode: 123456,
          })
        })
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await cursor.next()
          const loader = userLoaderByKey(query)
          const token = tokenize({
            parameters: { userKey: user._key },
            secret: String(SIGN_IN_KEY),
          })

          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
              mutation {
                authenticate(
                  input: {
                    authenticationCode: 123456
                    authenticateToken: "${token}"
                  }
                ) {
                  authResult {
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
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: loader,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to authenticate. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error ocurred when resetting failed attempts for user: ${user._key} during authentication: Error: Database error occurred.`,
          ])
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
      describe('when userKey in token is undefined', () => {
        it('returns an error message', async () => {
          const token = tokenize({
            parameters: { userKey: undefined },
            secret: String(SIGN_IN_KEY),
          })
          const response = await graphql(
            schema,
            `
              mutation {
                authenticate(
                  input: {
                    authenticationCode: 654321
                    authenticateToken: "${token}"
                  }
                ) {
                  authResult {
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
                }
              }
            `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Authentication token does not contain the userKey`,
          ])
        })
      })
      describe('when userKey is not a field in the token parameters', () => {
        it('returns an error message', async () => {
          const token = tokenize({
            parameters: {},
            secret: String(SIGN_IN_KEY),
          })
          const response = await graphql(
            schema,
            `
              mutation {
                authenticate(
                  input: {
                    authenticationCode: 654321
                    authenticateToken: "${token}"
                  }
                ) {
                  authResult {
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
                }
              }
            `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Authentication token does not contain the userKey`,
          ])
        })
      })
      describe('when user cannot be found in database', () => {
        it('returns an error message', async () => {
          const token = tokenize({
            parameters: { userKey: 1 },
            secret: String(SIGN_IN_KEY),
          })
          const response = await graphql(
            schema,
            `
              mutation {
                authenticate(
                  input: {
                    authenticationCode: 654321
                    authenticateToken: "${token}"
                  }
                ) {
                  authResult {
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
                }
              }
            `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 1 attempted to authenticate, no account is associated with this id.`,
          ])
        })
      })
      describe('when tfa codes do not match', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'french',
            phoneValidated: false,
            emailValidated: false,
            tfaCode: 123456,
          })
        })
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await cursor.next()

          const token = tokenize({
            parameters: { userKey: user._key },
            secret: String(SIGN_IN_KEY),
          })
          const response = await graphql(
            schema,
            `
              mutation {
                authenticate(
                  input: {
                    authenticationCode: 654321
                    authenticateToken: "${token}"
                  }
                ) {
                  authResult {
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
                }
              }
            `,
            null,
            {
              i18n,
              query,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to authenticate their account, however the tfaCodes did not match.`,
          ])
        })
      })
      describe('database error occurs when setting tfaCode to null', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'french',
            phoneValidated: false,
            emailValidated: false,
            tfaCode: 123456,
          })
        })
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await cursor.next()
          const loader = userLoaderByKey(query)
          const token = tokenize({
            parameters: { userKey: user._key },
            secret: String(SIGN_IN_KEY),
          })

          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
              mutation {
                authenticate(
                  input: {
                    authenticationCode: 123456
                    authenticateToken: "${token}"
                  }
                ) {
                  authResult {
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
                }
              }
            `,
            null,
            {
              i18n,
              query: mockedQuery,
              auth: {
                bcrypt,
                tokenize,
                verifyToken: verifyToken({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: loader,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error ocurred when resetting failed attempts for user: ${user._key} during authentication: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
