const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const bcrypt = require('bcrypt')
const { graphql, GraphQLSchema } = require('graphql')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../locale/en/messages')
const frenchMessages = require('../locale/fr/messages')
const { makeMigrations } = require('../../migrations')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')
const { cleanseInput } = require('../validators')
const { tokenize } = require('../auth')
const { userLoaderByUserName } = require('../loaders')

const mockNotify = jest.fn()

describe('user send password reset email', () => {
  const originalInfo = console.info
  afterEach(() => (console.info = originalInfo))

  let query, drop, truncate, migrate, collections, schema, request, i18n

  beforeAll(async () => {
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    request = {
      protocol: 'https',
      get: (text) => text,
    }
  })

  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    await truncate()
  })

  afterEach(() => {
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })

  describe('successfully sends password reset email', () => {
    describe('users preferred language is french', () => {
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
      describe('successful password reset email send', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'french',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns status text', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                sendPasswordResetLink(
                  input: { userName: "test.account@istio.actually.exists" }
                ) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
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
              notify: {
                sendPasswordResetEmail: mockNotify,
              },
            },
          )

          const expectedResult = {
            data: {
              sendPasswordResetLink: {
                status: 'todo',
              },
            },
          }

          const cursor = await query`
              FOR user IN users
                  FILTER user.userName == "test.account@istio.actually.exists"
                  RETURN user
            `
          const user = await cursor.next()

          const token = tokenize({
            parameters: { userId: user._key, currentPassword: user.password },
          })
          const resetUrl = `${request.protocol}://${request.get(
            'host',
          )}/reset-password/${token}`

          expect(response).toEqual(expectedResult)
          expect(mockNotify).toHaveBeenCalledWith({
            templateId: '11aef4a3-b1a3-42b9-8246-7a0aa2bfe805',
            user,
            resetUrl,
          })
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully sent a password reset email.`,
          ])
        })
      })
      describe('unsuccessful password reset email send', () => {
        describe('no user associated with account', () => {
          it('returns status text', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  sendPasswordResetLink(
                    input: {
                      userName: "test.account@istio.does.not.actually.exists"
                    }
                  ) {
                    status
                  }
                }
              `,
              null,
              {
                i18n,
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
                notify: {
                  sendPasswordResetEmail: mockNotify,
                },
              },
            )

            const expectedResult = {
              data: {
                sendPasswordResetLink: {
                  status: 'todo',
                },
              },
            }

            expect(response).toEqual(expectedResult)
            expect(consoleOutput).toEqual([
              `A user attempted to send a password reset email for test.account@istio.does.not.actually.exists but no account is affiliated with this user name.`,
            ])
          })
        })
      })
    })
    describe('users preferred language is english', () => {
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
      describe('successful password reset email', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'english',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns status text', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                sendPasswordResetLink(
                  input: { userName: "test.account@istio.actually.exists" }
                ) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
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
              notify: {
                sendPasswordResetEmail: mockNotify,
              },
            },
          )

          const expectedResult = {
            data: {
              sendPasswordResetLink: {
                status:
                  'If an account with this username is found, a password reset link will be found in your inbox.',
              },
            },
          }

          const cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
          `
          const user = await cursor.next()

          const token = tokenize({
            parameters: { userId: user._key, currentPassword: user.password },
          })
          const resetUrl = `${request.protocol}://${request.get(
            'host',
          )}/reset-password/${token}`

          expect(response).toEqual(expectedResult)
          expect(mockNotify).toHaveBeenCalledWith({
            templateId: '8c3d96cc-3cbe-4043-b157-4f4a2bbb57b1',
            user,
            resetUrl,
          })
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully sent a password reset email.`,
          ])
        })
      })
      describe('unsuccessful password reset email send', () => {
        describe('no user associated with account', () => {
          it('returns status text', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  sendPasswordResetLink(
                    input: {
                      userName: "test.account@istio.does.not.actually.exists"
                    }
                  ) {
                    status
                  }
                }
              `,
              null,
              {
                i18n,
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
                notify: {
                  sendPasswordResetEmail: mockNotify,
                },
              },
            )

            const expectedResult = {
              data: {
                sendPasswordResetLink: {
                  status:
                    'If an account with this username is found, a password reset link will be found in your inbox.',
                },
              },
            }

            expect(response).toEqual(expectedResult)
            expect(consoleOutput).toEqual([
              `A user attempted to send a password reset email for test.account@istio.does.not.actually.exists but no account is affiliated with this user name.`,
            ])
          })
        })
      })
    })
  })
})
