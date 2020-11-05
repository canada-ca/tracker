const { ArangoTools, dbNameFromFile } = require('arango-tools')
const bcrypt = require('bcrypt')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../locale/en/messages')
const frenchMessages = require('../locale/fr/messages')
const { makeMigrations } = require('../../migrations')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')
const { cleanseInput } = require('../validators')
const { tokenize } = require('../auth')
const { userLoaderByUserName, userLoaderByKey } = require('../loaders')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('authenticate user account', () => {
  let query, drop, truncate, migrate, schema, i18n

  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
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
    ;({ query, drop, truncate } = await migrate(
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
    describe('given successful update of users password', () => {
      describe('user updates their display name', () => {
        it('returns a successful status message', async () => {
          let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          let user = await cursor.next()

          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(input: { displayName: "John Doe" }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              query,
              userId: user._key,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateUserProfile: {
                status: 'Profile successfully updated.',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated their profile.`,
          ])

          cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          user = await cursor.next()
          expect(user.displayName).toEqual('John Doe')
        })
      })
      describe('user updates their user name', () => {
        it('returns a successful status message', async () => {
          let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          let user = await cursor.next()

          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(
                  input: { userName: "john.doe@istio.actually.works" }
                ) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              query,
              userId: user._key,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateUserProfile: {
                status: 'Profile successfully updated.',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated their profile.`,
          ])

          cursor = await query`
            FOR user IN users
              FILTER user.userName == "john.doe@istio.actually.works"
              RETURN user
          `
          user = await cursor.next()
          expect(user.userName).toEqual('john.doe@istio.actually.works')
        })
      })
      describe('user updates their preferred language', () => {
        it('returns a successful status message', async () => {
          let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          let user = await cursor.next()

          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(input: { preferredLang: ENGLISH }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              query,
              userId: user._key,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateUserProfile: {
                status: 'Profile successfully updated.',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated their profile.`,
          ])

          cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          user = await cursor.next()
          expect(user.preferredLang).toEqual('english')
        })
      })
      describe('user updates display name, user name, and preferred language', () => {
        it('returns a successful status message', async () => {
          let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          let user = await cursor.next()

          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(
                  input: {
                    displayName: "John Smith"
                    userName: "john.smith@istio.actually.works"
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
              query,
              userId: user._key,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateUserProfile: {
                status: 'Profile successfully updated.',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated their profile.`,
          ])

          cursor = await query`
            FOR user IN users
              FILTER user.userName == "john.smith@istio.actually.works"
              RETURN user
          `
          user = await cursor.next()
          expect(user.displayName).toEqual('John Smith')
          expect(user.userName).toEqual('john.smith@istio.actually.works')
          expect(user.preferredLang).toEqual('english')
        })
      })
    })
    describe('given unsuccessful update of users password', () => {
      describe('user id is undefined', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(
                  input: {
                    displayName: "John Smith"
                    userName: "john.smith@istio.actually.works"
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
              query,
              userId: undefined,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError('Authentication error, please sign in again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            'User attempted to update their profile, but the user id is undefined.',
          ])
        })
      })
      describe('user cannot be found in the database', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(
                  input: {
                    displayName: "John Smith"
                    userName: "john.smith@istio.actually.works"
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
              query,
              userId: 1,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update profile. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 1 attempted to update their profile, but no account is associated with that id.`,
          ])
        })
      })
      describe('database error occurs when updating password', () => {
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await cursor.next()

          const userNameLoader = userLoaderByUserName(query)
          const idLoader = userLoaderByKey(query)

          query = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(
                  input: {
                    displayName: "John Smith"
                    userName: "john.smith@istio.actually.works"
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
              query,
              userId: user._key,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userNameLoader,
                userLoaderByKey: idLoader,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update profile. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error ocurred when user: ${user._key} attempted to update their profile: Error: Database error occurred.`,
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
    describe('given successful update of users password', () => {
      describe('user updates their display name', () => {
        it('returns a successful status message', async () => {
          let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          let user = await cursor.next()

          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(input: { displayName: "John Doe" }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              query,
              userId: user._key,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateUserProfile: {
                status: 'todo',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated their profile.`,
          ])

          cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          user = await cursor.next()
          expect(user.displayName).toEqual('John Doe')
        })
      })
      describe('user updates their user name', () => {
        it('returns a successful status message', async () => {
          let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          let user = await cursor.next()

          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(
                  input: { userName: "john.doe@istio.actually.works" }
                ) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              query,
              userId: user._key,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateUserProfile: {
                status: 'todo',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated their profile.`,
          ])

          cursor = await query`
            FOR user IN users
              FILTER user.userName == "john.doe@istio.actually.works"
              RETURN user
          `
          user = await cursor.next()
          expect(user.userName).toEqual('john.doe@istio.actually.works')
        })
      })
      describe('user updates their preferred language', () => {
        it('returns a successful status message', async () => {
          let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          let user = await cursor.next()

          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(input: { preferredLang: ENGLISH }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              query,
              userId: user._key,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateUserProfile: {
                status: 'todo',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated their profile.`,
          ])

          cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          user = await cursor.next()
          expect(user.preferredLang).toEqual('english')
        })
      })
      describe('user updates display name, user name, and preferred language', () => {
        it('returns a successful status message', async () => {
          let cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          let user = await cursor.next()

          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(
                  input: {
                    displayName: "John Smith"
                    userName: "john.smith@istio.actually.works"
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
              query,
              userId: user._key,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const expectedResponse = {
            data: {
              updateUserProfile: {
                status: 'todo',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated their profile.`,
          ])

          cursor = await query`
            FOR user IN users
              FILTER user.userName == "john.smith@istio.actually.works"
              RETURN user
          `
          user = await cursor.next()
          expect(user.displayName).toEqual('John Smith')
          expect(user.userName).toEqual('john.smith@istio.actually.works')
          expect(user.preferredLang).toEqual('english')
        })
      })
    })
    describe('given unsuccessful update of users password', () => {
      describe('user id is undefined', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(
                  input: {
                    displayName: "John Smith"
                    userName: "john.smith@istio.actually.works"
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
              query,
              userId: undefined,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            'User attempted to update their profile, but the user id is undefined.',
          ])
        })
      })
      describe('user cannot be found in the database', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(
                  input: {
                    displayName: "John Smith"
                    userName: "john.smith@istio.actually.works"
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
              query,
              userId: 1,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 1 attempted to update their profile, but no account is associated with that id.`,
          ])
        })
      })
      describe('database error occurs when updating password', () => {
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await cursor.next()

          const userNameLoader = userLoaderByUserName(query)
          const idLoader = userLoaderByKey(query)

          query = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(
                  input: {
                    displayName: "John Smith"
                    userName: "john.smith@istio.actually.works"
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
              query,
              userId: user._key,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByUserName: userNameLoader,
                userLoaderByKey: idLoader,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error ocurred when user: ${user._key} attempted to update their profile: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
