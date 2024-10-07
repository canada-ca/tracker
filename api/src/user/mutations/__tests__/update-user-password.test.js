import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import bcrypt from 'bcryptjs'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'
import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { tokenize, userRequired } from '../../../auth'
import { loadUserByUserName, loadUserByKey } from '../../loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url } = process.env

const mockNotfiy = jest.fn()

describe('authenticate user account', () => {
  let query, drop, truncate, schema, i18n, user, transaction
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
      ;({ query, drop, truncate, transaction } = await ensure({
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
    beforeEach(async () => {
      await graphql({
        schema,
        source: `
          mutation {
            signUp(
              input: {
                displayName: "Test Account"
                userName: "test.account@istio.actually.exists"
                password: "testpassword123"
                confirmPassword: "testpassword123"
              }
            ) {
              result {
                ... on TFASignInResult {
                  authenticateToken
                  sendMethod
                }
              }
            }
          }
        `,
        rootValue: null,
        contextValue: {
          query,
          collections: collectionNames,
          transaction,
          jwt,
          uuidv4,
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
            sendVerificationEmail: jest.fn(),
          },
          request: {
            protocol: 'https',
            get: (text) => text,
          },
        },
      })
      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          UPDATE { _key: user._key, tfaSendMethod: 'email' } IN users
          RETURN user
      `
      user = await userCursor.next()
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
      it('returns a successful status message', async () => {
        const response = await graphql({
          schema,
          source: `
            mutation {
              updateUserPassword(
                input: {
                  currentPassword: "testpassword123"
                  updatedPassword: "newtestpassword123"
                  updatedPasswordConfirm: "newtestpassword123"
                }
              ) {
                result {
                  ... on UpdateUserPasswordResultType {
                    status
                  }
                  ... on UpdateUserPasswordError {
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
            query,
            collections: collectionNames,
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
          },
        })

        const expectedResponse = {
          data: {
            updateUserPassword: {
              result: {
                status: 'Password was successfully updated.',
              },
            },
          },
        }

        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([`User: ${user._key} successfully updated their password.`])

        consoleOutput.length = 0

        const authenticateResponse = await graphql({
          schema,
          source: `
            mutation {
              signIn(
                input: {
                  userName: "test.account@istio.actually.exists"
                  password: "newtestpassword123"
                }
              ) {
                result {
                  ... on TFASignInResult {
                    sendMethod
                  }
                }
              }
            }
          `,
          rootValue: null,
          contextValue: {
            i18n,
            query,
            collections: collectionNames,
            transaction,
            uuidv4,
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
              sendAuthEmail: mockNotfiy,
            },
          },
        })

        const expectedAuthResponse = {
          data: {
            signIn: {
              result: {
                sendMethod: 'email',
              },
            },
          },
        }

        expect(authenticateResponse).toEqual(expectedAuthResponse)
        expect(consoleOutput).toEqual([`User: ${user._key} successfully signed in, and sent auth msg.`])
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
      it('returns a successful status message', async () => {
        const response = await graphql({
          schema,
          source: `
            mutation {
              updateUserPassword(
                input: {
                  currentPassword: "testpassword123"
                  updatedPassword: "newtestpassword123"
                  updatedPasswordConfirm: "newtestpassword123"
                }
              ) {
                result {
                  ... on UpdateUserPasswordResultType {
                    status
                  }
                  ... on UpdateUserPasswordError {
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
            query,
            collections: collectionNames,
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
          },
        })

        const expectedResponse = {
          data: {
            updateUserPassword: {
              result: {
                status: 'Le mot de passe a été mis à jour avec succès.',
              },
            },
          },
        }

        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([`User: ${user._key} successfully updated their password.`])

        consoleOutput.length = 0

        const authenticateResponse = await graphql({
          schema,
          source: `
            mutation {
              signIn(
                input: {
                  userName: "test.account@istio.actually.exists"
                  password: "newtestpassword123"
                }
              ) {
                result {
                  ... on TFASignInResult {
                    sendMethod
                  }
                }
              }
            }
          `,
          rootValue: null,
          contextValue: {
            i18n,
            query,
            collections: collectionNames,
            transaction,
            uuidv4,
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
              sendAuthEmail: mockNotfiy,
            },
          },
        })

        const expectedAuthResponse = {
          data: {
            signIn: {
              result: {
                sendMethod: 'email',
              },
            },
          },
        }

        expect(authenticateResponse).toEqual(expectedAuthResponse)
        expect(consoleOutput).toEqual([`User: ${user._key} successfully signed in, and sent auth msg.`])
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
      describe('the current password does not match the password in the database', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                updateUserPassword(
                  input: {
                    currentPassword: "randompassword"
                    updatedPassword: "newtestpassword123"
                    updatedPasswordConfirm: "newtestpassword123"
                  }
                ) {
                  result {
                    ... on UpdateUserPasswordResultType {
                      status
                    }
                    ... on UpdateUserPasswordError {
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
              query,
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                bcrypt: {
                  compareSync: jest.fn().mockReturnValue(false),
                },
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
              },
              validators: {
                cleanseInput,
              },
            },
          })

          const error = {
            data: {
              updateUserPassword: {
                result: {
                  code: 400,
                  description: 'Unable to update password, current password does not match. Please try again.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to update their password, however they did not enter the current password correctly.`,
          ])
        })
      })
      describe('the new password does not match the new password confirmation', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                updateUserPassword(
                  input: {
                    currentPassword: "testpassword123"
                    updatedPassword: "newtestpassword123"
                    updatedPasswordConfirm: "oldtestpassword123"
                  }
                ) {
                  result {
                    ... on UpdateUserPasswordResultType {
                      status
                    }
                    ... on UpdateUserPasswordError {
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
              query,
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                bcrypt: {
                  compareSync: jest.fn().mockReturnValue(true),
                },
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
              },
              validators: {
                cleanseInput,
              },
            },
          })

          const error = {
            data: {
              updateUserPassword: {
                result: {
                  code: 400,
                  description: 'Unable to update password, new passwords do not match. Please try again.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to update their password, however the new passwords do not match.`,
          ])
        })
      })
      describe('the new password does not meet GoC requirements', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                updateUserPassword(
                  input: {
                    currentPassword: "testpassword123"
                    updatedPassword: "password"
                    updatedPasswordConfirm: "password"
                  }
                ) {
                  result {
                    ... on UpdateUserPasswordResultType {
                      status
                    }
                    ... on UpdateUserPasswordError {
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
              query,
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                bcrypt: {
                  compareSync: jest.fn().mockReturnValue(true),
                },
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
              },
              validators: {
                cleanseInput,
              },
            },
          })

          const error = {
            data: {
              updateUserPassword: {
                result: {
                  code: 400,
                  description: 'Unable to update password, passwords do not match requirements. Please try again.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to update their password, however the new password does not meet GoC requirements.`,
          ])
        })
      })
      describe('transaction step error occurs', () => {
        describe('when updating password', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  updateUserPassword(
                    input: {
                      currentPassword: "testpassword123"
                      updatedPassword: "newtestpassword123"
                      updatedPasswordConfirm: "newtestpassword123"
                    }
                  ) {
                    result {
                      ... on UpdateUserPasswordResultType {
                        status
                      }
                      ... on UpdateUserPasswordError {
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
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockRejectedValue(new Error('Transaction step error')),
                }),
                userKey: 123,
                auth: {
                  bcrypt: {
                    compareSync: jest.fn().mockReturnValue(true),
                    hashSync: jest.fn().mockReturnValue('password'),
                  },
                  tokenize,
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = [new GraphQLError('Unable to update password. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when user: 123 attempted to update their password: Error: Transaction step error`,
            ])
          })
        })
      })
      describe('transaction commit error occurs', () => {
        describe('when updating password', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  updateUserPassword(
                    input: {
                      currentPassword: "testpassword123"
                      updatedPassword: "newtestpassword123"
                      updatedPasswordConfirm: "newtestpassword123"
                    }
                  ) {
                    result {
                      ... on UpdateUserPasswordResultType {
                        status
                      }
                      ... on UpdateUserPasswordError {
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
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({}),
                  commit: jest.fn().mockRejectedValue(new Error('Transaction commit error')),
                }),
                userKey: 123,
                auth: {
                  bcrypt: {
                    compareSync: jest.fn().mockReturnValue(true),
                    hashSync: jest.fn().mockReturnValue('password'),
                  },
                  tokenize,
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = [new GraphQLError('Unable to update password. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred when user: 123 attempted to update their password: Error: Transaction commit error`,
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
      describe('the current password does not match the password in the database', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                updateUserPassword(
                  input: {
                    currentPassword: "randompassword"
                    updatedPassword: "newtestpassword123"
                    updatedPasswordConfirm: "newtestpassword123"
                  }
                ) {
                  result {
                    ... on UpdateUserPasswordResultType {
                      status
                    }
                    ... on UpdateUserPasswordError {
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
              query,
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                bcrypt: {
                  compareSync: jest.fn().mockReturnValue(false),
                },
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
              },
              validators: {
                cleanseInput,
              },
            },
          })

          const error = {
            data: {
              updateUserPassword: {
                result: {
                  code: 400,
                  description:
                    'Impossible de mettre à jour le mot de passe, le mot de passe actuel ne correspond pas. Veuillez réessayer.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to update their password, however they did not enter the current password correctly.`,
          ])
        })
      })
      describe('the new password does not match the new password confirmation', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                updateUserPassword(
                  input: {
                    currentPassword: "testpassword123"
                    updatedPassword: "newtestpassword123"
                    updatedPasswordConfirm: "oldtestpassword123"
                  }
                ) {
                  result {
                    ... on UpdateUserPasswordResultType {
                      status
                    }
                    ... on UpdateUserPasswordError {
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
              query,
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                bcrypt: {
                  compareSync: jest.fn().mockReturnValue(true),
                },
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
              },
              validators: {
                cleanseInput,
              },
            },
          })

          const error = {
            data: {
              updateUserPassword: {
                result: {
                  code: 400,
                  description:
                    'Impossible de mettre à jour le mot de passe, les nouveaux mots de passe ne correspondent pas. Veuillez réessayer.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to update their password, however the new passwords do not match.`,
          ])
        })
      })
      describe('the new password does not meet GoC requirements', () => {
        it('returns an error message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                updateUserPassword(
                  input: {
                    currentPassword: "testpassword123"
                    updatedPassword: "password"
                    updatedPasswordConfirm: "password"
                  }
                ) {
                  result {
                    ... on UpdateUserPasswordResultType {
                      status
                    }
                    ... on UpdateUserPasswordError {
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
              query,
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                bcrypt: {
                  compareSync: jest.fn().mockReturnValue(true),
                },
                tokenize,
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
              },
              validators: {
                cleanseInput,
              },
            },
          })

          const error = {
            data: {
              updateUserPassword: {
                result: {
                  code: 400,
                  description:
                    'Impossible de mettre à jour le mot de passe, les mots de passe ne correspondent pas aux exigences. Veuillez réessayer.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to update their password, however the new password does not meet GoC requirements.`,
          ])
        })
      })
      describe('transaction step error occurs', () => {
        describe('when updating password', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  updateUserPassword(
                    input: {
                      currentPassword: "testpassword123"
                      updatedPassword: "newtestpassword123"
                      updatedPasswordConfirm: "newtestpassword123"
                    }
                  ) {
                    result {
                      ... on UpdateUserPasswordResultType {
                        status
                      }
                      ... on UpdateUserPasswordError {
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
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockRejectedValue(new Error('Transaction step error')),
                }),
                userKey: 123,
                auth: {
                  bcrypt: {
                    compareSync: jest.fn().mockReturnValue(true),
                    hashSync: jest.fn().mockReturnValue('password'),
                  },
                  tokenize,
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = [new GraphQLError('Impossible de mettre à jour le mot de passe. Veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred when user: 123 attempted to update their password: Error: Transaction step error`,
            ])
          })
        })
      })
      describe('transaction commit error occurs', () => {
        describe('when updating password', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  updateUserPassword(
                    input: {
                      currentPassword: "testpassword123"
                      updatedPassword: "newtestpassword123"
                      updatedPasswordConfirm: "newtestpassword123"
                    }
                  ) {
                    result {
                      ... on UpdateUserPasswordResultType {
                        status
                      }
                      ... on UpdateUserPasswordError {
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
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({}),
                  commit: jest.fn().mockRejectedValue(new Error('Transaction commit error')),
                }),
                userKey: 123,
                auth: {
                  bcrypt: {
                    compareSync: jest.fn().mockReturnValue(true),
                    hashSync: jest.fn().mockReturnValue('password'),
                  },
                  tokenize,
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = [new GraphQLError('Impossible de mettre à jour le mot de passe. Veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx commit error occurred when user: 123 attempted to update their password: Error: Transaction commit error`,
            ])
          })
        })
      })
    })
  })
})
