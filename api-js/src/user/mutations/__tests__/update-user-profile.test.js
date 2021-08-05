import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { tokenize, userRequired } from '../../../auth'
import { loadUserByUserName, loadUserByKey } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url, CIPHER_KEY } = process.env

describe('authenticate user account', () => {
  let query, drop, truncate, collections, transaction, schema, i18n

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(() => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful update', () => {
    beforeAll(async () => {
      // Generate DB Items
      ;({ query, drop, truncate, collections, transaction } = await ensure({
        type: 'database',
        name: dbNameFromFile(__filename),
        url,
        rootPassword: rootPass,
        options: databaseOptions({ rootPass }),
      }))
    })
    beforeEach(async () => {
      await collections.users.save({
        displayName: 'Test Account',
        userName: 'test.account@istio.actually.exists',
        preferredLang: 'french',
        tfaSendMethod: 'none',
      })
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
      describe('user updates their display name', () => {
        it('returns a successful status message, and the updated user info', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await cursor.next()

          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(input: { displayName: "John Doe" }) {
                  result {
                    ... on UpdateUserProfileResult {
                      status
                      user {
                        displayName
                      }
                    }
                    ... on UpdateUserProfileError {
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
              query,
              collections,
              transaction,
              userKey: user._key,
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
                loadUserByUserName: loadUserByUserName({ query }),
                loadUserByKey: loadUserByKey({ query }),
              },
              notify: { sendVerificationEmail: jest.fn() },
            },
          )

          const expectedResponse = {
            data: {
              updateUserProfile: {
                result: {
                  user: {
                    displayName: 'John Doe',
                  },
                  status: 'Profile successfully updated.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated their profile.`,
          ])
        })
      })
      describe('user updates their user name', () => {
        it('returns a successful status message, and the updated user info', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await cursor.next()

          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(
                  input: { userName: "john.doe@istio.actually.works" }
                ) {
                  result {
                    ... on UpdateUserProfileResult {
                      status
                      user {
                        userName
                      }
                    }
                    ... on UpdateUserProfileError {
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
              query,
              collections,
              transaction,
              userKey: user._key,
              request: {
                get: jest.fn().mockReturnValue('domain.ca'),
              },
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
                loadUserByUserName: loadUserByUserName({ query }),
                loadUserByKey: loadUserByKey({ query }),
              },
              notify: { sendVerificationEmail: jest.fn() },
            },
          )

          const expectedResponse = {
            data: {
              updateUserProfile: {
                result: {
                  user: {
                    userName: 'john.doe@istio.actually.works',
                  },
                  status: 'Profile successfully updated.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated their profile.`,
          ])
        })
        it('sends new verify email link', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await cursor.next()

          const mockNotify = jest.fn()

          await graphql(
            schema,
            `
              mutation {
                updateUserProfile(
                  input: { userName: "john.doe@istio.actually.works" }
                ) {
                  result {
                    ... on UpdateUserProfileResult {
                      status
                      user {
                        userName
                      }
                    }
                    ... on UpdateUserProfileError {
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
              query,
              collections,
              transaction,
              userKey: user._key,
              request: {
                get: jest.fn().mockReturnValue('domain.ca'),
              },
              auth: {
                bcrypt,
                tokenize: jest.fn().mockReturnValue('token'),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: loadUserByUserName({ query }),
                loadUserByKey: loadUserByKey({ query }),
              },
              notify: { sendVerificationEmail: mockNotify },
            },
          )

          const updatedCursor = await query`
            FOR user IN users
              FILTER user.userName == "john.doe@istio.actually.works"
              RETURN user
          `
          const updatedUser = await updatedCursor.next()

          expect(mockNotify).toBeCalledWith({
            verifyUrl: 'https://domain.ca/validate/token',
            user: {
              id: updatedUser._key,
              _type: 'user',
              ...updatedUser,
            },
          })
        })
        describe('user is email validated', () => {
          it('sets emailValidated to false', async () => {
            const cursor = await query`
              FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                UPDATE user._key WITH {
                  emailValidated: true,
                } IN users
                RETURN NEW
            `
            const user = await cursor.next()

            await graphql(
              schema,
              `
                mutation {
                  updateUserProfile(
                    input: { userName: "john.doe@istio.actually.works" }
                  ) {
                    result {
                      ... on UpdateUserProfileResult {
                        status
                        user {
                          userName
                        }
                      }
                      ... on UpdateUserProfileError {
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
                query,
                collections,
                transaction,
                userKey: user._key,
                request: {
                  get: jest.fn().mockReturnValue('domain.ca'),
                },
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
                  loadUserByUserName: loadUserByUserName({ query }),
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: { sendVerificationEmail: jest.fn() },
              },
            )

            const checkCursor = await query`
              FOR user IN users
                RETURN user
            `
            const checkUser = await checkCursor.next()

            expect(checkUser.emailValidated).toBeFalsy()
          })
        })
        describe('user is not email validated', () => {
          it('does not change emailValidated value', async () => {
            const cursor = await query`
              FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                UPDATE user._key WITH {
                  emailValidated: false,
                } IN users
                RETURN NEW
            `
            const user = await cursor.next()

            await graphql(
              schema,
              `
                mutation {
                  updateUserProfile(
                    input: { userName: "john.doe@istio.actually.works" }
                  ) {
                    result {
                      ... on UpdateUserProfileResult {
                        status
                        user {
                          userName
                        }
                      }
                      ... on UpdateUserProfileError {
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
                query,
                collections,
                transaction,
                userKey: user._key,
                request: {
                  get: jest.fn().mockReturnValue('domain.ca'),
                },
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
                  loadUserByUserName: loadUserByUserName({ query }),
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: { sendVerificationEmail: jest.fn() },
              },
            )

            const checkCursor = await query`
              FOR user IN users
                RETURN user
            `
            const checkUser = await checkCursor.next()

            expect(checkUser.emailValidated).toBeFalsy()
          })
        })
      })
      describe('user updates their preferred language', () => {
        it('returns a successful status message, and the updated user info', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await cursor.next()

          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(input: { preferredLang: ENGLISH }) {
                  result {
                    ... on UpdateUserProfileResult {
                      status
                      user {
                        preferredLang
                      }
                    }
                    ... on UpdateUserProfileError {
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
              query,
              collections,
              transaction,
              userKey: user._key,
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
                loadUserByUserName: loadUserByUserName({ query }),
                loadUserByKey: loadUserByKey({ query }),
              },
              notify: { sendVerificationEmail: jest.fn() },
            },
          )

          const expectedResponse = {
            data: {
              updateUserProfile: {
                result: {
                  user: {
                    preferredLang: 'ENGLISH',
                  },
                  status: 'Profile successfully updated.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated their profile.`,
          ])
        })
      })
      describe('user attempts to update their tfa send method', () => {
        describe('user attempts to set to phone', () => {
          describe('user is phone validated', () => {
            beforeEach(async () => {
              await truncate()

              const updatedPhoneDetails = {
                iv: crypto.randomBytes(12).toString('hex'),
              }
              const cipher = crypto.createCipheriv(
                'aes-256-ccm',
                String(CIPHER_KEY),
                Buffer.from(updatedPhoneDetails.iv, 'hex'),
                { authTagLength: 16 },
              )
              let encrypted = cipher.update('+12345678998', 'utf8', 'hex')
              encrypted += cipher.final('hex')

              updatedPhoneDetails.phoneNumber = encrypted
              updatedPhoneDetails.tag = cipher.getAuthTag().toString('hex')

              await collections.users.save({
                displayName: 'Test Account',
                userName: 'test.account@istio.actually.exists',
                preferredLang: 'english',
                phoneValidated: true,
                tfaSendMethod: 'none',
                phoneDetails: updatedPhoneDetails,
              })
            })
            it('returns message, and the updated user info', async () => {
              const cursor = await query`
                FOR user IN users
                  FILTER user.userName == "test.account@istio.actually.exists"
                  RETURN user
              `
              const user = await cursor.next()

              const response = await graphql(
                schema,
                `
                  mutation {
                    updateUserProfile(input: { tfaSendMethod: PHONE }) {
                      result {
                        ... on UpdateUserProfileResult {
                          status
                          user {
                            tfaSendMethod
                          }
                        }
                        ... on UpdateUserProfileError {
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
                  query,
                  collections,
                  transaction,
                  userKey: user._key,
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
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                  notify: { sendVerificationEmail: jest.fn() },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserProfile: {
                    result: {
                      user: {
                        tfaSendMethod: 'PHONE',
                      },
                      status: 'Profile successfully updated.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully updated their profile.`,
              ])
            })
          })
          describe('user is not phone validated', () => {
            beforeEach(async () => {
              await truncate()

              const updatedPhoneDetails = {
                iv: crypto.randomBytes(12).toString('hex'),
              }
              const cipher = crypto.createCipheriv(
                'aes-256-ccm',
                String(CIPHER_KEY),
                Buffer.from(updatedPhoneDetails.iv, 'hex'),
                { authTagLength: 16 },
              )
              let encrypted = cipher.update('+12345678998', 'utf8', 'hex')
              encrypted += cipher.final('hex')

              updatedPhoneDetails.phoneNumber = encrypted
              updatedPhoneDetails.tag = cipher.getAuthTag().toString('hex')

              await collections.users.save({
                displayName: 'Test Account',
                userName: 'test.account@istio.actually.exists',
                preferredLang: 'english',
                phoneValidated: false,
                tfaSendMethod: 'none',
                phoneDetails: updatedPhoneDetails,
              })
            })
            it('returns message, and the updated user info', async () => {
              const cursor = await query`
                FOR user IN users
                  FILTER user.userName == "test.account@istio.actually.exists"
                  RETURN user
              `
              const user = await cursor.next()

              const response = await graphql(
                schema,
                `
                  mutation {
                    updateUserProfile(input: { tfaSendMethod: PHONE }) {
                      result {
                        ... on UpdateUserProfileResult {
                          status
                          user {
                            tfaSendMethod
                          }
                        }
                        ... on UpdateUserProfileError {
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
                  query,
                  collections,
                  transaction,
                  userKey: user._key,
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
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                  notify: { sendVerificationEmail: jest.fn() },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserProfile: {
                    result: {
                      user: {
                        tfaSendMethod: 'NONE',
                      },
                      status: 'Profile successfully updated.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully updated their profile.`,
              ])
            })
          })
        })
        describe('user attempts to set to email', () => {
          describe('user is email validated', () => {
            beforeEach(async () => {
              await truncate()
              await collections.users.save({
                displayName: 'Test Account',
                userName: 'test.account@istio.actually.exists',
                preferredLang: 'english',
                emailValidated: true,
                tfaSendMethod: 'none',
              })
            })
            it('returns message, and the updated user info', async () => {
              const cursor = await query`
                FOR user IN users
                  FILTER user.userName == "test.account@istio.actually.exists"
                  RETURN user
              `
              const user = await cursor.next()

              const response = await graphql(
                schema,
                `
                  mutation {
                    updateUserProfile(input: { tfaSendMethod: EMAIL }) {
                      result {
                        ... on UpdateUserProfileResult {
                          status
                          user {
                            tfaSendMethod
                          }
                        }
                        ... on UpdateUserProfileError {
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
                  query,
                  collections,
                  transaction,
                  userKey: user._key,
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
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                  notify: { sendVerificationEmail: jest.fn() },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserProfile: {
                    result: {
                      user: {
                        tfaSendMethod: 'EMAIL',
                      },
                      status: 'Profile successfully updated.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully updated their profile.`,
              ])
            })
          })
          describe('user is not email validated', () => {
            beforeEach(async () => {
              await truncate()
              await collections.users.save({
                displayName: 'Test Account',
                userName: 'test.account@istio.actually.exists',
                preferredLang: 'english',
                emailValidated: false,
                tfaSendMethod: 'none',
              })
            })
            it('returns message, and the updated user info', async () => {
              const cursor = await query`
                FOR user IN users
                  FILTER user.userName == "test.account@istio.actually.exists"
                  RETURN user
              `
              const user = await cursor.next()

              const response = await graphql(
                schema,
                `
                  mutation {
                    updateUserProfile(input: { tfaSendMethod: EMAIL }) {
                      result {
                        ... on UpdateUserProfileResult {
                          status
                          user {
                            tfaSendMethod
                          }
                        }
                        ... on UpdateUserProfileError {
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
                  query,
                  collections,
                  transaction,
                  userKey: user._key,
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
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                  notify: { sendVerificationEmail: jest.fn() },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserProfile: {
                    result: {
                      user: {
                        tfaSendMethod: 'NONE',
                      },
                      status: 'Profile successfully updated.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully updated their profile.`,
              ])
            })
          })
        })
        describe('user attempts to set to none', () => {
          beforeEach(async () => {
            await truncate()
            await collections.users.save({
              displayName: 'Test Account',
              userName: 'test.account@istio.actually.exists',
              preferredLang: 'english',
              emailValidated: true,
              tfaSendMethod: 'email',
            })
          })
          it('returns message, and the updated user info', async () => {
            const cursor = await query`
                FOR user IN users
                  FILTER user.userName == "test.account@istio.actually.exists"
                  RETURN user
              `
            const user = await cursor.next()

            const response = await graphql(
              schema,
              `
                mutation {
                  updateUserProfile(input: { tfaSendMethod: NONE }) {
                    result {
                      ... on UpdateUserProfileResult {
                        status
                        user {
                          tfaSendMethod
                        }
                      }
                      ... on UpdateUserProfileError {
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
                query,
                collections,
                transaction,
                userKey: user._key,
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
                  loadUserByUserName: loadUserByUserName({ query }),
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: { sendVerificationEmail: jest.fn() },
              },
            )

            const expectedResponse = {
              data: {
                updateUserProfile: {
                  result: {
                    user: {
                      tfaSendMethod: 'NONE',
                    },
                    status: 'Profile successfully updated.',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key} successfully updated their profile.`,
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
      describe('user updates their display name', () => {
        it('returns a successful status message, and the updated user info', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await cursor.next()

          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(input: { displayName: "John Doe" }) {
                  result {
                    ... on UpdateUserProfileResult {
                      status
                      user {
                        displayName
                      }
                    }
                    ... on UpdateUserProfileError {
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
              query,
              collections,
              transaction,
              userKey: user._key,
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
                loadUserByUserName: loadUserByUserName({ query }),
                loadUserByKey: loadUserByKey({ query }),
              },
              notify: { sendVerificationEmail: jest.fn() },
            },
          )

          const expectedResponse = {
            data: {
              updateUserProfile: {
                result: {
                  user: {
                    displayName: 'John Doe',
                  },
                  status: 'Le profil a été mis à jour avec succès.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated their profile.`,
          ])
        })
      })
      describe('user updates their user name', () => {
        describe('user updates their user name', () => {
          it('returns a successful status message, and the updated user info', async () => {
            const cursor = await query`
              FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
            `
            const user = await cursor.next()

            const response = await graphql(
              schema,
              `
                mutation {
                  updateUserProfile(
                    input: { userName: "john.doe@istio.actually.works" }
                  ) {
                    result {
                      ... on UpdateUserProfileResult {
                        status
                        user {
                          userName
                        }
                      }
                      ... on UpdateUserProfileError {
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
                query,
                collections,
                transaction,
                userKey: user._key,
                request: {
                  get: jest.fn().mockReturnValue('domain.ca'),
                },
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
                  loadUserByUserName: loadUserByUserName({ query }),
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: { sendVerificationEmail: jest.fn() },
              },
            )

            const expectedResponse = {
              data: {
                updateUserProfile: {
                  result: {
                    user: {
                      userName: 'john.doe@istio.actually.works',
                    },
                    status: 'Le profil a été mis à jour avec succès.',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key} successfully updated their profile.`,
            ])
          })
          it('sends new verify email link', async () => {
            const cursor = await query`
              FOR user IN users
                FILTER user.userName == "test.account@istio.actually.exists"
                RETURN user
            `
            const user = await cursor.next()

            const mockNotify = jest.fn()

            await graphql(
              schema,
              `
                mutation {
                  updateUserProfile(
                    input: { userName: "john.doe@istio.actually.works" }
                  ) {
                    result {
                      ... on UpdateUserProfileResult {
                        status
                        user {
                          userName
                        }
                      }
                      ... on UpdateUserProfileError {
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
                query,
                collections,
                transaction,
                userKey: user._key,
                request: {
                  get: jest.fn().mockReturnValue('domain.ca'),
                },
                auth: {
                  bcrypt,
                  tokenize: jest.fn().mockReturnValue('token'),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: loadUserByUserName({ query }),
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: { sendVerificationEmail: mockNotify },
              },
            )

            const updatedCursor = await query`
              FOR user IN users
                FILTER user.userName == "john.doe@istio.actually.works"
                RETURN user
            `
            const updatedUser = await updatedCursor.next()

            expect(mockNotify).toBeCalledWith({
              verifyUrl: 'https://domain.ca/validate/token',
              user: {
                id: updatedUser._key,
                _type: 'user',
                ...updatedUser,
              },
            })
          })
          describe('user is email validated', () => {
            it('sets emailValidated to false', async () => {
              const cursor = await query`
                FOR user IN users
                  FILTER user.userName == "test.account@istio.actually.exists"
                  UPDATE user._key WITH {
                    emailValidated: true,
                  } IN users
                  RETURN NEW
              `
              const user = await cursor.next()

              await graphql(
                schema,
                `
                  mutation {
                    updateUserProfile(
                      input: { userName: "john.doe@istio.actually.works" }
                    ) {
                      result {
                        ... on UpdateUserProfileResult {
                          status
                          user {
                            userName
                          }
                        }
                        ... on UpdateUserProfileError {
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
                  query,
                  collections,
                  transaction,
                  request: {
                    get: jest.fn().mockReturnValue('domain.ca'),
                  },
                  userKey: user._key,
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
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                  notify: { sendVerificationEmail: jest.fn() },
                },
              )

              const checkCursor = await query`
                FOR user IN users
                  RETURN user
              `
              const checkUser = await checkCursor.next()

              expect(checkUser.emailValidated).toBeFalsy()
            })
          })
          describe('user is not email validated', () => {
            it('does not change emailValidated value', async () => {
              const cursor = await query`
                FOR user IN users
                  FILTER user.userName == "test.account@istio.actually.exists"
                  UPDATE user._key WITH {
                    emailValidated: false,
                  } IN users
                  RETURN NEW
              `
              const user = await cursor.next()

              await graphql(
                schema,
                `
                  mutation {
                    updateUserProfile(
                      input: { userName: "john.doe@istio.actually.works" }
                    ) {
                      result {
                        ... on UpdateUserProfileResult {
                          status
                          user {
                            userName
                          }
                        }
                        ... on UpdateUserProfileError {
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
                  query,
                  collections,
                  transaction,
                  request: {
                    get: jest.fn().mockReturnValue('domain.ca'),
                  },
                  userKey: user._key,
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
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                  notify: { sendVerificationEmail: jest.fn() },
                },
              )

              const checkCursor = await query`
                FOR user IN users
                  RETURN user
              `
              const checkUser = await checkCursor.next()

              expect(checkUser.emailValidated).toBeFalsy()
            })
          })
        })
      })
      describe('user updates their preferred language', () => {
        it('returns a successful status message, and the updated user info', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await cursor.next()

          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(input: { preferredLang: ENGLISH }) {
                  result {
                    ... on UpdateUserProfileResult {
                      status
                      user {
                        preferredLang
                      }
                    }
                    ... on UpdateUserProfileError {
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
              query,
              collections,
              transaction,
              userKey: user._key,
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
                loadUserByUserName: loadUserByUserName({ query }),
                loadUserByKey: loadUserByKey({ query }),
              },
              notify: { sendVerificationEmail: jest.fn() },
            },
          )

          const expectedResponse = {
            data: {
              updateUserProfile: {
                result: {
                  user: {
                    preferredLang: 'ENGLISH',
                  },
                  status: 'Le profil a été mis à jour avec succès.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully updated their profile.`,
          ])
        })
      })
      describe('user attempts to update their tfa send method', () => {
        describe('user attempts to set to phone', () => {
          describe('user is phone validated', () => {
            beforeEach(async () => {
              await truncate()

              const updatedPhoneDetails = {
                iv: crypto.randomBytes(12).toString('hex'),
              }
              const cipher = crypto.createCipheriv(
                'aes-256-ccm',
                String(CIPHER_KEY),
                Buffer.from(updatedPhoneDetails.iv, 'hex'),
                { authTagLength: 16 },
              )
              let encrypted = cipher.update('+12345678998', 'utf8', 'hex')
              encrypted += cipher.final('hex')

              updatedPhoneDetails.phoneNumber = encrypted
              updatedPhoneDetails.tag = cipher.getAuthTag().toString('hex')

              await collections.users.save({
                displayName: 'Test Account',
                userName: 'test.account@istio.actually.exists',
                preferredLang: 'english',
                phoneValidated: true,
                tfaSendMethod: 'none',
                phoneDetails: updatedPhoneDetails,
              })
            })
            it('returns message, and the updated user info', async () => {
              const cursor = await query`
                FOR user IN users
                  FILTER user.userName == "test.account@istio.actually.exists"
                  RETURN user
              `
              const user = await cursor.next()

              const response = await graphql(
                schema,
                `
                  mutation {
                    updateUserProfile(input: { tfaSendMethod: PHONE }) {
                      result {
                        ... on UpdateUserProfileResult {
                          status
                          user {
                            tfaSendMethod
                          }
                        }
                        ... on UpdateUserProfileError {
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
                  query,
                  collections,
                  transaction,
                  userKey: user._key,
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
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                  notify: { sendVerificationEmail: jest.fn() },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserProfile: {
                    result: {
                      user: {
                        tfaSendMethod: 'PHONE',
                      },
                      status: 'Le profil a été mis à jour avec succès.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully updated their profile.`,
              ])
            })
          })
          describe('user is not phone validated', () => {
            beforeEach(async () => {
              await truncate()

              const updatedPhoneDetails = {
                iv: crypto.randomBytes(12).toString('hex'),
              }
              const cipher = crypto.createCipheriv(
                'aes-256-ccm',
                String(CIPHER_KEY),
                Buffer.from(updatedPhoneDetails.iv, 'hex'),
                { authTagLength: 16 },
              )
              let encrypted = cipher.update('+12345678998', 'utf8', 'hex')
              encrypted += cipher.final('hex')

              updatedPhoneDetails.phoneNumber = encrypted
              updatedPhoneDetails.tag = cipher.getAuthTag().toString('hex')

              await collections.users.save({
                displayName: 'Test Account',
                userName: 'test.account@istio.actually.exists',
                preferredLang: 'english',
                phoneValidated: false,
                tfaSendMethod: 'none',
                phoneDetails: updatedPhoneDetails,
              })
            })
            it('returns message, and the updated user info', async () => {
              const cursor = await query`
                FOR user IN users
                  FILTER user.userName == "test.account@istio.actually.exists"
                  RETURN user
              `
              const user = await cursor.next()

              const response = await graphql(
                schema,
                `
                  mutation {
                    updateUserProfile(input: { tfaSendMethod: PHONE }) {
                      result {
                        ... on UpdateUserProfileResult {
                          status
                          user {
                            tfaSendMethod
                          }
                        }
                        ... on UpdateUserProfileError {
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
                  query,
                  collections,
                  transaction,
                  userKey: user._key,
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
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                  notify: { sendVerificationEmail: jest.fn() },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserProfile: {
                    result: {
                      user: {
                        tfaSendMethod: 'NONE',
                      },
                      status: 'Le profil a été mis à jour avec succès.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully updated their profile.`,
              ])
            })
          })
        })
        describe('user attempts to set to email', () => {
          describe('user is email validated', () => {
            beforeEach(async () => {
              await truncate()
              await collections.users.save({
                displayName: 'Test Account',
                userName: 'test.account@istio.actually.exists',
                preferredLang: 'english',
                emailValidated: true,
                tfaSendMethod: 'none',
              })
            })
            it('returns message, and the updated user info', async () => {
              const cursor = await query`
                FOR user IN users
                  FILTER user.userName == "test.account@istio.actually.exists"
                  RETURN user
              `
              const user = await cursor.next()

              const response = await graphql(
                schema,
                `
                  mutation {
                    updateUserProfile(input: { tfaSendMethod: EMAIL }) {
                      result {
                        ... on UpdateUserProfileResult {
                          status
                          user {
                            tfaSendMethod
                          }
                        }
                        ... on UpdateUserProfileError {
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
                  query,
                  collections,
                  transaction,
                  userKey: user._key,
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
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                  notify: { sendVerificationEmail: jest.fn() },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserProfile: {
                    result: {
                      user: {
                        tfaSendMethod: 'EMAIL',
                      },
                      status: 'Le profil a été mis à jour avec succès.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully updated their profile.`,
              ])
            })
          })
          describe('user is not email validated', () => {
            beforeEach(async () => {
              await truncate()
              await collections.users.save({
                displayName: 'Test Account',
                userName: 'test.account@istio.actually.exists',
                preferredLang: 'english',
                emailValidated: false,
                tfaSendMethod: 'none',
              })
            })
            it('returns message, and the updated user info', async () => {
              const cursor = await query`
                FOR user IN users
                  FILTER user.userName == "test.account@istio.actually.exists"
                  RETURN user
              `
              const user = await cursor.next()

              const response = await graphql(
                schema,
                `
                  mutation {
                    updateUserProfile(input: { tfaSendMethod: EMAIL }) {
                      result {
                        ... on UpdateUserProfileResult {
                          status
                          user {
                            tfaSendMethod
                          }
                        }
                        ... on UpdateUserProfileError {
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
                  query,
                  collections,
                  transaction,
                  userKey: user._key,
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
                    loadUserByUserName: loadUserByUserName({ query }),
                    loadUserByKey: loadUserByKey({ query }),
                  },
                  notify: { sendVerificationEmail: jest.fn() },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserProfile: {
                    result: {
                      user: {
                        tfaSendMethod: 'NONE',
                      },
                      status: 'Le profil a été mis à jour avec succès.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successfully updated their profile.`,
              ])
            })
          })
        })
        describe('user attempts to set to none', () => {
          beforeEach(async () => {
            await truncate()
            await collections.users.save({
              displayName: 'Test Account',
              userName: 'test.account@istio.actually.exists',
              preferredLang: 'english',
              emailValidated: true,
              tfaSendMethod: 'email',
            })
          })
          it('returns message, and the updated user info', async () => {
            const cursor = await query`
                FOR user IN users
                  FILTER user.userName == "test.account@istio.actually.exists"
                  RETURN user
              `
            const user = await cursor.next()

            const response = await graphql(
              schema,
              `
                mutation {
                  updateUserProfile(input: { tfaSendMethod: NONE }) {
                    result {
                      ... on UpdateUserProfileResult {
                        status
                        user {
                          tfaSendMethod
                        }
                      }
                      ... on UpdateUserProfileError {
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
                query,
                collections,
                transaction,
                userKey: user._key,
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
                  loadUserByUserName: loadUserByUserName({ query }),
                  loadUserByKey: loadUserByKey({ query }),
                },
                notify: { sendVerificationEmail: jest.fn() },
              },
            )

            const expectedResponse = {
              data: {
                updateUserProfile: {
                  result: {
                    user: {
                      tfaSendMethod: 'NONE',
                    },
                    status: 'Le profil a été mis à jour avec succès.',
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${user._key} successfully updated their profile.`,
            ])
          })
        })
      })
    })
  })
  describe('given an unsuccessful update', () => {
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
      describe('user attempts to set email to one that is already in use', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(
                  input: { userName: "john.doe@istio.actually.works" }
                ) {
                  result {
                    ... on UpdateUserProfileResult {
                      status
                      user {
                        id
                      }
                    }
                    ... on UpdateUserProfileError {
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
              query,
              collections,
              transaction: jest.fn(),
              userKey: 123,
              auth: {
                bcrypt,
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  tfaSendMethod: 'none',
                }),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn().mockReturnValue({}),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
              notify: { sendVerificationEmail: jest.fn() },
            },
          )

          const error = {
            data: {
              updateUserProfile: {
                result: {
                  code: 400,
                  description: 'Username not available, please try another.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to update their username, but the username is already in use.`,
          ])
        })
      })
      describe('given a transaction step error', () => {
        describe('when updating profile', () => {
          it('throws an error', async () => {
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
                    result {
                      ... on UpdateUserProfileResult {
                        status
                        user {
                          id
                        }
                      }
                      ... on UpdateUserProfileError {
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
                query,
                collections,
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockRejectedValue(new Error('Transaction step error')),
                }),
                userKey: 123,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: jest.fn().mockReturnValue({
                    tfaSendMethod: 'none',
                  }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                },
                notify: { sendVerificationEmail: jest.fn() },
              },
            )

            const error = [
              new GraphQLError('Unable to update profile. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error ocurred when user: 123 attempted to update their profile: Error: Transaction step error`,
            ])
          })
        })
      })
      describe('given a transaction step error', () => {
        describe('when updating profile', () => {
          it('throws an error', async () => {
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
                    result {
                      ... on UpdateUserProfileResult {
                        status
                        user {
                          id
                        }
                      }
                      ... on UpdateUserProfileError {
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
                query,
                collections,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({}),
                  commit: jest
                    .fn()
                    .mockRejectedValue(new Error('Transaction commit error')),
                }),
                userKey: 123,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: jest.fn().mockReturnValue({
                    tfaSendMethod: 'none',
                  }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                },
                notify: { sendVerificationEmail: jest.fn() },
              },
            )

            const error = [
              new GraphQLError('Unable to update profile. Please try again.'),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error ocurred when user: 123 attempted to update their profile: Error: Transaction commit error`,
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
      describe('user attempts to set email to one that is already in use', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                updateUserProfile(
                  input: { userName: "john.doe@istio.actually.works" }
                ) {
                  result {
                    ... on UpdateUserProfileResult {
                      status
                      user {
                        id
                      }
                    }
                    ... on UpdateUserProfileError {
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
              query,
              collections,
              transaction: jest.fn(),
              userKey: 123,
              auth: {
                bcrypt,
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  tfaSendMethod: 'none',
                }),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadUserByUserName: {
                  load: jest.fn().mockReturnValue({}),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
              notify: { sendVerificationEmail: jest.fn() },
            },
          )

          const error = {
            data: {
              updateUserProfile: {
                result: {
                  code: 400,
                  description:
                    "Le nom d'utilisateur n'est pas disponible, veuillez en essayer un autre.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to update their username, but the username is already in use.`,
          ])
        })
      })
      describe('given a transaction step error', () => {
        describe('when updating profile', () => {
          it('throws an error', async () => {
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
                    result {
                      ... on UpdateUserProfileResult {
                        status
                        user {
                          id
                        }
                      }
                      ... on UpdateUserProfileError {
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
                query,
                collections,
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockRejectedValue(new Error('Transaction step error')),
                }),
                userKey: 123,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: jest.fn().mockReturnValue({
                    tfaSendMethod: 'none',
                  }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                },
                notify: { sendVerificationEmail: jest.fn() },
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de mettre à jour le profil. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error ocurred when user: 123 attempted to update their profile: Error: Transaction step error`,
            ])
          })
        })
      })
      describe('given a transaction step error', () => {
        describe('when updating profile', () => {
          it('throws an error', async () => {
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
                    result {
                      ... on UpdateUserProfileResult {
                        status
                        user {
                          id
                        }
                      }
                      ... on UpdateUserProfileError {
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
                query,
                collections,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({}),
                  commit: jest
                    .fn()
                    .mockRejectedValue(new Error('Transaction commit error')),
                }),
                userKey: 123,
                auth: {
                  bcrypt,
                  tokenize,
                  userRequired: jest.fn().mockReturnValue({
                    tfaSendMethod: 'none',
                  }),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                },
                notify: { sendVerificationEmail: jest.fn() },
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de mettre à jour le profil. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error ocurred when user: 123 attempted to update their profile: Error: Transaction commit error`,
            ])
          })
        })
      })
    })
  })
})
