import { setupI18n } from '@lingui/core'
import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { checkOrgOwner, userRequired, verifiedRequired } from '../../../auth'
import { loadOrgByKey } from '../../../organization/loaders'
import { loadUserByKey } from '../../../user/loaders'
import { cleanseInput } from '../../../validators'
import { createMutationSchema } from '../../../mutation'
import { createQuerySchema } from '../../../query'

const { DB_PASS: rootPass, DB_URL: url, SIGN_IN_KEY } = process.env

describe('given the transferOrgOwnership mutation', () => {
  let query,
    drop,
    truncate,
    schema,
    collections,
    transaction,
    i18n,
    user,
    user2,
    org

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
  afterEach(() => {
    consoleOutput.length = 0
  })
  describe('given a successful transfer', () => {
    beforeAll(async () => {
      ;({ query, drop, truncate, collections, transaction } = await ensure({
        type: 'database',
        name: dbNameFromFile(__filename),
        url,
        rootPassword: rootPass,
        options: databaseOptions({ rootPass }),
      }))
    })
    beforeEach(async () => {
      org = await collections.organizations.save({
        verified: false,
        orgDetails: {
          en: {
            slug: 'treasury-board-secretariat',
            acronym: 'TBS',
            name: 'Treasury Board of Canada Secretariat',
            zone: 'FED',
            sector: 'TBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
          fr: {
            slug: 'secretariat-conseil-tresor',
            acronym: 'SCT',
            name: 'Secrétariat du Conseil Trésor du Canada',
            zone: 'FED',
            sector: 'TBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
        },
      })
      user = await collections.users.save({
        userName: 'test.account@email.gc.ca',
        emailValidated: true,
      })
      user2 = await collections.users.save({
        userName: 'test.account@email.canada.ca',
        emailValidated: true,
      })
      await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'admin',
        owner: true,
      })
      await collections.affiliations.save({
        _from: org._id,
        _to: user2._id,
        permission: 'admin',
        owner: false,
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('user is the org owner', () => {
      it('sets owner field in the requesting users to false', async () => {
        await graphql(
          schema,
          `
            mutation {
              transferOrgOwnership (
                input: {
                  orgId: "${toGlobalId('organizations', org._key)}"
                  userId: "${toGlobalId('users', user2._key)}"
                }
              ) {
                result {
                  ... on TransferOrgOwnershipResult {
                    status
                  }
                  ... on AffiliationError {
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
              checkOrgOwner: checkOrgOwner({
                i18n,
                query,
                userKey: user._key,
              }),
              userRequired: userRequired({
                i18n,
                userKey: user._key,
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              }),
              verifiedRequired: verifiedRequired({ i18n }),
            },
            loaders: {
              loadOrgByKey: loadOrgByKey({
                query,
                language: 'en',
                i18n,
                userKey: user._key,
              }),
              loadUserByKey: loadUserByKey({ query, userKey: user._key, i18n }),
            },
            validators: { cleanseInput },
          },
        )

        const testAffiliationCursor = await query`
          FOR aff IN affiliations 
            FILTER aff._to == ${user._id}
            RETURN aff
        `
        const testAffiliation = await testAffiliationCursor.next()
        expect(testAffiliation).toMatchObject({ owner: false })
      })
      it('sets owner field in the requested users to true', async () => {
        await graphql(
          schema,
          `
            mutation {
              transferOrgOwnership (
                input: {
                  orgId: "${toGlobalId('organizations', org._key)}"
                  userId: "${toGlobalId('users', user2._key)}"
                }
              ) {
                result {
                  ... on TransferOrgOwnershipResult {
                    status
                  }
                  ... on AffiliationError {
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
              checkOrgOwner: checkOrgOwner({
                i18n,
                query,
                userKey: user._key,
              }),
              userRequired: userRequired({
                i18n,
                userKey: user._key,
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              }),
              verifiedRequired: verifiedRequired({ i18n }),
            },
            loaders: {
              loadOrgByKey: loadOrgByKey({
                query,
                language: 'en',
                i18n,
                userKey: user._key,
              }),
              loadUserByKey: loadUserByKey({ query, userKey: user._key, i18n }),
            },
            validators: { cleanseInput },
          },
        )

        const testAffiliationCursor = await query`
          FOR aff IN affiliations 
            FILTER aff._to == ${user2._id}
            RETURN aff
        `
        const testAffiliation = await testAffiliationCursor.next()
        expect(testAffiliation).toMatchObject({ owner: true })
      })
      describe('users language is set to english', () => {
        beforeAll(() => {
          i18n = setupI18n({
            locale: 'en',
            localeData: {
              en: { plurals: {} },
            },
            locales: ['en'],
            messages: {
              en: englishMessages.messages,
            },
          })
        })
        it('returns a status message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                transferOrgOwnership (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    userId: "${toGlobalId('users', user2._key)}"
                  }
                ) {
                  result {
                    ... on TransferOrgOwnershipResult {
                      status
                    }
                    ... on AffiliationError {
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
                checkOrgOwner: checkOrgOwner({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: user._key,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResult = {
            data: {
              transferOrgOwnership: {
                result: {
                  status:
                    'Successfully transferred org: treasury-board-secretariat ownership to user: test.account@email.canada.ca',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully transfer org: treasury-board-secretariat ownership to user: ${user2._key}.`,
          ])
        })
      })
      describe('users language is set to french', () => {
        beforeAll(() => {
          i18n = setupI18n({
            locale: 'fr',
            localeData: {
              fr: { plurals: {} },
            },
            locales: ['fr'],
            messages: {
              fr: frenchMessages.messages,
            },
          })
        })
        it('returns a status message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                transferOrgOwnership (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    userId: "${toGlobalId('users', user2._key)}"
                  }
                ) {
                  result {
                    ... on TransferOrgOwnershipResult {
                      status
                    }
                    ... on AffiliationError {
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
                checkOrgOwner: checkOrgOwner({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  i18n,
                  userKey: user._key,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResult = {
            data: {
              transferOrgOwnership: {
                result: {
                  status:
                    "A réussi à transférer la propriété de org: treasury-board-secretariat à l'utilisateur: test.account@email.canada.ca",
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully transfer org: treasury-board-secretariat ownership to user: ${user2._key}.`,
          ])
        })
      })
    })
  })
  describe('given an unsuccessful transfer', () => {
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
      describe('requested org is undefined', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                transferOrgOwnership (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    userId: "${toGlobalId('users', user2._key)}"
                  }
                ) {
                  result {
                    ... on TransferOrgOwnershipResult {
                      status
                    }
                    ... on AffiliationError {
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
                checkOrgOwner: checkOrgOwner({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResult = {
            data: {
              transferOrgOwnership: {
                result: {
                  code: 400,
                  description:
                    'Unable to transfer ownership of undefined organization.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to transfer org ownership of an undefined org.`,
          ])
        })
      })
      describe('requested org is verified', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                transferOrgOwnership (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    userId: "${toGlobalId('users', user2._key)}"
                  }
                ) {
                  result {
                    ... on TransferOrgOwnershipResult {
                      status
                    }
                    ... on AffiliationError {
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
                checkOrgOwner: checkOrgOwner({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    verified: true,
                    slug: 'mocked-org',
                  }),
                },
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResult = {
            data: {
              transferOrgOwnership: {
                result: {
                  code: 400,
                  description:
                    'Unable to transfer ownership of a verified organization.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to transfer ownership of a verified org: mocked-org.`,
          ])
        })
      })
      describe('requesting user is not the org owner', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                transferOrgOwnership (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    userId: "${toGlobalId('users', user2._key)}"
                  }
                ) {
                  result {
                    ... on TransferOrgOwnershipResult {
                      status
                    }
                    ... on AffiliationError {
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
                checkOrgOwner: jest.fn().mockReturnValue(false),
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    verified: false,
                    slug: 'mocked-org',
                  }),
                },
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResult = {
            data: {
              transferOrgOwnership: {
                result: {
                  code: 400,
                  description:
                    'Permission Denied: Please contact org owner to transfer ownership.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to transfer org: mocked-org ownership but does not have current ownership.`,
          ])
        })
      })
      describe('requested user is undefined', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                transferOrgOwnership (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    userId: "${toGlobalId('users', user2._key)}"
                  }
                ) {
                  result {
                    ... on TransferOrgOwnershipResult {
                      status
                    }
                    ... on AffiliationError {
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
                checkOrgOwner: jest.fn().mockReturnValue(true),
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    verified: false,
                    slug: 'mocked-org',
                  }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
              validators: { cleanseInput },
            },
          )

          const expectedResult = {
            data: {
              transferOrgOwnership: {
                result: {
                  code: 400,
                  description:
                    'Unable to transfer ownership of an org to an undefined user.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to transfer org: mocked-org ownership to an undefined user.`,
          ])
        })
      })
      describe('requested user does not belong to the requested org', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                transferOrgOwnership (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    userId: "${toGlobalId('users', user2._key)}"
                  }
                ) {
                  result {
                    ... on TransferOrgOwnershipResult {
                      status
                    }
                    ... on AffiliationError {
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
              query: jest.fn().mockReturnValue({ count: 0 }),
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkOrgOwner: jest.fn().mockReturnValue(true),
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    verified: false,
                    slug: 'mocked-org',
                  }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const expectedResult = {
            data: {
              transferOrgOwnership: {
                result: {
                  code: 400,
                  description:
                    'Unable to transfer ownership to a user outside the org. Please invite the user and try again.',
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to transfer org: mocked-org ownership to user: 456 but they are not affiliated with the org.`,
          ])
        })
      })
      describe('database error occurs', () => {
        describe('when checking requested users affiliations', () => {
          it('throws an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  transferOrgOwnership (
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                      userId: "${toGlobalId('users', user2._key)}"
                    }
                  ) {
                    result {
                      ... on TransferOrgOwnershipResult {
                        status
                      }
                      ... on AffiliationError {
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
                query: jest.fn().mockRejectedValue(new Error('Database error')),
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                  verifiedRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: false,
                      slug: 'mocked-org',
                    }),
                  },
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: { cleanseInput },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to transfer organization ownership. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred for user: 123 when they were attempting to transfer org: mocked-org ownership to user: 456: Error: Database error`,
            ])
          })
        })
      })
      describe('trx step error occurs', () => {
        describe('when removing ownership from requesting user', () => {
          it('throws an error', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockRejectedValue(new Error('Step Error')),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  transferOrgOwnership (
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                      userId: "${toGlobalId('users', user2._key)}"
                    }
                  ) {
                    result {
                      ... on TransferOrgOwnershipResult {
                        status
                      }
                      ... on AffiliationError {
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
                query: jest.fn().mockReturnValue({ count: 1 }),
                collections,
                transaction: mockedTransaction,
                userKey: user._key,
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                  verifiedRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: false,
                      slug: 'mocked-org',
                    }),
                  },
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: { cleanseInput },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to transfer organization ownership. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred for user: 123 when they were attempting to transfer org: mocked-org ownership to user: 456: Error: Step Error`,
            ])
          })
        })
        describe('when adding ownership to requested user', () => {
          it('throws an error', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('Step Error')),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  transferOrgOwnership (
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                      userId: "${toGlobalId('users', user2._key)}"
                    }
                  ) {
                    result {
                      ... on TransferOrgOwnershipResult {
                        status
                      }
                      ... on AffiliationError {
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
                query: jest.fn().mockReturnValue({ count: 1 }),
                collections,
                transaction: mockedTransaction,
                userKey: user._key,
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                  verifiedRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: false,
                      slug: 'mocked-org',
                    }),
                  },
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: { cleanseInput },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to transfer organization ownership. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred for user: 123 when they were attempting to transfer org: mocked-org ownership to user: 456: Error: Step Error`,
            ])
          })
        })
      })
      describe('trx commit error occurs', () => {
        it('throws an error', async () => {
          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest.fn().mockReturnValue(),
            commit: jest.fn().mockRejectedValue(new Error('Commit Error')),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                transferOrgOwnership (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    userId: "${toGlobalId('users', user2._key)}"
                  }
                ) {
                  result {
                    ... on TransferOrgOwnershipResult {
                      status
                    }
                    ... on AffiliationError {
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
              query: jest.fn().mockReturnValue({ count: 1 }),
              collections,
              transaction: mockedTransaction,
              userKey: user._key,
              auth: {
                checkOrgOwner: jest.fn().mockReturnValue(true),
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    verified: false,
                    slug: 'mocked-org',
                  }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to transfer organization ownership. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Trx commit error occurred for user: 123 when they were attempting to transfer org: mocked-org ownership to user: 456: Error: Commit Error`,
          ])
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
      describe('requested org is undefined', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                transferOrgOwnership (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    userId: "${toGlobalId('users', user2._key)}"
                  }
                ) {
                  result {
                    ... on TransferOrgOwnershipResult {
                      status
                    }
                    ... on AffiliationError {
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
                checkOrgOwner: checkOrgOwner({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResult = {
            data: {
              transferOrgOwnership: {
                result: {
                  code: 400,
                  description:
                    "Impossible de transférer la propriété d'une organisation non définie.",
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to transfer org ownership of an undefined org.`,
          ])
        })
      })
      describe('requested org is verified', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                transferOrgOwnership (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    userId: "${toGlobalId('users', user2._key)}"
                  }
                ) {
                  result {
                    ... on TransferOrgOwnershipResult {
                      status
                    }
                    ... on AffiliationError {
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
                checkOrgOwner: checkOrgOwner({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    verified: true,
                    slug: 'mocked-org',
                  }),
                },
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResult = {
            data: {
              transferOrgOwnership: {
                result: {
                  code: 400,
                  description:
                    "Impossible de transférer la propriété d'une organisation vérifiée.",
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to transfer ownership of a verified org: mocked-org.`,
          ])
        })
      })
      describe('requesting user is not the org owner', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                transferOrgOwnership (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    userId: "${toGlobalId('users', user2._key)}"
                  }
                ) {
                  result {
                    ... on TransferOrgOwnershipResult {
                      status
                    }
                    ... on AffiliationError {
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
                checkOrgOwner: jest.fn().mockReturnValue(false),
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    verified: false,
                    slug: 'mocked-org',
                  }),
                },
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResult = {
            data: {
              transferOrgOwnership: {
                result: {
                  code: 400,
                  description:
                    "Permission refusée : Veuillez contacter le propriétaire de l'org pour transférer la propriété.",
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to transfer org: mocked-org ownership but does not have current ownership.`,
          ])
        })
      })
      describe('requested user is undefined', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                transferOrgOwnership (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    userId: "${toGlobalId('users', user2._key)}"
                  }
                ) {
                  result {
                    ... on TransferOrgOwnershipResult {
                      status
                    }
                    ... on AffiliationError {
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
                checkOrgOwner: jest.fn().mockReturnValue(true),
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    verified: false,
                    slug: 'mocked-org',
                  }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
              validators: { cleanseInput },
            },
          )

          const expectedResult = {
            data: {
              transferOrgOwnership: {
                result: {
                  code: 400,
                  description:
                    "Impossible de transférer la propriété d'un org à un utilisateur non défini.",
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to transfer org: mocked-org ownership to an undefined user.`,
          ])
        })
      })
      describe('requested user does not belong to the requested org', () => {
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                transferOrgOwnership (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    userId: "${toGlobalId('users', user2._key)}"
                  }
                ) {
                  result {
                    ... on TransferOrgOwnershipResult {
                      status
                    }
                    ... on AffiliationError {
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
              query: jest.fn().mockReturnValue({ count: 0 }),
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkOrgOwner: jest.fn().mockReturnValue(true),
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    verified: false,
                    slug: 'mocked-org',
                  }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const expectedResult = {
            data: {
              transferOrgOwnership: {
                result: {
                  code: 400,
                  description:
                    "Impossible de transférer la propriété à un utilisateur extérieur à l'org. Veuillez inviter l'utilisateur et réessayer.",
                },
              },
            },
          }

          expect(response).toEqual(expectedResult)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to transfer org: mocked-org ownership to user: 456 but they are not affiliated with the org.`,
          ])
        })
      })
      describe('database error occurs', () => {
        describe('when checking requested users affiliations', () => {
          it('throws an error', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  transferOrgOwnership (
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                      userId: "${toGlobalId('users', user2._key)}"
                    }
                  ) {
                    result {
                      ... on TransferOrgOwnershipResult {
                        status
                      }
                      ... on AffiliationError {
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
                query: jest.fn().mockRejectedValue(new Error('Database error')),
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                  verifiedRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: false,
                      slug: 'mocked-org',
                    }),
                  },
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: { cleanseInput },
              },
            )

            const error = [
              new GraphQLError(
                "Impossible de transférer la propriété de l'organisation. Veuillez réessayer.",
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Database error occurred for user: 123 when they were attempting to transfer org: mocked-org ownership to user: 456: Error: Database error`,
            ])
          })
        })
      })
      describe('trx step error occurs', () => {
        describe('when removing ownership from requesting user', () => {
          it('throws an error', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest.fn().mockRejectedValue(new Error('Step Error')),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  transferOrgOwnership (
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                      userId: "${toGlobalId('users', user2._key)}"
                    }
                  ) {
                    result {
                      ... on TransferOrgOwnershipResult {
                        status
                      }
                      ... on AffiliationError {
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
                query: jest.fn().mockReturnValue({ count: 1 }),
                collections,
                transaction: mockedTransaction,
                userKey: user._key,
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                  verifiedRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: false,
                      slug: 'mocked-org',
                    }),
                  },
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: { cleanseInput },
              },
            )

            const error = [
              new GraphQLError(
                "Impossible de transférer la propriété de l'organisation. Veuillez réessayer.",
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred for user: 123 when they were attempting to transfer org: mocked-org ownership to user: 456: Error: Step Error`,
            ])
          })
        })
        describe('when adding ownership to requested user', () => {
          it('throws an error', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step: jest
                .fn()
                .mockReturnValueOnce()
                .mockRejectedValue(new Error('Step Error')),
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  transferOrgOwnership (
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                      userId: "${toGlobalId('users', user2._key)}"
                    }
                  ) {
                    result {
                      ... on TransferOrgOwnershipResult {
                        status
                      }
                      ... on AffiliationError {
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
                query: jest.fn().mockReturnValue({ count: 1 }),
                collections,
                transaction: mockedTransaction,
                userKey: user._key,
                auth: {
                  checkOrgOwner: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                  verifiedRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: false,
                      slug: 'mocked-org',
                    }),
                  },
                  loadUserByKey: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: { cleanseInput },
              },
            )

            const error = [
              new GraphQLError(
                "Impossible de transférer la propriété de l'organisation. Veuillez réessayer.",
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Trx step error occurred for user: 123 when they were attempting to transfer org: mocked-org ownership to user: 456: Error: Step Error`,
            ])
          })
        })
      })
      describe('trx commit error occurs', () => {
        it('throws an error', async () => {
          const mockedTransaction = jest.fn().mockReturnValue({
            step: jest.fn().mockReturnValue(),
            commit: jest.fn().mockRejectedValue(new Error('Commit Error')),
          })

          const response = await graphql(
            schema,
            `
              mutation {
                transferOrgOwnership (
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                    userId: "${toGlobalId('users', user2._key)}"
                  }
                ) {
                  result {
                    ... on TransferOrgOwnershipResult {
                      status
                    }
                    ... on AffiliationError {
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
              query: jest.fn().mockReturnValue({ count: 1 }),
              collections,
              transaction: mockedTransaction,
              userKey: user._key,
              auth: {
                checkOrgOwner: jest.fn().mockReturnValue(true),
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    verified: false,
                    slug: 'mocked-org',
                  }),
                },
                loadUserByKey: {
                  load: jest.fn().mockReturnValue({
                    _key: 456,
                  }),
                },
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              "Impossible de transférer la propriété de l'organisation. Veuillez réessayer.",
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Trx commit error occurred for user: 123 when they were attempting to transfer org: mocked-org ownership to user: 456: Error: Commit Error`,
          ])
        })
      })
    })
  })
})
