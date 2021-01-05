const { ArangoTools, dbNameFromFile } = require('arango-tools')
const bcrypt = require('bcrypt')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { setupI18n } = require('@lingui/core')
const request = require('supertest')

const englishMessages = require('../../../locale/en/messages')
const frenchMessages = require('../../../locale/fr/messages')
const { makeMigrations } = require('../../../../migrations')
const { createQuerySchema } = require('../../../queries')
const { createMutationSchema } = require('../..')
const { cleanseInput } = require('../../../validators')
const { userLoaderByUserName } = require('../../../loaders')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('user sign up', () => {
  let query, drop, truncate, migrate, collections, schema, i18n, tokenize

  beforeAll(async () => {
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
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    await truncate()
  })

  afterEach(() => {
    consoleOutput = []
  })

  afterEach(async () => {
    await drop()
  })

  describe('given successful sign up', () => {
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
            request,
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

        const cursor = await query`
                    FOR user IN users
                        FILTER user.userName == "test.account@istio.actually.exists"
                        RETURN user
                `
        const users = await cursor.all()

        const expectedResult = {
          data: {
            signUp: {
              authResult: {
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

        const cursor = await query`
                    FOR user IN users
                        FILTER user.userName == "test.account@istio.actually.exists"
                        RETURN user
                `
        const user = await cursor.next()

        const expectedResult = {
          data: {
            signUp: {
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

        expect(response).toEqual(expectedResult)
        expect(consoleOutput).toEqual([
          'User: test.account@istio.actually.exists successfully created a new account.',
        ])
      })
    })
  })
  describe('given unsuccessful sign up', () => {
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
                  authResult {
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
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
              },
            },
          )

          const error = [new GraphQLError('Password is too short.')]

          expect(response.errors).toEqual(error)
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
                  authResult {
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
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
              },
            },
          )

          const error = [new GraphQLError('Passwords do not match.')]

          expect(response.errors).toEqual(error)
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
                  authResult {
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
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
              },
            },
          )

          const error = [new GraphQLError('Username already in use.')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            'User: test.account@istio.actually.exists tried to sign up, however there is already an account in use with that username.',
          ])
        })
      })
      describe('database error occurs when inserting user info into DB', () => {
        it('throws an error', async () => {
          const loader = userLoaderByUserName(query)

          query = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          try {
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
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  userLoaderByUserName: loader,
                },
              },
            )
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to sign up. Please try again.'),
            )
          }

          expect(consoleOutput).toEqual([
            `Database error occurred when test.account@istio.actually.exists tried to sign up: Error: Database error occurred.`,
          ])
        })
      })
      describe('cursor error occurs when retrieving newly created user', () => {
        it('throws an error', async () => {
          const loader = userLoaderByUserName(query)

          const cursor = {
            next() {
              throw new Error('Cursor error occurred.')
            },
          }
          query = jest.fn().mockReturnValue(cursor)

          try {
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
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  userLoaderByUserName: loader,
                },
              },
            )
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to sign up. Please try again.'),
            )
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred when trying to get new user test.account@istio.actually.exists: Error: Cursor error occurred.`,
          ])
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
                  authResult {
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
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
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
                  authResult {
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
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
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
                  authResult {
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
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            'User: test.account@istio.actually.exists tried to sign up, however there is already an account in use with that username.',
          ])
        })
      })
      describe('database error occurs when inserting user info into DB', () => {
        it('throws an error', async () => {
          const loader = userLoaderByUserName(query)

          query = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          try {
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
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  userLoaderByUserName: loader,
                },
              },
            )
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred when test.account@istio.actually.exists tried to sign up: Error: Database error occurred.`,
          ])
        })
      })
      describe('cursor error occurs when retrieving newly created user', () => {
        it('throws an error', async () => {
          const loader = userLoaderByUserName(query)

          const cursor = {
            next() {
              throw new Error('Cursor error occurred.')
            },
          }
          query = jest.fn().mockReturnValue(cursor)

          try {
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
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  userLoaderByUserName: loader,
                },
              },
            )
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred when trying to get new user test.account@istio.actually.exists: Error: Cursor error occurred.`,
          ])
        })
      })
    })
  })
})
