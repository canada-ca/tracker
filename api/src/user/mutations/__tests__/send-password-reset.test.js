import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import bcrypt from 'bcryptjs'
import { graphql, GraphQLSchema } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { loadUserByUserName } from '../../loaders'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env
const mockNotify = jest.fn()
const tokenize = jest.fn().mockReturnValue('token')

describe('user send password reset email', () => {
  let query, drop, truncate, collections, schema, request, i18n
  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)

  beforeAll(() => {
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    request = {
      protocol: 'https',
      get: (text) => text,
    }
    console.info = mockedInfo
    console.warn = mockedWarn
  })

  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('successfully sends password reset email', () => {
    beforeAll(async () => {
      ;({ query, drop, truncate, collections } = await ensure({
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
    describe('users preferred language is english', () => {
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
      describe('successful password reset email', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns status text', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                sendPasswordResetLink(
                  input: { userName: "test.account@istio.actually.exists" }
                ) {
                  status
                }
              }
            `,
            rootValue: null,
            contextValue: {
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
                loadUserByUserName: loadUserByUserName({ query }),
              },
              notify: {
                sendPasswordResetEmail: mockNotify,
              },
            },
          })

          const expectedResult = {
            data: {
              sendPasswordResetLink: {
                status: 'If an account with this username is found, a password reset link will be found in your inbox.',
              },
            },
          }

          const user = await loadUserByUserName({
            query,
            userKey: '1',
            i18n: {},
          }).load('test.account@istio.actually.exists')

          const token = tokenize({
            parameters: { userKey: user._key, currentPassword: user.password },
          })
          const resetUrl = `https://${request.get('host')}/reset-password/${token}`

          expect(response).toEqual(expectedResult)
          expect(mockNotify).toHaveBeenCalledWith({
            user,
            resetUrl,
          })
          expect(consoleOutput).toEqual([`User: ${user._key} successfully sent a password reset email.`])
        })
      })
    })
    describe('users preferred language is french', () => {
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
      beforeEach(async () => {
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          tfaValidated: false,
          emailValidated: false,
        })
      })
      it('returns status text', async () => {
        const response = await graphql({
          schema,
          source: `
            mutation {
              sendPasswordResetLink(
                input: { userName: "test.account@istio.actually.exists" }
              ) {
                status
              }
            }
          `,
          rootValue: null,
          contextValue: {
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
              loadUserByUserName: loadUserByUserName({ query }),
            },
            notify: {
              sendPasswordResetEmail: mockNotify,
            },
          },
        })

        const expectedResult = {
          data: {
            sendPasswordResetLink: {
              status:
                "Si un compte avec ce nom d'utilisateur est trouvé, un lien de réinitialisation du mot de passe se trouvera dans votre boîte de réception.",
            },
          },
        }

        const user = await loadUserByUserName({
          query,
          userKey: '1',
          i18n: {},
        }).load('test.account@istio.actually.exists')

        const token = tokenize({
          parameters: { userKey: user._key, currentPassword: user.password },
        })
        const resetUrl = `https://${request.get('host')}/reset-password/${token}`

        expect(response).toEqual(expectedResult)
        expect(mockNotify).toHaveBeenCalledWith({
          user,
          resetUrl,
        })
        expect(consoleOutput).toEqual([`User: ${user._key} successfully sent a password reset email.`])
      })
    })
  })
  describe('unsuccessfully sends password reset email', () => {
    describe('language is set to english', () => {
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
      it('returns status text', async () => {
        const response = await graphql({
          schema,
          source: `
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
          rootValue: null,
          contextValue: {
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
              loadUserByUserName: {
                load: jest.fn().mockReturnValue(undefined),
              },
            },
            notify: {
              sendPasswordResetEmail: mockNotify,
            },
          },
        })

        const expectedResult = {
          data: {
            sendPasswordResetLink: {
              status: 'If an account with this username is found, a password reset link will be found in your inbox.',
            },
          },
        }

        expect(response).toEqual(expectedResult)
        expect(consoleOutput).toEqual([
          `A user attempted to send a password reset email for test.account@istio.does.not.actually.exists but no account is affiliated with this user name.`,
        ])
      })
    })
    describe('language is set to french', () => {
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
      describe('no user associated with account', () => {
        it('returns status text', async () => {
          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
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
                loadUserByUserName: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
              notify: {
                sendPasswordResetEmail: mockNotify,
              },
            },
          })

          const expectedResult = {
            data: {
              sendPasswordResetLink: {
                status:
                  "Si un compte avec ce nom d'utilisateur est trouvé, un lien de réinitialisation du mot de passe se trouvera dans votre boîte de réception.",
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
