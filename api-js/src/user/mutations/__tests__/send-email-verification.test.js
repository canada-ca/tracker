import { ensure, dbNameFromFile } from 'arango-tools'
import bcrypt from 'bcryptjs'
import { graphql, GraphQLSchema } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { tokenize } from '../../../auth'
import { loadUserByUserName } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env
const mockNotify = jest.fn()

describe('user send password reset email', () => {
  const originalInfo = console.info
  afterEach(() => (console.info = originalInfo))

  let query, drop, truncate, collections, schema, request, i18n

  beforeAll(async () => {
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
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
    consoleOutput = []
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('successfully sends verification email', () => {
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
              loadUserByUserName: loadUserByUserName({ query }),
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
                "Si un compte avec ce nom d'utilisateur est trouvé, un lien de vérification par e-mail sera trouvé dans votre boîte de réception.",
            },
          },
        }

        const user = await loadUserByUserName({
          query,
          userKey: '1',
          i18n: {},
        }).load('test.account@istio.actually.exists')

        const token = tokenize({
          parameters: { userKey: user._key },
        })
        const verifyUrl = `${request.protocol}://${request.get(
          'host',
        )}/validate/${token}`

        expect(response).toEqual(expectedResult)
        expect(mockNotify).toHaveBeenCalledWith({
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
                  loadUserByUserName: loadUserByUserName({ query }),
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
                    "Si un compte avec ce nom d'utilisateur est trouvé, un lien de vérification par e-mail sera trouvé dans votre boîte de réception.",
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
              loadUserByUserName: loadUserByUserName({ query }),
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

        const user = await loadUserByUserName({
          query,
          userKey: '1',
          i18n: {},
        }).load('test.account@istio.actually.exists')

        const token = tokenize({
          parameters: { userKey: user._key },
        })
        const verifyUrl = `${request.protocol}://${request.get(
          'host',
        )}/validate/${token}`

        expect(response).toEqual(expectedResult)
        expect(mockNotify).toHaveBeenCalledWith({
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
                  loadUserByUserName: loadUserByUserName({ query }),
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
