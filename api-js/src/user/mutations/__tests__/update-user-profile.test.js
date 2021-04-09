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
  let query, drop, truncate, collections, schema, i18n

  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    // Generate DB Items
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError

    await collections.users.save({
      displayName: 'Test Account',
      userName: 'test.account@istio.actually.exists',
      preferredLang: 'french',
      tfaSendMethod: 'none',
    })
    consoleOutput = []
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
    describe('given successful update of users profile', () => {
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
    describe('given unsuccessful update of users profile', () => {
      describe('user attempts to set email to one that is already in use', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'john.doe@istio.actually.works',
          })
        })
        it('returns an error message', async () => {
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
            `User: ${user._key} attempted to update their username, but the username is already in use.`,
          ])
        })
      })
      describe('database error occurs when updating profile', () => {
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await cursor.next()

          const userNameLoader = loadUserByUserName({ query })
          const idLoader = loadUserByKey({ query })

          const mockedQuery = jest
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
              query: mockedQuery,
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
                loadUserByUserName: userNameLoader,
                loadUserByKey: idLoader,
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
    describe('given successful update of users profile', () => {
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
            },
          )

          const expectedResponse = {
            data: {
              updateUserProfile: {
                result: {
                  user: {
                    displayName: 'John Doe',
                  },
                  status: 'todo',
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
            },
          )

          const expectedResponse = {
            data: {
              updateUserProfile: {
                result: {
                  user: {
                    userName: 'john.doe@istio.actually.works',
                  },
                  status: 'todo',
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
            },
          )

          const expectedResponse = {
            data: {
              updateUserProfile: {
                result: {
                  user: {
                    preferredLang: 'ENGLISH',
                  },
                  status: 'todo',
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
                },
              )

              const expectedResponse = {
                data: {
                  updateUserProfile: {
                    result: {
                      user: {
                        tfaSendMethod: 'PHONE',
                      },
                      status: 'todo',
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
                },
              )

              const expectedResponse = {
                data: {
                  updateUserProfile: {
                    result: {
                      user: {
                        tfaSendMethod: 'NONE',
                      },
                      status: 'todo',
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
                },
              )

              const expectedResponse = {
                data: {
                  updateUserProfile: {
                    result: {
                      user: {
                        tfaSendMethod: 'EMAIL',
                      },
                      status: 'todo',
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
                },
              )

              const expectedResponse = {
                data: {
                  updateUserProfile: {
                    result: {
                      user: {
                        tfaSendMethod: 'NONE',
                      },
                      status: 'todo',
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
              },
            )

            const expectedResponse = {
              data: {
                updateUserProfile: {
                  result: {
                    user: {
                      tfaSendMethod: 'NONE',
                    },
                    status: 'todo',
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
    describe('given unsuccessful update of users profile', () => {
      describe('user attempts to set email to one that is already in use', () => {
        beforeEach(async () => {
          await collections.users.save({
            userName: 'john.doe@istio.actually.works',
          })
        })
        it('returns an error message', async () => {
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
            },
          )

          const error = {
            data: {
              updateUserProfile: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update their username, but the username is already in use.`,
          ])
        })
      })
      describe('database error occurs when updating profile', () => {
        it('returns an error message', async () => {
          const cursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          const user = await cursor.next()

          const userNameLoader = loadUserByUserName({ query })
          const idLoader = loadUserByKey({ query })

          const mockedQuery = jest
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
              query: mockedQuery,
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
                loadUserByUserName: userNameLoader,
                loadUserByKey: idLoader,
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
