import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { setupI18n } from '@lingui/core'
import { v4 as uuidv4 } from 'uuid'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { checkDomainPermission, userRequired } from '../../../auth'
import { domainLoaderByDomain } from '../../loaders'
import { userLoaderByKey } from '../../../user/loaders'
import { cleanseInput } from '../../../validators'

require('jest-fetch-mock').enableFetchMocks()

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('requesting a one time scan', () => {
  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  let query,
    drop,
    truncate,
    migrate,
    schema,
    collections,
    i18n,
    org,
    user,
    domain,
    org2

  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
  })

  beforeEach(async () => {
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
    })
    org = await collections.organizations.save({
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
    domain = await collections.domains.save({
      domain: 'test.gc.ca',
      slug: 'test-gc-ca',
      lastRan: null,
      selectors: ['selector1', 'selector2'],
    })
    await collections.claims.save({
      _to: domain._id,
      _from: org._id,
    })
  })

  afterEach(async () => {
    consoleOutput.length = 0
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
    describe('given a successful request', () => {
      let mockUUID
      beforeEach(() => {
        fetch.mockResponseOnce(JSON.stringify({ data: '12345' }))
        mockUUID = jest.fn().mockReturnValue('uuid-token-1234')
      })
      describe('user is a super admin', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: 'organizations/SA',
            _to: user._id,
            permission: 'super_admin',
          })
        })
        it('returns a subscriptionId', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                requestScan(input: { domain: "test.gc.ca" }) {
                  subscriptionId
                }
              }
            `,
            null,
            {
              i18n,
              fetch,
              userKey: user._key,
              uuidv4: mockUUID,
              auth: {
                checkDomainPermission: checkDomainPermission({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(
                  query,
                  user._key,
                  i18n,
                ),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResponse = {
            data: {
              requestScan: {
                subscriptionId: 'uuid-token-1234',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully dispatched a one time scan on domain: test.gc.ca.`,
          ])
        })
        it('returns a status message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                requestScan(input: { domain: "test.gc.ca" }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              fetch,
              userKey: user._key,
              uuidv4: mockUUID,
              auth: {
                checkDomainPermission: checkDomainPermission({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(
                  query,
                  user._key,
                  i18n,
                ),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResponse = {
            data: {
              requestScan: {
                status: 'Successfully dispatched one time scan.',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully dispatched a one time scan on domain: test.gc.ca.`,
          ])
        })
      })
      describe('user is an org admin', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        it('returns a subscriptionId', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                requestScan(input: { domain: "test.gc.ca" }) {
                  subscriptionId
                }
              }
            `,
            null,
            {
              i18n,
              fetch,
              userKey: user._key,
              uuidv4: mockUUID,
              auth: {
                checkDomainPermission: checkDomainPermission({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(
                  query,
                  user._key,
                  i18n,
                ),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResponse = {
            data: {
              requestScan: {
                subscriptionId: 'uuid-token-1234',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully dispatched a one time scan on domain: test.gc.ca.`,
          ])
        })
        it('returns a status message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                requestScan(input: { domain: "test.gc.ca" }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              fetch,
              userKey: user._key,
              uuidv4: mockUUID,
              auth: {
                checkDomainPermission: checkDomainPermission({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(
                  query,
                  user._key,
                  i18n,
                ),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResponse = {
            data: {
              requestScan: {
                status: 'Successfully dispatched one time scan.',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully dispatched a one time scan on domain: test.gc.ca.`,
          ])
        })
      })
      describe('user is an org user', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
        })
        it('returns a subscriptionId', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                requestScan(input: { domain: "test.gc.ca" }) {
                  subscriptionId
                }
              }
            `,
            null,
            {
              i18n,
              fetch,
              userKey: user._key,
              uuidv4: mockUUID,
              auth: {
                checkDomainPermission: checkDomainPermission({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(
                  query,
                  user._key,
                  i18n,
                ),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResponse = {
            data: {
              requestScan: {
                subscriptionId: 'uuid-token-1234',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully dispatched a one time scan on domain: test.gc.ca.`,
          ])
        })
        it('returns a status message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                requestScan(input: { domain: "test.gc.ca" }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              fetch,
              userKey: user._key,
              uuidv4: mockUUID,
              auth: {
                checkDomainPermission: checkDomainPermission({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(
                  query,
                  user._key,
                  i18n,
                ),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResponse = {
            data: {
              requestScan: {
                status: 'Successfully dispatched one time scan.',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully dispatched a one time scan on domain: test.gc.ca.`,
          ])
        })
      })
    })
    describe('given an unsuccessful request', () => {
      describe('domain cannot be found', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                requestScan(input: { domain: "test-domain.gc.ca" }) {
                  subscriptionId
                }
              }
            `,
            null,
            {
              i18n,
              fetch,
              userKey: user._key,
              uuidv4,
              auth: {
                checkDomainPermission: checkDomainPermission({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(
                  query,
                  user._key,
                  i18n,
                ),
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to request a on time scan on this domain.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to run a one time scan on: test-domain.gc.ca however domain cannot be found.`,
          ])
        })
      })
      describe('user does not have domain permission', () => {
        beforeEach(async () => {
          org2 = await collections.organizations.save({
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
        })
        describe('user is admin to another org', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org2._id,
              _to: user._id,
              permission: 'admin',
            })
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  requestScan(input: { domain: "test.gc.ca" }) {
                    subscriptionId
                  }
                }
              `,
              null,
              {
                i18n,
                fetch,
                userKey: user._key,
                uuidv4,
                auth: {
                  checkDomainPermission: checkDomainPermission({
                    i18n,
                    query,
                    userKey: user._key,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                  }),
                },
                loaders: {
                  domainLoaderByDomain: domainLoaderByDomain(
                    query,
                    user._key,
                    i18n,
                  ),
                },
                validators: { cleanseInput },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to request a on time scan on this domain.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to run a one time scan on: test.gc.ca however they do not have permission to do so.`,
            ])
          })
        })
        describe('user is a user in another org', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org2._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  requestScan(input: { domain: "test.gc.ca" }) {
                    subscriptionId
                  }
                }
              `,
              null,
              {
                i18n,
                fetch,
                userKey: user._key,
                uuidv4,
                auth: {
                  checkDomainPermission: checkDomainPermission({
                    i18n,
                    query,
                    userKey: user._key,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                  }),
                },
                loaders: {
                  domainLoaderByDomain: domainLoaderByDomain(
                    query,
                    user._key,
                    i18n,
                  ),
                },
                validators: { cleanseInput },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to request a on time scan on this domain.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to run a one time scan on: test.gc.ca however they do not have permission to do so.`,
            ])
          })
        })
      })
      describe('fetch error occurs', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
        })
        describe('when sending dns scan request', () => {
          beforeEach(() => {
            const fetch = fetchMock
            fetch.mockRejectOnce(Error('Fetch Error occurred.'))
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  requestScan(input: { domain: "test.gc.ca" }) {
                    subscriptionId
                  }
                }
              `,
              null,
              {
                i18n,
                fetch,
                userKey: user._key,
                uuidv4,
                auth: {
                  checkDomainPermission: checkDomainPermission({
                    i18n,
                    query,
                    userKey: user._key,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                  }),
                },
                loaders: {
                  domainLoaderByDomain: domainLoaderByDomain(
                    query,
                    user._key,
                    i18n,
                  ),
                },
                validators: { cleanseInput },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to dispatch one time scan. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Fetch error when dispatching dns scan for user: ${user._key}, on domain: test.gc.ca, error: Error: Fetch Error occurred.`,
            ])
          })
        })
        describe('when sending https scan request', () => {
          beforeEach(() => {
            const fetch = fetchMock
            fetch
              .mockResponseOnce(JSON.stringify({ data: '12345' }))
              .mockRejectOnce(Error('Fetch Error occurred.'))
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  requestScan(input: { domain: "test.gc.ca" }) {
                    subscriptionId
                  }
                }
              `,
              null,
              {
                i18n,
                fetch,
                userKey: user._key,
                uuidv4,
                auth: {
                  checkDomainPermission: checkDomainPermission({
                    i18n,
                    query,
                    userKey: user._key,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                  }),
                },
                loaders: {
                  domainLoaderByDomain: domainLoaderByDomain(
                    query,
                    user._key,
                    i18n,
                  ),
                },
                validators: { cleanseInput },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to dispatch one time scan. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Fetch error when dispatching https scan for user: ${user._key}, on domain: test.gc.ca, error: Error: Fetch Error occurred.`,
            ])
          })
        })
        describe('when sending ssl scan request', () => {
          beforeEach(() => {
            const fetch = fetchMock
            fetch
              .mockResponseOnce(JSON.stringify({ data: '12345' }))
              .mockResponseOnce(JSON.stringify({ data: '12345' }))
              .mockRejectOnce(Error('Fetch Error occurred.'))
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  requestScan(input: { domain: "test.gc.ca" }) {
                    subscriptionId
                  }
                }
              `,
              null,
              {
                i18n,
                fetch,
                userKey: user._key,
                uuidv4,
                auth: {
                  checkDomainPermission: checkDomainPermission({
                    i18n,
                    query,
                    userKey: user._key,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                  }),
                },
                loaders: {
                  domainLoaderByDomain: domainLoaderByDomain(
                    query,
                    user._key,
                    i18n,
                  ),
                },
                validators: { cleanseInput },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to dispatch one time scan. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Fetch error when dispatching ssl scan for user: ${user._key}, on domain: test.gc.ca, error: Error: Fetch Error occurred.`,
            ])
          })
        })
      })
    })
  })
  describe('users langue is set to french', () => {
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
    describe('given a successful request', () => {
      let mockUUID
      beforeEach(() => {
        const fetch = fetchMock
        fetch.mockResponseOnce(JSON.stringify({ data: '12345' }))
        mockUUID = jest.fn().mockReturnValue('uuid-token-1234')
      })
      describe('user is a super admin', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: 'organizations/SA',
            _to: user._id,
            permission: 'super_admin',
          })
        })
        it('returns a subscriptionId', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                requestScan(input: { domain: "test.gc.ca" }) {
                  subscriptionId
                }
              }
            `,
            null,
            {
              i18n,
              fetch,
              userKey: user._key,
              uuidv4: mockUUID,
              auth: {
                checkDomainPermission: checkDomainPermission({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(
                  query,
                  user._key,
                  i18n,
                ),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResponse = {
            data: {
              requestScan: {
                subscriptionId: 'uuid-token-1234',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully dispatched a one time scan on domain: test.gc.ca.`,
          ])
        })
        it('returns a status message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                requestScan(input: { domain: "test.gc.ca" }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              fetch,
              userKey: user._key,
              uuidv4: mockUUID,
              auth: {
                checkDomainPermission: checkDomainPermission({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(
                  query,
                  user._key,
                  i18n,
                ),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResponse = {
            data: {
              requestScan: {
                status: 'todo',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully dispatched a one time scan on domain: test.gc.ca.`,
          ])
        })
      })
      describe('user is an org admin', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        it('returns a subscriptionId', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                requestScan(input: { domain: "test.gc.ca" }) {
                  subscriptionId
                }
              }
            `,
            null,
            {
              i18n,
              fetch,
              userKey: user._key,
              uuidv4: mockUUID,
              auth: {
                checkDomainPermission: checkDomainPermission({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(
                  query,
                  user._key,
                  i18n,
                ),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResponse = {
            data: {
              requestScan: {
                subscriptionId: 'uuid-token-1234',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully dispatched a one time scan on domain: test.gc.ca.`,
          ])
        })
        it('returns a status message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                requestScan(input: { domain: "test.gc.ca" }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              fetch,
              userKey: user._key,
              uuidv4: mockUUID,
              auth: {
                checkDomainPermission: checkDomainPermission({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(
                  query,
                  user._key,
                  i18n,
                ),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResponse = {
            data: {
              requestScan: {
                status: 'todo',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully dispatched a one time scan on domain: test.gc.ca.`,
          ])
        })
      })
      describe('user is an org user', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
        })
        it('returns a subscriptionId', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                requestScan(input: { domain: "test.gc.ca" }) {
                  subscriptionId
                }
              }
            `,
            null,
            {
              i18n,
              fetch,
              userKey: user._key,
              uuidv4: mockUUID,
              auth: {
                checkDomainPermission: checkDomainPermission({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(
                  query,
                  user._key,
                  i18n,
                ),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResponse = {
            data: {
              requestScan: {
                subscriptionId: 'uuid-token-1234',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully dispatched a one time scan on domain: test.gc.ca.`,
          ])
        })
        it('returns a status message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                requestScan(input: { domain: "test.gc.ca" }) {
                  status
                }
              }
            `,
            null,
            {
              i18n,
              fetch,
              userKey: user._key,
              uuidv4: mockUUID,
              auth: {
                checkDomainPermission: checkDomainPermission({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(
                  query,
                  user._key,
                  i18n,
                ),
              },
              validators: { cleanseInput },
            },
          )

          const expectedResponse = {
            data: {
              requestScan: {
                status: 'todo',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key} successfully dispatched a one time scan on domain: test.gc.ca.`,
          ])
        })
      })
    })
    describe('given an unsuccessful request', () => {
      describe('domain cannot be found', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                requestScan(input: { domain: "test-domain.gc.ca" }) {
                  subscriptionId
                }
              }
            `,
            null,
            {
              i18n,
              fetch,
              userKey: user._key,
              uuidv4,
              auth: {
                checkDomainPermission: checkDomainPermission({
                  i18n,
                  query,
                  userKey: user._key,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                }),
              },
              loaders: {
                domainLoaderByDomain: domainLoaderByDomain(
                  query,
                  user._key,
                  i18n,
                ),
              },
              validators: { cleanseInput },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to run a one time scan on: test-domain.gc.ca however domain cannot be found.`,
          ])
        })
      })
      describe('user does not have domain permission', () => {
        beforeEach(async () => {
          org2 = await collections.organizations.save({
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
        })
        describe('user is admin to another org', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org2._id,
              _to: user._id,
              permission: 'admin',
            })
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  requestScan(input: { domain: "test.gc.ca" }) {
                    subscriptionId
                  }
                }
              `,
              null,
              {
                i18n,
                fetch,
                userKey: user._key,
                uuidv4,
                auth: {
                  checkDomainPermission: checkDomainPermission({
                    i18n,
                    query,
                    userKey: user._key,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                  }),
                },
                loaders: {
                  domainLoaderByDomain: domainLoaderByDomain(
                    query,
                    user._key,
                    i18n,
                  ),
                },
                validators: { cleanseInput },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to run a one time scan on: test.gc.ca however they do not have permission to do so.`,
            ])
          })
        })
        describe('user is a user in another org', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org2._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  requestScan(input: { domain: "test.gc.ca" }) {
                    subscriptionId
                  }
                }
              `,
              null,
              {
                i18n,
                fetch,
                userKey: user._key,
                uuidv4,
                auth: {
                  checkDomainPermission: checkDomainPermission({
                    i18n,
                    query,
                    userKey: user._key,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                  }),
                },
                loaders: {
                  domainLoaderByDomain: domainLoaderByDomain(
                    query,
                    user._key,
                    i18n,
                  ),
                },
                validators: { cleanseInput },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to run a one time scan on: test.gc.ca however they do not have permission to do so.`,
            ])
          })
        })
      })
      describe('fetch error occurs', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
        })
        describe('when sending dns scan request', () => {
          beforeEach(() => {
            const fetch = fetchMock
            fetch.mockRejectOnce(Error('Fetch Error occurred.'))
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  requestScan(input: { domain: "test.gc.ca" }) {
                    subscriptionId
                  }
                }
              `,
              null,
              {
                i18n,
                fetch,
                userKey: user._key,
                uuidv4,
                auth: {
                  checkDomainPermission: checkDomainPermission({
                    i18n,
                    query,
                    userKey: user._key,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                  }),
                },
                loaders: {
                  domainLoaderByDomain: domainLoaderByDomain(
                    query,
                    user._key,
                    i18n,
                  ),
                },
                validators: { cleanseInput },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Fetch error when dispatching dns scan for user: ${user._key}, on domain: test.gc.ca, error: Error: Fetch Error occurred.`,
            ])
          })
        })
        describe('when sending https scan request', () => {
          beforeEach(() => {
            const fetch = fetchMock
            fetch
              .mockResponseOnce(JSON.stringify({ data: '12345' }))
              .mockRejectOnce(Error('Fetch Error occurred.'))
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  requestScan(input: { domain: "test.gc.ca" }) {
                    subscriptionId
                  }
                }
              `,
              null,
              {
                i18n,
                fetch,
                userKey: user._key,
                uuidv4,
                auth: {
                  checkDomainPermission: checkDomainPermission({
                    i18n,
                    query,
                    userKey: user._key,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                  }),
                },
                loaders: {
                  domainLoaderByDomain: domainLoaderByDomain(
                    query,
                    user._key,
                    i18n,
                  ),
                },
                validators: { cleanseInput },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Fetch error when dispatching https scan for user: ${user._key}, on domain: test.gc.ca, error: Error: Fetch Error occurred.`,
            ])
          })
        })
        describe('when sending ssl scan request', () => {
          beforeEach(() => {
            const fetch = fetchMock
            fetch
              .mockResponseOnce(JSON.stringify({ data: '12345' }))
              .mockResponseOnce(JSON.stringify({ data: '12345' }))
              .mockRejectOnce(Error('Fetch Error occurred.'))
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  requestScan(input: { domain: "test.gc.ca" }) {
                    subscriptionId
                  }
                }
              `,
              null,
              {
                i18n,
                fetch,
                userKey: user._key,
                uuidv4,
                auth: {
                  checkDomainPermission: checkDomainPermission({
                    i18n,
                    query,
                    userKey: user._key,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                  }),
                },
                loaders: {
                  domainLoaderByDomain: domainLoaderByDomain(
                    query,
                    user._key,
                    i18n,
                  ),
                },
                validators: { cleanseInput },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Fetch error when dispatching ssl scan for user: ${user._key}, on domain: test.gc.ca, error: Error: Fetch Error occurred.`,
            ])
          })
        })
      })
    })
  })
})
