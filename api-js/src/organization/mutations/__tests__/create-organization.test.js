import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput, slugify } from '../../../validators'
import { userRequired, verifiedRequired } from '../../../auth'
import { loadUserByKey } from '../../../user/loaders'
import { loadOrgBySlug } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url, SIGN_IN_KEY } = process.env

describe('create an organization', () => {
  let query, drop, truncate, schema, collections, transaction, user

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    ;({ query, drop, truncate, collections, transaction } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })
  beforeEach(async () => {
    consoleOutput.length = 0
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      emailValidated: true,
    })
  })
  afterEach(async () => {
    await truncate()
  })
  afterAll(async () => {
    await drop()
  })
  describe('given a successful org creation', () => {
    describe('language is set to english', () => {
      it('returns the organizations information', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              createOrganization(
                input: {
                  acronymEN: "TBS"
                  acronymFR: "SCT"
                  nameEN: "Treasury Board of Canada Secretariat"
                  nameFR: "Secrétariat du Conseil Trésor du Canada"
                  zoneEN: "FED"
                  zoneFR: "FED"
                  sectorEN: "TBS"
                  sectorFR: "TBS"
                  countryEN: "Canada"
                  countryFR: "Canada"
                  provinceEN: "Ontario"
                  provinceFR: "Ontario"
                  cityEN: "Ottawa"
                  cityFR: "Ottawa"
                }
              ) {
                result {
                  ... on Organization {
                    id
                    acronym
                    slug
                    name
                    zone
                    sector
                    country
                    province
                    city
                    verified
                  }
                }
              }
            }
          `,
          null,
          {
            request: {
              language: 'en',
            },
            query,
            collections,
            transaction,
            userKey: user._key,
            auth: {
              userRequired: userRequired({
                userKey: user._key,
                loadUserByKey: loadUserByKey({ query }),
              }),
              verifiedRequired: verifiedRequired({}),
            },
            loaders: {
              loadOrgBySlug: loadOrgBySlug({ query, language: 'en' }),
              loadUserByKey: loadUserByKey({ query }),
            },
            validators: {
              cleanseInput,
              slugify,
            },
          },
        )

        const orgCursor = await query`
          FOR org IN organizations
            FILTER (LOWER("treasury-board-of-canada-secretariat") == LOWER(TRANSLATE("en", org.orgDetails).slug))
            RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, verified: org.verified }, TRANSLATE("en", org.orgDetails))
        `

        const org = await orgCursor.next()

        const expectedResponse = {
          data: {
            createOrganization: {
              result: {
                id: `${toGlobalId('organizations', org._key)}`,
                acronym: org.acronym,
                slug: org.slug,
                name: org.name,
                zone: org.zone,
                sector: org.sector,
                country: org.country,
                province: org.province,
                city: org.city,
                verified: org.verified,
              },
            },
          },
        }

        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully created a new organization: ${org.slug}`,
        ])
      })
    })
    describe('language is set to french', () => {
      it('returns the organizations information', async () => {
        const response = await graphql(
          schema,
          `
            mutation {
              createOrganization(
                input: {
                  acronymEN: "TBS"
                  acronymFR: "SCT"
                  nameEN: "Treasury Board of Canada Secretariat"
                  nameFR: "Secrétariat du Conseil Trésor du Canada"
                  zoneEN: "FED"
                  zoneFR: "FED"
                  sectorEN: "TBS"
                  sectorFR: "TBS"
                  countryEN: "Canada"
                  countryFR: "Canada"
                  provinceEN: "Ontario"
                  provinceFR: "Ontario"
                  cityEN: "Ottawa"
                  cityFR: "Ottawa"
                }
              ) {
                result {
                  ... on Organization {
                    id
                    acronym
                    slug
                    name
                    zone
                    sector
                    country
                    province
                    city
                    verified
                  }
                }
              }
            }
          `,
          null,
          {
            request: {
              language: 'fr',
            },
            query,
            collections,
            transaction,
            userKey: user._key,
            auth: {
              userRequired: userRequired({
                userKey: user._key,
                loadUserByKey: loadUserByKey({ query }),
              }),
              verifiedRequired: verifiedRequired({}),
            },
            loaders: {
              loadOrgBySlug: loadOrgBySlug({ query, language: 'fr' }),
              loadUserByKey: loadUserByKey({ query }),
            },
            validators: {
              cleanseInput,
              slugify,
            },
          },
        )

        const orgCursor = await query`
          FOR org IN organizations
            FILTER (LOWER("secretariat-du-conseil-tresor-du-canada") == LOWER(TRANSLATE("fr", org.orgDetails).slug))
            RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, verified: org.verified }, TRANSLATE("fr", org.orgDetails))
        `

        const org = await orgCursor.next()

        const expectedResponse = {
          data: {
            createOrganization: {
              result: {
                id: `${toGlobalId('organizations', org._key)}`,
                acronym: org.acronym,
                slug: org.slug,
                name: org.name,
                zone: org.zone,
                sector: org.sector,
                country: org.country,
                province: org.province,
                city: org.city,
                verified: org.verified,
              },
            },
          },
        }

        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully created a new organization: treasury-board-of-canada-secretariat`,
        ])
      })
    })
  })
  describe('given an unsuccessful org creation', () => {
    let i18n
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
      describe('organization already exists', () => {
        beforeEach(async () => {
          await collections.organizations.save({
            orgDetails: {
              en: {
                slug: 'treasury-board-of-canada-secretariat',
                acronym: 'TBS',
                name: 'Treasury Board of Canada Secretariat',
                zone: 'FED',
                sector: 'TBS',
                country: 'Canada',
                province: 'Ontario',
                city: 'Ottawa',
              },
              fr: {
                slug: 'secretariat-du-conseil-tresor-du-canada',
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
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                createOrganization(
                  input: {
                    acronymEN: "TBS"
                    acronymFR: "SCT"
                    nameEN: "Treasury Board of Canada Secretariat"
                    nameFR: "Secrétariat du Conseil Trésor du Canada"
                    zoneEN: "FED"
                    zoneFR: "FED"
                    sectorEN: "TBS"
                    sectorFR: "TBS"
                    countryEN: "Canada"
                    countryFR: "Canada"
                    provinceEN: "Ontario"
                    provinceFR: "Ontario"
                    cityEN: "Ottawa"
                    cityFR: "Ottawa"
                  }
                ) {
                  result {
                    ... on Organization {
                      id
                      acronym
                      slug
                      name
                      zone
                      sector
                      country
                      province
                      city
                      verified
                    }
                    ... on OrganizationError {
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
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              loaders: {
                loadOrgBySlug: loadOrgBySlug({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
            },
          )

          const error = {
            data: {
              createOrganization: {
                result: {
                  code: 400,
                  description:
                    'Organization name already in use. Please try again with a different name.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to create an organization that already exists: treasury-board-of-canada-secretariat`,
          ])
        })
      })
      describe('transaction error occurs', () => {
        describe('when inserting organization', () => {
          it('returns an error', async () => {
            const orgLoader = loadOrgBySlug({ query, language: 'en' })
            const userLoader = loadUserByKey({ query })

            const mockedQuery = jest
              .fn()
              .mockRejectedValue(new Error('Database error occurred.'))

            const response = await graphql(
              schema,
              `
                mutation {
                  createOrganization(
                    input: {
                      acronymEN: "TBS"
                      acronymFR: "SCT"
                      nameEN: "Treasury Board of Canada Secretariat"
                      nameFR: "Secrétariat du Conseil Trésor du Canada"
                      zoneEN: "FED"
                      zoneFR: "FED"
                      sectorEN: "TBS"
                      sectorFR: "TBS"
                      countryEN: "Canada"
                      countryFR: "Canada"
                      provinceEN: "Ontario"
                      provinceFR: "Ontario"
                      cityEN: "Ottawa"
                      cityFR: "Ottawa"
                    }
                  ) {
                    result {
                      ... on Organization {
                        id
                        acronym
                        slug
                        name
                        zone
                        sector
                        country
                        province
                        city
                        verified
                      }
                      ... on OrganizationError {
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
                request: {
                  language: 'en',
                },
                query: mockedQuery,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: userLoader,
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                loaders: {
                  loadOrgBySlug: orgLoader,
                  loadUserByKey: userLoader,
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to create organization. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred when user: ${user._key} was creating new organization treasury-board-of-canada-secretariat: Error: Database error occurred.`,
            ])
          })
        })
        describe('when inserting edge', () => {
          it('returns an error message', async () => {
            const orgLoader = loadOrgBySlug({ query, language: 'en' })
            const userLoader = loadUserByKey({ query })

            const mockedQuery = jest
              .fn()
              .mockResolvedValueOnce({
                next() {
                  return 'test'
                },
              })
              .mockRejectedValue(new Error('Database error occurred.'))

            const response = await graphql(
              schema,
              `
                mutation {
                  createOrganization(
                    input: {
                      acronymEN: "TBS"
                      acronymFR: "SCT"
                      nameEN: "Treasury Board of Canada Secretariat"
                      nameFR: "Secrétariat du Conseil Trésor du Canada"
                      zoneEN: "FED"
                      zoneFR: "FED"
                      sectorEN: "TBS"
                      sectorFR: "TBS"
                      countryEN: "Canada"
                      countryFR: "Canada"
                      provinceEN: "Ontario"
                      provinceFR: "Ontario"
                      cityEN: "Ottawa"
                      cityFR: "Ottawa"
                    }
                  ) {
                    result {
                      ... on Organization {
                        id
                        acronym
                        slug
                        name
                        zone
                        sector
                        country
                        province
                        city
                        verified
                      }
                      ... on OrganizationError {
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
                request: {
                  language: 'en',
                },
                query: mockedQuery,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: userLoader,
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                loaders: {
                  loadOrgBySlug: orgLoader,
                  loadUserByKey: userLoader,
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to create organization. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred when inserting edge definition for user: ${user._key} to treasury-board-of-canada-secretariat: Error: Database error occurred.`,
            ])
          })
        })
        describe('when committing information to db', () => {
          it('returns an error message', async () => {
            const orgLoader = loadOrgBySlug({ query, language: 'en' })
            const userLoader = loadUserByKey({ query })

            const mockedTransaction = jest.fn().mockReturnValue({
              step() {
                return {
                  next() {
                    return { _id: 1 }
                  },
                }
              },
              commit() {
                throw new Error('Database error occurred.')
              },
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  createOrganization(
                    input: {
                      acronymEN: "TBS"
                      acronymFR: "SCT"
                      nameEN: "Treasury Board of Canada Secretariat"
                      nameFR: "Secrétariat du Conseil Trésor du Canada"
                      zoneEN: "FED"
                      zoneFR: "FED"
                      sectorEN: "TBS"
                      sectorFR: "TBS"
                      countryEN: "Canada"
                      countryFR: "Canada"
                      provinceEN: "Ontario"
                      provinceFR: "Ontario"
                      cityEN: "Ottawa"
                      cityFR: "Ottawa"
                    }
                  ) {
                    result {
                      ... on Organization {
                        id
                        acronym
                        slug
                        name
                        zone
                        sector
                        country
                        province
                        city
                        verified
                      }
                      ... on OrganizationError {
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
                request: {
                  language: 'en',
                },
                query,
                collections,
                transaction: mockedTransaction,
                userKey: user._key,
                auth: {
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                loaders: {
                  loadOrgBySlug: orgLoader,
                  loadUserByKey: userLoader,
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to create organization. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred when committing new organization: treasury-board-of-canada-secretariat for user: ${user._key} to db: Error: Database error occurred.`,
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
      describe('organization already exists', () => {
        beforeEach(async () => {
          await collections.organizations.save({
            orgDetails: {
              en: {
                slug: 'treasury-board-of-canada-secretariat',
                acronym: 'TBS',
                name: 'Treasury Board of Canada Secretariat',
                zone: 'FED',
                sector: 'TBS',
                country: 'Canada',
                province: 'Ontario',
                city: 'Ottawa',
              },
              fr: {
                slug: 'secretariat-du-conseil-tresor-du-canada',
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
        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                createOrganization(
                  input: {
                    acronymEN: "TBS"
                    acronymFR: "SCT"
                    nameEN: "Treasury Board of Canada Secretariat"
                    nameFR: "Secrétariat du Conseil Trésor du Canada"
                    zoneEN: "FED"
                    zoneFR: "FED"
                    sectorEN: "TBS"
                    sectorFR: "TBS"
                    countryEN: "Canada"
                    countryFR: "Canada"
                    provinceEN: "Ontario"
                    provinceFR: "Ontario"
                    cityEN: "Ottawa"
                    cityFR: "Ottawa"
                  }
                ) {
                  result {
                    ... on Organization {
                      id
                      acronym
                      slug
                      name
                      zone
                      sector
                      country
                      province
                      city
                      verified
                    }
                    ... on OrganizationError {
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
              request: {
                language: 'en',
              },
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              loaders: {
                loadOrgBySlug: loadOrgBySlug({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
              validators: {
                cleanseInput,
                slugify,
              },
            },
          )

          const error = {
            data: {
              createOrganization: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to create an organization that already exists: treasury-board-of-canada-secretariat`,
          ])
        })
      })
      describe('transaction error occurs', () => {
        describe('when inserting organization', () => {
          it('returns an error', async () => {
            const orgLoader = loadOrgBySlug({ query, language: 'en' })
            const userLoader = loadUserByKey({ query })

            const mockedQuery = jest
              .fn()
              .mockRejectedValue(new Error('Database error occurred.'))

            const response = await graphql(
              schema,
              `
                mutation {
                  createOrganization(
                    input: {
                      acronymEN: "TBS"
                      acronymFR: "SCT"
                      nameEN: "Treasury Board of Canada Secretariat"
                      nameFR: "Secrétariat du Conseil Trésor du Canada"
                      zoneEN: "FED"
                      zoneFR: "FED"
                      sectorEN: "TBS"
                      sectorFR: "TBS"
                      countryEN: "Canada"
                      countryFR: "Canada"
                      provinceEN: "Ontario"
                      provinceFR: "Ontario"
                      cityEN: "Ottawa"
                      cityFR: "Ottawa"
                    }
                  ) {
                    result {
                      ... on Organization {
                        id
                        acronym
                        slug
                        name
                        zone
                        sector
                        country
                        province
                        city
                        verified
                      }
                      ... on OrganizationError {
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
                request: {
                  language: 'en',
                },
                query: mockedQuery,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: userLoader,
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                loaders: {
                  loadOrgBySlug: orgLoader,
                  loadUserByKey: userLoader,
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred when user: ${user._key} was creating new organization treasury-board-of-canada-secretariat: Error: Database error occurred.`,
            ])
          })
        })
        describe('when inserting edge', () => {
          it('returns an error message', async () => {
            const orgLoader = loadOrgBySlug({ query, language: 'en' })
            const userLoader = loadUserByKey({ query })

            const mockedQuery = jest
              .fn()
              .mockResolvedValueOnce({
                next() {
                  return 'test'
                },
              })
              .mockRejectedValue(new Error('Database error occurred.'))

            const response = await graphql(
              schema,
              `
                mutation {
                  createOrganization(
                    input: {
                      acronymEN: "TBS"
                      acronymFR: "SCT"
                      nameEN: "Treasury Board of Canada Secretariat"
                      nameFR: "Secrétariat du Conseil Trésor du Canada"
                      zoneEN: "FED"
                      zoneFR: "FED"
                      sectorEN: "TBS"
                      sectorFR: "TBS"
                      countryEN: "Canada"
                      countryFR: "Canada"
                      provinceEN: "Ontario"
                      provinceFR: "Ontario"
                      cityEN: "Ottawa"
                      cityFR: "Ottawa"
                    }
                  ) {
                    result {
                      ... on Organization {
                        id
                        acronym
                        slug
                        name
                        zone
                        sector
                        country
                        province
                        city
                        verified
                      }
                      ... on OrganizationError {
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
                request: {
                  language: 'en',
                },
                query: mockedQuery,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: userLoader,
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                loaders: {
                  loadOrgBySlug: orgLoader,
                  loadUserByKey: userLoader,
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred when inserting edge definition for user: ${user._key} to treasury-board-of-canada-secretariat: Error: Database error occurred.`,
            ])
          })
        })
        describe('when committing information to db', () => {
          it('returns an error message', async () => {
            const orgLoader = loadOrgBySlug({ query, language: 'en' })
            const userLoader = loadUserByKey({ query })

            const mockedTransaction = jest.fn().mockReturnValue({
              step() {
                return {
                  next() {
                    return { _id: 1 }
                  },
                }
              },
              commit() {
                throw new Error('Database error occurred.')
              },
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  createOrganization(
                    input: {
                      acronymEN: "TBS"
                      acronymFR: "SCT"
                      nameEN: "Treasury Board of Canada Secretariat"
                      nameFR: "Secrétariat du Conseil Trésor du Canada"
                      zoneEN: "FED"
                      zoneFR: "FED"
                      sectorEN: "TBS"
                      sectorFR: "TBS"
                      countryEN: "Canada"
                      countryFR: "Canada"
                      provinceEN: "Ontario"
                      provinceFR: "Ontario"
                      cityEN: "Ottawa"
                      cityFR: "Ottawa"
                    }
                  ) {
                    result {
                      ... on Organization {
                        id
                        acronym
                        slug
                        name
                        zone
                        sector
                        country
                        province
                        city
                        verified
                      }
                      ... on OrganizationError {
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
                request: {
                  language: 'en',
                },
                query,
                collections,
                transaction: mockedTransaction,
                userKey: user._key,
                auth: {
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                loaders: {
                  loadOrgBySlug: orgLoader,
                  loadUserByKey: userLoader,
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred when committing new organization: treasury-board-of-canada-secretariat for user: ${user._key} to db: Error: Database error occurred.`,
            ])
          })
        })
      })
    })
  })
})
