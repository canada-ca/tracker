import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { checkSuperAdmin, userRequired } from '../../../auth'
import { userLoaderByKey } from '../../../user/loaders'
import { orgLoaderConnectionsByUserId } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findMyOrganizationsQuery', () => {
  let query,
    drop,
    truncate,
    migrate,
    schema,
    collections,
    orgOne,
    orgTwo,
    i18n,
    user

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

    user = await collections.users.save({
      displayName: 'Test Account',
      userName: 'test.account@istio.actually.exists',
      preferredLang: 'french',
    })

    orgOne = await collections.organizations.save({
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
    orgTwo = await collections.organizations.save({
      orgDetails: {
        en: {
          slug: 'not-treasury-board-secretariat',
          acronym: 'NTBS',
          name: 'Not Treasury Board of Canada Secretariat',
          zone: 'NFED',
          sector: 'NTBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'ne-pas-secretariat-conseil-tresor',
          acronym: 'NPSCT',
          name: 'Ne Pas Secrétariat du Conseil Trésor du Canada',
          zone: 'NPFED',
          sector: 'NPTBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
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
    beforeEach(async () => {
      await collections.affiliations.save({
        _from: orgOne._id,
        _to: user._id,
        permission: 'user',
      })
      await collections.affiliations.save({
        _from: orgTwo._id,
        _to: user._id,
        permission: 'user',
      })
    })
    describe('given successful retrieval of domains', () => {
      describe('user queries for their organizations', () => {
        describe('in english', () => {
          it('returns organizations', async () => {
            const response = await graphql(
              schema,
              `
                query {
                  findMyOrganizations(first: 5) {
                    edges {
                      cursor
                      node {
                        id
                        acronym
                        name
                        slug
                        zone
                        sector
                        country
                        province
                        city
                      }
                    }
                    totalCount
                    pageInfo {
                      hasNextPage
                      hasPreviousPage
                      startCursor
                      endCursor
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                userKey: user._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                  }),
                },
                loaders: {
                  orgLoaderConnectionsByUserId: orgLoaderConnectionsByUserId(
                    query,
                    user._key,
                    cleanseInput,
                    'en',
                  ),
                },
              },
            )

            const expectedResponse = {
              data: {
                findMyOrganizations: {
                  edges: [
                    {
                      cursor: toGlobalId('organizations', orgOne._key),
                      node: {
                        id: toGlobalId('organizations', orgOne._key),
                        slug: 'treasury-board-secretariat',
                        acronym: 'TBS',
                        name: 'Treasury Board of Canada Secretariat',
                        zone: 'FED',
                        sector: 'TBS',
                        country: 'Canada',
                        province: 'Ontario',
                        city: 'Ottawa',
                      },
                    },
                    {
                      cursor: toGlobalId('organizations', orgTwo._key),
                      node: {
                        id: toGlobalId('organizations', orgTwo._key),
                        slug: 'not-treasury-board-secretariat',
                        acronym: 'NTBS',
                        name: 'Not Treasury Board of Canada Secretariat',
                        zone: 'NFED',
                        sector: 'NTBS',
                        country: 'Canada',
                        province: 'Ontario',
                        city: 'Ottawa',
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    endCursor: toGlobalId('organizations', orgTwo._key),
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: toGlobalId('organizations', orgOne._key),
                  },
                },
              },
            }
            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User ${user._key} successfully retrieved their organizations.`,
            ])
          })
        })
      })
    })
    describe('database error occurs', () => {
      it('returns an error message', async () => {
        const mockedOrgLoaderConnectionsByUserId = jest
          .fn()
          .mockRejectedValueOnce(new Error('Database error occurred.'))

        const response = await graphql(
          schema,
          `
            query {
              findMyOrganizations(first: 5) {
                edges {
                  cursor
                  node {
                    id
                    acronym
                    name
                    slug
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
                pageInfo {
                  hasNextPage
                  hasPreviousPage
                  startCursor
                  endCursor
                }
              }
            }
          `,
          null,
          {
            i18n,
            userKey: user._key,
            auth: {
              checkSuperAdmin: jest.fn(),
              userRequired: jest.fn(),
            },
            loaders: {
              orgLoaderConnectionsByUserId: mockedOrgLoaderConnectionsByUserId,
            },
          },
        )

        const error = [
          new GraphQLError('Unable to load organizations. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to gather organization connections in findMyOrganizations.`,
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
    beforeEach(async () => {
      await collections.affiliations.save({
        _from: orgOne._id,
        _to: user._id,
        permission: 'user',
      })
      await collections.affiliations.save({
        _from: orgTwo._id,
        _to: user._id,
        permission: 'user',
      })
    })
    describe('given successful retrieval of domains', () => {
      describe('user queries for their organizations', () => {
        describe('in french', () => {
          it('returns organizations', async () => {
            const response = await graphql(
              schema,
              `
                query {
                  findMyOrganizations(first: 5) {
                    edges {
                      cursor
                      node {
                        id
                        acronym
                        name
                        slug
                        zone
                        sector
                        country
                        province
                        city
                      }
                    }
                    totalCount
                    pageInfo {
                      hasNextPage
                      hasPreviousPage
                      startCursor
                      endCursor
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                userKey: user._key,
                auth: {
                  checkSuperAdmin: checkSuperAdmin({
                    i18n,
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                  }),
                },
                loaders: {
                  orgLoaderConnectionsByUserId: orgLoaderConnectionsByUserId(
                    query,
                    user._key,
                    cleanseInput,
                    'fr',
                  ),
                },
              },
            )

            const expectedResponse = {
              data: {
                findMyOrganizations: {
                  edges: [
                    {
                      cursor: toGlobalId('organizations', orgOne._key),
                      node: {
                        id: toGlobalId('organizations', orgOne._key),
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
                    {
                      cursor: toGlobalId('organizations', orgTwo._key),
                      node: {
                        id: toGlobalId('organizations', orgTwo._key),
                        slug: 'ne-pas-secretariat-conseil-tresor',
                        acronym: 'NPSCT',
                        name: 'Ne Pas Secrétariat du Conseil Trésor du Canada',
                        zone: 'NPFED',
                        sector: 'NPTBS',
                        country: 'Canada',
                        province: 'Ontario',
                        city: 'Ottawa',
                      },
                    },
                  ],
                  totalCount: 2,
                  pageInfo: {
                    endCursor: toGlobalId('organizations', orgTwo._key),
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: toGlobalId('organizations', orgOne._key),
                  },
                },
              },
            }
            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User ${user._key} successfully retrieved their organizations.`,
            ])
          })
        })
      })
    })
    describe('database error occurs', () => {
      it('returns an error message', async () => {
        const mockedOrgLoaderConnectionsByUserId = jest
          .fn()
          .mockRejectedValueOnce(new Error('Database error occurred.'))

        const response = await graphql(
          schema,
          `
            query {
              findMyOrganizations(first: 5) {
                edges {
                  cursor
                  node {
                    id
                    acronym
                    name
                    slug
                    zone
                    sector
                    country
                    province
                    city
                  }
                }
                pageInfo {
                  hasNextPage
                  hasPreviousPage
                  startCursor
                  endCursor
                }
              }
            }
          `,
          null,
          {
            i18n,
            userKey: user._key,
            auth: {
              checkSuperAdmin: jest.fn(),
              userRequired: jest.fn(),
            },
            loaders: {
              orgLoaderConnectionsByUserId: mockedOrgLoaderConnectionsByUserId,
            },
          },
        )

        const error = [new GraphQLError('todo')]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to gather organization connections in findMyOrganizations.`,
        ])
      })
    })
  })
})
