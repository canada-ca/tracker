import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import bcrypt from 'bcryptjs'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput, decryptPhoneNumber } from '../../../validators'
import { tokenize, userRequired } from '../../../auth'
import { loadUserByUserName, loadUserByKey } from '../../loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url } = process.env
const mockNotify = jest.fn()

describe('user sets a new phone number', () => {
  let query, drop, truncate, collections, transaction, schema, request, i18n
  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    request = {
      protocol: 'https',
      get: (text) => text,
    }
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful phone number set', () => {
    let user
    beforeAll(async () => {
      ;({ query, drop, truncate, collections, transaction } = await ensure({
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
      describe('user is setting number for first time', () => {
        beforeEach(async () => {
          user = await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns status text and updated user', async () => {
          const newPhoneNumber = '+12345678901'
          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              request,
              userKey: user._key,
              query,
              collections: collectionNames,
              transaction,
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
                sendAuthTextMsg: mockNotify,
              },
            },
          })

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
            user,
          })
          expect(consoleOutput).toEqual([`User: ${user._key} successfully set phone number.`])
          expect(decryptPhoneNumber(user.phoneDetails)).toEqual(newPhoneNumber)
        })
      })
      describe('user is phone validated', () => {
        describe('tfaSendMethod: None', () => {
          beforeEach(async () => {
            user = await collections.users.save({
              userName: 'test.account@istio.actually.exists',
              displayName: 'Test Account',
              phoneDetails: {},
              phoneValidated: true,
              tfaValidated: false,
              emailValidated: false,
              tfaSendMethod: 'none',
            })
          })
          it('returns status text and updated user', async () => {
            const newPhoneNumber = '+12345678901'
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: user._key,
                query,
                collections: collectionNames,
                transaction,
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
                  sendAuthTextMsg: mockNotify,
                },
              },
            })

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
              user,
            })
            expect(consoleOutput).toEqual([`User: ${user._key} successfully set phone number.`])
            expect(decryptPhoneNumber(user.phoneDetails)).toEqual(newPhoneNumber)
          })
          it('tfaSendMethod stays as none', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: user._key,
                query,
                collections: collectionNames,
                transaction,
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
                  sendAuthTextMsg: mockNotify,
                },
              },
            })
            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')
            expect(user.tfaSendMethod).toEqual('none')
          })
          it('sets phoneValidated to false', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: user._key,
                query,
                collections: collectionNames,
                transaction,
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
                  sendAuthTextMsg: mockNotify,
                },
              },
            })
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
              phoneDetails: {},
              phoneValidated: true,
              tfaValidated: false,
              emailValidated: true,
              tfaSendMethod: 'email',
            })
          })
          it('returns status text and update user', async () => {
            const newPhoneNumber = '+12345678901'
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: user._key,
                query,
                collections: collectionNames,
                transaction,
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
                  sendAuthTextMsg: mockNotify,
                },
              },
            })

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
              user,
            })
            expect(consoleOutput).toEqual([`User: ${user._key} successfully set phone number.`])
            expect(decryptPhoneNumber(user.phoneDetails)).toEqual(newPhoneNumber)
          })
          it('tfaSendMethod stays as email', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: user._key,
                query,
                collections: collectionNames,
                transaction,
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
                  sendAuthTextMsg: mockNotify,
                },
              },
            })
            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')
            expect(user.tfaSendMethod).toEqual('email')
          })
          it('sets phoneValidated to false', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: user._key,
                query,
                collections: collectionNames,
                transaction,
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
                  sendAuthTextMsg: mockNotify,
                },
              },
            })
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
              phoneDetails: {},
              phoneValidated: true,
              tfaValidated: false,
              emailValidated: true,
              tfaSendMethod: 'email',
            })
          })
          it('returns status text and updated user', async () => {
            const newPhoneNumber = '+12345678901'
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: user._key,
                query,
                collections: collectionNames,
                transaction,
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
                  sendAuthTextMsg: mockNotify,
                },
              },
            })

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
              user,
            })
            expect(consoleOutput).toEqual([`User: ${user._key} successfully set phone number.`])
            expect(decryptPhoneNumber(user.phoneDetails)).toEqual(newPhoneNumber)
          })
          it('sets tfaSendMethod to email', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: user._key,
                query,
                collections: collectionNames,
                transaction,
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
                  sendAuthTextMsg: mockNotify,
                },
              },
            })
            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')
            expect(user.tfaSendMethod).toEqual('email')
          })
          it('sets phoneValidated to false', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: user._key,
                query,
                collections: collectionNames,
                transaction,
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
                  sendAuthTextMsg: mockNotify,
                },
              },
            })
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
      describe('user is setting number for first time', () => {
        beforeEach(async () => {
          user = await collections.users.save({
            userName: 'test.account@istio.actually.exists',
            displayName: 'Test Account',
            tfaValidated: false,
            emailValidated: false,
          })
        })
        it('returns status text and updated user', async () => {
          const newPhoneNumber = '+12345678901'
          const response = await graphql({
            schema,
            source: `
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
            rootValue: null,
            contextValue: {
              i18n,
              request,
              userKey: user._key,
              query,
              collections: collectionNames,
              transaction,
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
                sendAuthTextMsg: mockNotify,
              },
            },
          })

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
            user,
          })
          expect(consoleOutput).toEqual([`User: ${user._key} successfully set phone number.`])
          expect(decryptPhoneNumber(user.phoneDetails)).toEqual(newPhoneNumber)
        })
      })
      describe('user is phone validated', () => {
        describe('tfaSendMethod: None', () => {
          beforeEach(async () => {
            user = await collections.users.save({
              userName: 'test.account@istio.actually.exists',
              displayName: 'Test Account',
              phoneDetails: {},
              phoneValidated: true,
              tfaValidated: false,
              emailValidated: false,
              tfaSendMethod: 'none',
            })
          })
          it('returns status text and updated user', async () => {
            const newPhoneNumber = '+12345678901'
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: user._key,
                query,
                collections: collectionNames,
                transaction,
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
                  sendAuthTextMsg: mockNotify,
                },
              },
            })

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
              user,
            })
            expect(consoleOutput).toEqual([`User: ${user._key} successfully set phone number.`])
            expect(decryptPhoneNumber(user.phoneDetails)).toEqual(newPhoneNumber)
          })
          it('tfaSendMethod stays as none', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: user._key,
                query,
                collections: collectionNames,
                transaction,
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
                  sendAuthTextMsg: mockNotify,
                },
              },
            })
            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')
            expect(user.tfaSendMethod).toEqual('none')
          })
          it('sets phoneValidated to false', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: user._key,
                query,
                collections: collectionNames,
                transaction,
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
                  sendAuthTextMsg: mockNotify,
                },
              },
            })
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
              phoneDetails: {},
              phoneValidated: true,
              tfaValidated: false,
              emailValidated: true,
              tfaSendMethod: 'email',
            })
          })
          it('returns status text', async () => {
            const newPhoneNumber = '+12345678901'
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: user._key,
                query,
                collections: collectionNames,
                transaction,
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
                  sendAuthTextMsg: mockNotify,
                },
              },
            })

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
              user,
            })
            expect(consoleOutput).toEqual([`User: ${user._key} successfully set phone number.`])
            expect(decryptPhoneNumber(user.phoneDetails)).toEqual(newPhoneNumber)
          })
          it('tfaSendMethod stays as email', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: user._key,
                query,
                collections: collectionNames,
                transaction,
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
                  sendAuthTextMsg: mockNotify,
                },
              },
            })
            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')
            expect(user.tfaSendMethod).toEqual('email')
          })
          it('sets phoneValidated to false', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: user._key,
                query,
                collections: collectionNames,
                transaction,
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
                  sendAuthTextMsg: mockNotify,
                },
              },
            })
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
              phoneDetails: {},
              phoneValidated: true,
              tfaValidated: false,
              emailValidated: true,
              tfaSendMethod: 'email',
            })
          })
          it('returns status text', async () => {
            const newPhoneNumber = '+12345678901'
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: user._key,
                query,
                collections: collectionNames,
                transaction,
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
                  sendAuthTextMsg: mockNotify,
                },
              },
            })

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
              user,
            })
            expect(consoleOutput).toEqual([`User: ${user._key} successfully set phone number.`])
            expect(decryptPhoneNumber(user.phoneDetails)).toEqual(newPhoneNumber)
          })
          it('sets tfaSendMethod to email', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: user._key,
                query,
                collections: collectionNames,
                transaction,
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
                  sendAuthTextMsg: mockNotify,
                },
              },
            })
            user = await loadUserByUserName({
              query,
              userKey: '1',
              i18n: {},
            }).load('test.account@istio.actually.exists')
            expect(user.tfaSendMethod).toEqual('email')
          })
          it('sets phoneValidated to false', async () => {
            const newPhoneNumber = '+12345678901'
            await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: user._key,
                query,
                collections: collectionNames,
                transaction,
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
                  sendAuthTextMsg: mockNotify,
                },
              },
            })
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
  })
  describe('given an unsuccessful phone number set', () => {
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
      describe('transaction step error occurs', () => {
        describe('when setting phone number', () => {
          it('throws an error', async () => {
            const newPhoneNumber = '+12345678901'

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockRejectedValue(new Error('Transaction step error')),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: 123,
                query,
                collections: collectionNames,
                transaction: mockedTransaction,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                notify: {
                  sendAuthTextMsg: mockNotify,
                },
              },
            })

            const error = [new GraphQLError('Unable to set phone number, please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred for user: 123 when upserting phone number information: Error: Transaction step error`,
            ])
          })
        })
      })
      describe('transaction commit error occurs', () => {
        describe('when setting phone number', () => {
          it('throws an error', async () => {
            const newPhoneNumber = '+12345678901'

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockReturnValue({}),
              commit: jest.fn().mockRejectedValue(new Error('Transaction commit error')),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: 123,
                query,
                collections: collectionNames,
                transaction: mockedTransaction,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                notify: {
                  sendAuthTextMsg: mockNotify,
                },
              },
            })

            const error = [new GraphQLError('Unable to set phone number, please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred for user: 123 when upserting phone number information: Error: Transaction commit error`,
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
      describe('transaction step error occurs', () => {
        describe('when setting phone number', () => {
          it('throws an error', async () => {
            const newPhoneNumber = '+12345678901'

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockRejectedValue(new Error('Transaction step error')),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: 123,
                query,
                collections: collectionNames,
                transaction: mockedTransaction,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                notify: {
                  sendAuthTextMsg: mockNotify,
                },
              },
            })

            const error = [new GraphQLError('Impossible de définir le numéro de téléphone, veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred for user: 123 when upserting phone number information: Error: Transaction step error`,
            ])
          })
        })
      })
      describe('transaction commit error occurs', () => {
        describe('when setting phone number', () => {
          it('throws an error', async () => {
            const newPhoneNumber = '+12345678901'

            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockReturnValue({}),
              commit: jest.fn().mockRejectedValue(new Error('Transaction commit error')),
              abort: jest.fn(),
            })

            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                request,
                userKey: 123,
                query,
                collections: collectionNames,
                transaction: mockedTransaction,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: jest.fn().mockReturnValue({ _key: 123 }),
                },
                validators: {
                  cleanseInput,
                  decryptPhoneNumber,
                },
                loaders: {
                  loadUserByKey: {
                    load: jest.fn(),
                  },
                },
                notify: {
                  sendAuthTextMsg: mockNotify,
                },
              },
            })

            const error = [new GraphQLError('Impossible de définir le numéro de téléphone, veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred for user: 123 when upserting phone number information: Error: Transaction commit error`,
            ])
          })
        })
      })
    })
  })
})
