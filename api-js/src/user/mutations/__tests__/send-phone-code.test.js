import { ArangoTools, dbNameFromFile } from 'arango-tools'
import bcrypt from 'bcryptjs'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { tokenize } from '../../../auth'
import { userLoaderByKey, userLoaderByUserName } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env
const mockNotify = jest.fn()

describe('user send password reset email', () => {
  const originalInfo = console.info
  afterEach(() => (console.info = originalInfo))

  let query, drop, truncate, migrate, collections, schema, request, i18n

  beforeAll(async () => {
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

  afterEach(async () => {
    consoleOutput = []
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
    describe('successfully send a phone code', () => {
      beforeEach(async () => {
        await truncate()
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'french',
          tfaValidated: false,
          emailValidated: false,
        })
      })
      it('returns status text', async () => {
        const cursor = await query`
          FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
        `
        let user = await cursor.next()

        const response = await graphql(
          schema,
          `
            mutation {
              sendPhoneCode(input: { phoneNumber: "+12345678901" }) {
                status
              }
            }
          `,
          null,
          {
            i18n,
            request,
            userKey: user._key,
            query,
            auth: {
              bcrypt,
              tokenize,
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              userLoaderByKey: userLoaderByKey(query),
            },
            notify: {
              sendTfaTextMsg: mockNotify,
            },
          },
        )

        const expectedResult = {
          data: {
            sendPhoneCode: {
              status:
                'Two factor code has been successfully sent, you will receive a text message shortly.',
            },
          },
        }

        user = await userLoaderByUserName(query, '1', {}).load('test.account@istio.actually.exists')

        expect(response).toEqual(expectedResult)
        expect(mockNotify).toHaveBeenCalledWith({
          templateId: 'de8433ce-4a0b-48b8-a99f-4fe085127af5',
          phoneNumber: '+12345678901',
          user,
        })
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully sent tfa code.`,
        ])
      })
    })
    describe('unsuccessful phone code sending', () => {
      describe('no user associated with account', () => {
        it('returns status text', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                sendPhoneCode(input: { phoneNumber: "+12345678901" }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              request,
              userKey: 1,
              query,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
              notify: {
                sendTfaTextMsg: mockNotify,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to send TFA code, please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User attempted to send TFA text message, however no account is associated with this key: 1.`,
          ])
        })
      })
      describe('userKey is undefined', () => {
        it('error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                sendPhoneCode(input: { phoneNumber: "+12345678901" }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              request,
              userKey: undefined,
              query,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
              notify: {
                sendTfaTextMsg: mockNotify,
              },
            },
          )

          const error = [
            new GraphQLError('Authentication error, please sign in again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User attempted to send TFA text message, however the userKey does not exist.`,
          ])
        })
      })
      describe('database error occurs on tfa code insert', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'english',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN MERGE({ id: user._key }, user)
          `
          const user = await cursor.next()
          const loaderById = userLoaderByKey(query)

          query = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
              mutation {
                sendPhoneCode(input: { phoneNumber: "+12345678901" }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              request,
              userKey: user._key,
              query,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: loaderById,
              },
              notify: {
                sendTfaTextMsg: mockNotify,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to send TFA code, please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when inserting ${user._key} TFA code: Error: Database error occurred.`,
          ])
        })
      })
      describe('database error occurs on phone number insert', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'english',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN MERGE({ id: user._key }, user)
          `
          const user = await cursor.next()
          const loaderById = userLoaderByKey(query)

          query = jest
            .fn()
            .mockResolvedValueOnce(query)
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
              mutation {
                sendPhoneCode(input: { phoneNumber: "+12345678901" }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              request,
              userKey: user._key,
              query,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: loaderById,
              },
              notify: {
                sendTfaTextMsg: mockNotify,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to send TFA code, please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when inserting ${user._key} phone number: Error: Database error occurred.`,
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
    describe('successfully send a phone code', () => {
      beforeEach(async () => {
        await truncate()
        await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'english',
          tfaValidated: false,
          emailValidated: false,
        })
      })
      it('returns status text', async () => {
        const cursor = await query`
          FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN MERGE({ id: user._key }, user)
        `
        let user = await cursor.next()
        const response = await graphql(
          schema,
          `
            mutation {
              sendPhoneCode(input: { phoneNumber: "+12345678901" }) {
                status
              }
            }
          `,
          null,
          {
            i18n,
            request,
            userKey: user._key,
            query,
            auth: {
              bcrypt,
              tokenize,
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              userLoaderByKey: userLoaderByKey(query),
            },
            notify: {
              sendTfaTextMsg: mockNotify,
            },
          },
        )

        const expectedResult = {
          data: {
            sendPhoneCode: {
              status: 'todo',
            },
          },
        }

        user = await userLoaderByUserName(query, '1', {}).load('test.account@istio.actually.exists')

        expect(response).toEqual(expectedResult)
        expect(mockNotify).toHaveBeenCalledWith({
          templateId: 'd6846e21-cae7-46e9-9e36-8a3f735c90ee',
          phoneNumber: '+12345678901',
          user,
        })
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully sent tfa code.`,
        ])
      })
    })
    describe('unsuccessful phone code sending', () => {
      describe('no user associated with account', () => {
        it('returns status text', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                sendPhoneCode(input: { phoneNumber: "+12345678901" }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              request,
              userKey: 1,
              query,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
              notify: {
                sendTfaTextMsg: mockNotify,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User attempted to send TFA text message, however no account is associated with this key: 1.`,
          ])
        })
      })
      describe('userKey is undefined', () => {
        it('error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                sendPhoneCode(input: { phoneNumber: "+12345678901" }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              request,
              userKey: undefined,
              query,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
              notify: {
                sendTfaTextMsg: mockNotify,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User attempted to send TFA text message, however the userKey does not exist.`,
          ])
        })
      })
      describe('database error occurs on tfa code insert', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'english',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN MERGE({ id: user._key }, user)
          `
          const user = await cursor.next()
          const loaderById = userLoaderByKey(query)

          query = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
              mutation {
                sendPhoneCode(input: { phoneNumber: "+12345678901" }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              request,
              userKey: user._key,
              query,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: loaderById,
              },
              notify: {
                sendTfaTextMsg: mockNotify,
              },
            },
          )
          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when inserting ${user._key} TFA code: Error: Database error occurred.`,
          ])
        })
      })
      describe('database error occurs on phone number insert', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'english',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN MERGE({ id: user._key }, user)
          `
          const user = await cursor.next()
          const loaderById = userLoaderByKey(query)

          query = jest
            .fn()
            .mockResolvedValueOnce(query)
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
              mutation {
                sendPhoneCode(input: { phoneNumber: "+12345678901" }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              request,
              userKey: user._key,
              query,
              auth: {
                bcrypt,
                tokenize,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                userLoaderByKey: loaderById,
              },
              notify: {
                sendTfaTextMsg: mockNotify,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when inserting ${user._key} phone number: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
