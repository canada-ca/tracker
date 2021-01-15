import { ArangoTools, dbNameFromFile } from 'arango-tools'
import bcrypt from 'bcrypt'
import { graphql, GraphQLSchema } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { tokenize } from '../../../auth'
import { userLoaderByUserName } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env
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

  describe('successfully sends verification email', () => {
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
              sendEmailVerification(
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
              sendVerificationEmail: mockNotify,
            },
          },
        )

        const expectedResult = {
          data: {
            sendEmailVerification: {
              status: 'todo',
            },
          },
        }

        const cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN MERGE({ id: user._key }, user)
          `
        const user = await cursor.next()

        const token = tokenize({
          parameters: { userKey: user._key },
        })
        const verifyUrl = `${request.protocol}://${request.get(
          'host',
        )}/validate/${token}`

        expect(response).toEqual(expectedResult)
        expect(mockNotify).toHaveBeenCalledWith({
          templateId: 'f2c9b64a-c754-4ffd-93e9-33fdb0b5ae0b',
          user,
          verifyUrl,
        })
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully sent a verification email.`,
        ])
      })
      describe('unsuccessful verification email send', () => {
        describe('no user associated with account', () => {
          it('returns status text', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  sendEmailVerification(
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
                  sendVerificationEmail: mockNotify,
                },
              },
            )

            const expectedResult = {
              data: {
                sendEmailVerification: {
                  status: 'todo',
                },
              },
            }

            expect(response).toEqual(expectedResult)
            expect(consoleOutput).toEqual([
              `A user attempted to send a verification email for test.account@istio.does.not.actually.exists but no account is affiliated with this user name.`,
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
              sendEmailVerification(
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
              sendVerificationEmail: mockNotify,
            },
          },
        )

        const expectedResult = {
          data: {
            sendEmailVerification: {
              status:
                'If an account with this username is found, an email verification link will be found in your inbox.',
            },
          },
        }

        const cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN MERGE({ id: user._key }, user)
          `
        const user = await cursor.next()

        const token = tokenize({
          parameters: { userKey: user._key },
        })
        const verifyUrl = `${request.protocol}://${request.get(
          'host',
        )}/validate/${token}`

        expect(response).toEqual(expectedResult)
        expect(mockNotify).toHaveBeenCalledWith({
          templateId: '6e3368a7-0d75-47b1-b4b2-878234e554c9',
          user,
          verifyUrl,
        })
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully sent a verification email.`,
        ])
      })
      describe('unsuccessful verification email send', () => {
        describe('no user associated with account', () => {
          it('returns status text', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  sendEmailVerification(
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
                  sendVerificationEmail: mockNotify,
                },
              },
            )

            const expectedResult = {
              data: {
                sendEmailVerification: {
                  status:
                    'If an account with this username is found, an email verification link will be found in your inbox.',
                },
              },
            }

            expect(response).toEqual(expectedResult)
            expect(consoleOutput).toEqual([
              `A user attempted to send a verification email for test.account@istio.does.not.actually.exists but no account is affiliated with this user name.`,
            ])
          })
        })
      })
    })
  })
})
