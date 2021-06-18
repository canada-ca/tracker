import { ensure, dbNameFromFile } from 'arango-tools'
import bcrypt from 'bcryptjs'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput, decryptPhoneNumber } from '../../../validators'
import { tokenize, userRequired } from '../../../auth'
import { loadUserByUserName, loadUserByKey } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env
const mockNotify = jest.fn()

describe('user sets a new phone number', () => {
  const originalInfo = console.info
  afterEach(() => (console.info = originalInfo))

  let query, drop, truncate, collections, schema, request, i18n

  beforeAll(async () => {
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    request = {
      protocol: 'https',
      get: (text) => text,
    }
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    consoleOutput.length = 0
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
    describe('successfully set a phone number', () => {
      let user
      describe('user is setting number for first time', () => {
        beforeEach(async () => {
          user = await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'french',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns status text and updated user', async () => {
          const newPhoneNumber = '+12345678901'
          const response = await graphql(
            schema,
            `
              mutation {
                setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                  result {
                    ... on SetPhoneNumberResult {
                      status
                      user {
                        phoneNumber
                      }
                    }
                    ... on SetPhoneNumberError {
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
              request,
              userKey: user._key,
              query,
              auth: {
                bcrypt,
                tokenize,
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
              },
              validators: {
                cleanseInput,
                decryptPhoneNumber,
              },
              loaders: {
                loadUserByKey: loadUserByKey({ query }),
              },
              notify: {
                sendTfaTextMsg: mockNotify,
              },
            },
          )

          const expectedResult = {
            data: {
              setPhoneNumber: {
                result: {
                  status:
                    'Phone number has been successfully set, you will receive a verification text message shortly.',
                  user: {
                    phoneNumber: newPhoneNumber,
                  },
                },
              },
            },
          }

          user = await loadUserByUserName({
            query,
            userKey: '1',
            i18n: {},
          }).load('test.account@istio.actually.exists')

          expect(response).toEqual(expectedResult)
          expect(mockNotify).toHaveBeenCalledWith({
            phoneNumber: newPhoneNumber,
            user,
          })
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully set phone number.`,
          ])
          expect(decryptPhoneNumber(user.phoneDetails)).toEqual(newPhoneNumber)
        })
      })
      describe('user is phone validated', () => {
        describe('tfaSendMethod: None', () => {
          beforeEach(async () => {
            user = await collections.users.save({
              userName: 'test.account@istio.actually.exists',
              displayName: 'Test Account',
              preferredLang: 'french',
              phoneDetails: {},
              phoneValidated: true,
              tfaValidated: false,
              emailValidated: false,
              tfaSendMethod: 'none',
            })
          })
          it('returns status text and updated user', async () => {
            const newPhoneNumber = '+12345678901'
            const response = await graphql(
              schema,
              `
                mutation {
                  setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                    result {
                      ... on SetPhoneNumberResult {
                        status
                        user {
                          phoneNumber
                        }
                      }
                      ... on SetPhoneNumberError {
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
                request,
                userKey: user._key,
                query,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: {
                  sendTfaTextMsg: mockNotify,
                },
              },
            )

            const expectedResult = {
              data: {
                setPhoneNumber: {
                  result: {
                    status:
                      'Phone number has been successfully set, you will receive a verification text message shortly.',
                    user: {
                      phoneNumber: newPhoneNumber,
                    },
                  },
                },
              },
            }

            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')

            expect(response).toEqual(expectedResult)
            expect(mockNotify).toHaveBeenCalledWith({
              phoneNumber: newPhoneNumber,
              user,
            })
            expect(consoleOutput).toEqual([
              `User: ${user._key} successfully set phone number.`,
            ])
            expect(decryptPhoneNumber(user.phoneDetails)).toEqual(
              newPhoneNumber,
            )
          })
          it('tfaSendMethod stays as none', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql(
              schema,
              `
                mutation {
                  setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                    result {
                      ... on SetPhoneNumberResult {
                        status
                        user {
                          phoneNumber
                        }
                      }
                      ... on SetPhoneNumberError {
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
                request,
                userKey: user._key,
                query,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: {
                  sendTfaTextMsg: mockNotify,
                },
              },
            )
            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')
            expect(user.tfaSendMethod).toEqual('none')
          })
          it('sets phoneValidated to false', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql(
              schema,
              `
                mutation {
                  setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                    result {
                      ... on SetPhoneNumberResult {
                        status
                        user {
                          phoneNumber
                        }
                      }
                      ... on SetPhoneNumberError {
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
                request,
                userKey: user._key,
                query,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: {
                  sendTfaTextMsg: mockNotify,
                },
              },
            )
            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')
            expect(user.phoneValidated).toEqual(false)
          })
        })
        describe('tfaSendMethod: Email', () => {
          beforeEach(async () => {
            user = await collections.users.save({
              userName: 'test.account@istio.actually.exists',
              displayName: 'Test Account',
              preferredLang: 'french',
              phoneDetails: {},
              phoneValidated: true,
              tfaValidated: false,
              emailValidated: true,
              tfaSendMethod: 'email',
            })
          })
          it('returns status text and update user', async () => {
            const newPhoneNumber = '+12345678901'
            const response = await graphql(
              schema,
              `
                mutation {
                  setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                    result {
                      ... on SetPhoneNumberResult {
                        status
                        user {
                          phoneNumber
                        }
                      }
                      ... on SetPhoneNumberError {
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
                request,
                userKey: user._key,
                query,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: {
                  sendTfaTextMsg: mockNotify,
                },
              },
            )

            const expectedResult = {
              data: {
                setPhoneNumber: {
                  result: {
                    status:
                      'Phone number has been successfully set, you will receive a verification text message shortly.',
                    user: {
                      phoneNumber: newPhoneNumber,
                    },
                  },
                },
              },
            }

            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')

            expect(response).toEqual(expectedResult)
            expect(mockNotify).toHaveBeenCalledWith({
              phoneNumber: newPhoneNumber,
              user,
            })
            expect(consoleOutput).toEqual([
              `User: ${user._key} successfully set phone number.`,
            ])
            expect(decryptPhoneNumber(user.phoneDetails)).toEqual(
              newPhoneNumber,
            )
          })
          it('tfaSendMethod stays as email', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql(
              schema,
              `
                mutation {
                  setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                    result {
                      ... on SetPhoneNumberResult {
                        status
                        user {
                          phoneNumber
                        }
                      }
                      ... on SetPhoneNumberError {
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
                request,
                userKey: user._key,
                query,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: {
                  sendTfaTextMsg: mockNotify,
                },
              },
            )
            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')
            expect(user.tfaSendMethod).toEqual('email')
          })
          it('sets phoneValidated to false', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql(
              schema,
              `
                mutation {
                  setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                    result {
                      ... on SetPhoneNumberResult {
                        status
                        user {
                          phoneNumber
                        }
                      }
                      ... on SetPhoneNumberError {
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
                request,
                userKey: user._key,
                query,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: {
                  sendTfaTextMsg: mockNotify,
                },
              },
            )
            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')
            expect(user.phoneValidated).toEqual(false)
          })
        })
        describe('tfaSendMethod: Phone', () => {
          beforeEach(async () => {
            user = await collections.users.save({
              userName: 'test.account@istio.actually.exists',
              displayName: 'Test Account',
              preferredLang: 'french',
              phoneDetails: {},
              phoneValidated: true,
              tfaValidated: false,
              emailValidated: true,
              tfaSendMethod: 'email',
            })
          })
          it('returns status text and updated user', async () => {
            const newPhoneNumber = '+12345678901'
            const response = await graphql(
              schema,
              `
                mutation {
                  setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                    result {
                      ... on SetPhoneNumberResult {
                        status
                        user {
                          phoneNumber
                        }
                      }
                      ... on SetPhoneNumberError {
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
                request,
                userKey: user._key,
                query,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: {
                  sendTfaTextMsg: mockNotify,
                },
              },
            )

            const expectedResult = {
              data: {
                setPhoneNumber: {
                  result: {
                    status:
                      'Phone number has been successfully set, you will receive a verification text message shortly.',
                    user: {
                      phoneNumber: newPhoneNumber,
                    },
                  },
                },
              },
            }

            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')

            expect(response).toEqual(expectedResult)
            expect(mockNotify).toHaveBeenCalledWith({
              phoneNumber: newPhoneNumber,
              user,
            })
            expect(consoleOutput).toEqual([
              `User: ${user._key} successfully set phone number.`,
            ])
            expect(decryptPhoneNumber(user.phoneDetails)).toEqual(
              newPhoneNumber,
            )
          })
          it('sets tfaSendMethod to email', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql(
              schema,
              `
                mutation {
                  setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                    result {
                      ... on SetPhoneNumberResult {
                        status
                        user {
                          phoneNumber
                        }
                      }
                      ... on SetPhoneNumberError {
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
                request,
                userKey: user._key,
                query,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: {
                  sendTfaTextMsg: mockNotify,
                },
              },
            )
            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')
            expect(user.tfaSendMethod).toEqual('email')
          })
          it('sets phoneValidated to false', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql(
              schema,
              `
                mutation {
                  setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                    result {
                      ... on SetPhoneNumberResult {
                        status
                        user {
                          phoneNumber
                        }
                      }
                      ... on SetPhoneNumberError {
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
                request,
                userKey: user._key,
                query,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: {
                  sendTfaTextMsg: mockNotify,
                },
              },
            )
            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')
            expect(user.phoneValidated).toEqual(false)
          })
        })
      })
    })
    describe('unsuccessful setting of phone number', () => {
      let user
      beforeEach(async () => {
        user = await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'english',
          tfaValidated: false,
          emailValidated: false,
        })
      })
      describe('database error occurs on upsert', () => {
        it('returns an error message', async () => {
          const loaderById = loadUserByKey({ query })

          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const newPhoneNumber = '+12345678901'

          const response = await graphql(
            schema,
            `
              mutation {
                setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                  result {
                    ... on SetPhoneNumberResult {
                      status
                      user {
                        phoneNumber
                      }
                    }
                    ... on SetPhoneNumberError {
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
              request,
              userKey: user._key,
              query: mockedQuery,
              auth: {
                bcrypt,
                tokenize,
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
              },
              validators: {
                cleanseInput,
                decryptPhoneNumber,
              },
              loaders: {
                loadUserByKey: loaderById,
              },
              notify: {
                sendTfaTextMsg: mockNotify,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to set phone number, please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred for user: ${user._key} when upserting phone number information: Error: Database error occurred.`,
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
    describe('successfully set a phone number', () => {
      let user
      describe('user is setting number for first time', () => {
        beforeEach(async () => {
          user = await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            preferredLang: 'french',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns status text and updated user', async () => {
          const newPhoneNumber = '+12345678901'
          const response = await graphql(
            schema,
            `
              mutation {
                setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                  result {
                    ... on SetPhoneNumberResult {
                      status
                      user {
                        phoneNumber
                      }
                    }
                    ... on SetPhoneNumberError {
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
              request,
              userKey: user._key,
              query,
              auth: {
                bcrypt,
                tokenize,
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
              },
              validators: {
                cleanseInput,
                decryptPhoneNumber,
              },
              loaders: {
                loadUserByKey: loadUserByKey({ query }),
              },
              notify: {
                sendTfaTextMsg: mockNotify,
              },
            },
          )

          const expectedResult = {
            data: {
              setPhoneNumber: {
                result: {
                  status:
                    'Le numéro de téléphone a été configuré avec succès, vous recevrez bientôt un message de vérification.',
                  user: {
                    phoneNumber: newPhoneNumber,
                  },
                },
              },
            },
          }

          user = await loadUserByUserName({
            query,
            userKey: '1',
            i18n: {},
          }).load('test.account@istio.actually.exists')

          expect(response).toEqual(expectedResult)
          expect(mockNotify).toHaveBeenCalledWith({
            phoneNumber: newPhoneNumber,
            user,
          })
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully set phone number.`,
          ])
          expect(decryptPhoneNumber(user.phoneDetails)).toEqual(newPhoneNumber)
        })
      })
      describe('user is phone validated', () => {
        describe('tfaSendMethod: None', () => {
          beforeEach(async () => {
            user = await collections.users.save({
              userName: 'test.account@istio.actually.exists',
              displayName: 'Test Account',
              preferredLang: 'french',
              phoneDetails: {},
              phoneValidated: true,
              tfaValidated: false,
              emailValidated: false,
              tfaSendMethod: 'none',
            })
          })
          it('returns status text and updated user', async () => {
            const newPhoneNumber = '+12345678901'
            const response = await graphql(
              schema,
              `
                mutation {
                  setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                    result {
                      ... on SetPhoneNumberResult {
                        status
                        user {
                          phoneNumber
                        }
                      }
                      ... on SetPhoneNumberError {
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
                request,
                userKey: user._key,
                query,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: {
                  sendTfaTextMsg: mockNotify,
                },
              },
            )

            const expectedResult = {
              data: {
                setPhoneNumber: {
                  result: {
                    status:
                      'Le numéro de téléphone a été configuré avec succès, vous recevrez bientôt un message de vérification.',
                    user: {
                      phoneNumber: newPhoneNumber,
                    },
                  },
                },
              },
            }

            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')

            expect(response).toEqual(expectedResult)
            expect(mockNotify).toHaveBeenCalledWith({
              phoneNumber: newPhoneNumber,
              user,
            })
            expect(consoleOutput).toEqual([
              `User: ${user._key} successfully set phone number.`,
            ])
            expect(decryptPhoneNumber(user.phoneDetails)).toEqual(
              newPhoneNumber,
            )
          })
          it('tfaSendMethod stays as none', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql(
              schema,
              `
                mutation {
                  setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                    result {
                      ... on SetPhoneNumberResult {
                        status
                        user {
                          phoneNumber
                        }
                      }
                      ... on SetPhoneNumberError {
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
                request,
                userKey: user._key,
                query,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: {
                  sendTfaTextMsg: mockNotify,
                },
              },
            )
            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')
            expect(user.tfaSendMethod).toEqual('none')
          })
          it('sets phoneValidated to false', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql(
              schema,
              `
                mutation {
                  setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                    result {
                      ... on SetPhoneNumberResult {
                        status
                        user {
                          phoneNumber
                        }
                      }
                      ... on SetPhoneNumberError {
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
                request,
                userKey: user._key,
                query,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: {
                  sendTfaTextMsg: mockNotify,
                },
              },
            )
            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')
            expect(user.phoneValidated).toEqual(false)
          })
        })
        describe('tfaSendMethod: Email', () => {
          beforeEach(async () => {
            user = await collections.users.save({
              userName: 'test.account@istio.actually.exists',
              displayName: 'Test Account',
              preferredLang: 'french',
              phoneDetails: {},
              phoneValidated: true,
              tfaValidated: false,
              emailValidated: true,
              tfaSendMethod: 'email',
            })
          })
          it('returns status text', async () => {
            const newPhoneNumber = '+12345678901'
            const response = await graphql(
              schema,
              `
                mutation {
                  setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                    result {
                      ... on SetPhoneNumberResult {
                        status
                        user {
                          phoneNumber
                        }
                      }
                      ... on SetPhoneNumberError {
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
                request,
                userKey: user._key,
                query,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: {
                  sendTfaTextMsg: mockNotify,
                },
              },
            )

            const expectedResult = {
              data: {
                setPhoneNumber: {
                  result: {
                    status:
                      'Le numéro de téléphone a été configuré avec succès, vous recevrez bientôt un message de vérification.',
                    user: {
                      phoneNumber: newPhoneNumber,
                    },
                  },
                },
              },
            }

            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')

            expect(response).toEqual(expectedResult)
            expect(mockNotify).toHaveBeenCalledWith({
              phoneNumber: newPhoneNumber,
              user,
            })
            expect(consoleOutput).toEqual([
              `User: ${user._key} successfully set phone number.`,
            ])
            expect(decryptPhoneNumber(user.phoneDetails)).toEqual(
              newPhoneNumber,
            )
          })
          it('tfaSendMethod stays as email', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql(
              schema,
              `
                mutation {
                  setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                    result {
                      ... on SetPhoneNumberResult {
                        status
                        user {
                          phoneNumber
                        }
                      }
                      ... on SetPhoneNumberError {
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
                request,
                userKey: user._key,
                query,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: {
                  sendTfaTextMsg: mockNotify,
                },
              },
            )
            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')
            expect(user.tfaSendMethod).toEqual('email')
          })
          it('sets phoneValidated to false', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql(
              schema,
              `
                mutation {
                  setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                    result {
                      ... on SetPhoneNumberResult {
                        status
                        user {
                          phoneNumber
                        }
                      }
                      ... on SetPhoneNumberError {
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
                request,
                userKey: user._key,
                query,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: {
                  sendTfaTextMsg: mockNotify,
                },
              },
            )
            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')
            expect(user.phoneValidated).toEqual(false)
          })
        })
        describe('tfaSendMethod: Phone', () => {
          beforeEach(async () => {
            user = await collections.users.save({
              userName: 'test.account@istio.actually.exists',
              displayName: 'Test Account',
              preferredLang: 'french',
              phoneDetails: {},
              phoneValidated: true,
              tfaValidated: false,
              emailValidated: true,
              tfaSendMethod: 'email',
            })
          })
          it('returns status text', async () => {
            const newPhoneNumber = '+12345678901'
            const response = await graphql(
              schema,
              `
                mutation {
                  setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                    result {
                      ... on SetPhoneNumberResult {
                        status
                        user {
                          phoneNumber
                        }
                      }
                      ... on SetPhoneNumberError {
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
                request,
                userKey: user._key,
                query,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: {
                  sendTfaTextMsg: mockNotify,
                },
              },
            )

            const expectedResult = {
              data: {
                setPhoneNumber: {
                  result: {
                    status:
                      'Le numéro de téléphone a été configuré avec succès, vous recevrez bientôt un message de vérification.',
                    user: {
                      phoneNumber: newPhoneNumber,
                    },
                  },
                },
              },
            }

            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')

            expect(response).toEqual(expectedResult)
            expect(mockNotify).toHaveBeenCalledWith({
              phoneNumber: newPhoneNumber,
              user,
            })
            expect(consoleOutput).toEqual([
              `User: ${user._key} successfully set phone number.`,
            ])
            expect(decryptPhoneNumber(user.phoneDetails)).toEqual(
              newPhoneNumber,
            )
          })
          it('sets tfaSendMethod to email', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql(
              schema,
              `
                mutation {
                  setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                    result {
                      ... on SetPhoneNumberResult {
                        status
                        user {
                          phoneNumber
                        }
                      }
                      ... on SetPhoneNumberError {
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
                request,
                userKey: user._key,
                query,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: {
                  sendTfaTextMsg: mockNotify,
                },
              },
            )
            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')
            expect(user.tfaSendMethod).toEqual('email')
          })
          it('sets phoneValidated to false', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql(
              schema,
              `
                mutation {
                  setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                    result {
                      ... on SetPhoneNumberResult {
                        status
                        user {
                          phoneNumber
                        }
                      }
                      ... on SetPhoneNumberError {
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
                request,
                userKey: user._key,
                query,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: {
                  sendTfaTextMsg: mockNotify,
                },
              },
            )
            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')
            expect(user.phoneValidated).toEqual(false)
          })
        })
      })
    })
    describe('unsuccessful setting of phone number', () => {
      let user
      beforeEach(async () => {
        user = await collections.users.save({
          userName: 'test.account@istio.actually.exists',
          displayName: 'Test Account',
          preferredLang: 'english',
          tfaValidated: false,
          emailValidated: false,
        })
      })
      describe('database error occurs on upsert', () => {
        it('returns an error message', async () => {
          const loaderById = loadUserByKey({ query })

          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const newPhoneNumber = '+12345678901'

          const response = await graphql(
            schema,
            `
              mutation {
                setPhoneNumber(input: { phoneNumber: "${newPhoneNumber}" }) {
                  result {
                    ... on SetPhoneNumberResult {
                      status
                    }
                    ... on SetPhoneNumberError {
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
              request,
              userKey: user._key,
              query: mockedQuery,
              auth: {
                bcrypt,
                tokenize,
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByKey: loaderById,
              },
              notify: {
                sendTfaTextMsg: mockNotify,
              },
            },
          )
          const error = [
            new GraphQLError(
              'Impossible de définir le numéro de téléphone, veuillez réessayer.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred for user: ${user._key} when upserting phone number information: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
