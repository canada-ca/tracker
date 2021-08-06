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

  describe('given a successful org creation', () => {
    beforeEach(async () => {
      ;({ query, drop, truncate, collections, transaction } = await ensure({
        type: 'database',
        name: dbNameFromFile(__filename),
        url,
        rootPassword: rootPass,
        options: databaseOptions({ rootPass }),
      }))
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
                id: `${toGlobalId('organization', org._key)}`,
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
                id: `${toGlobalId('organization', org._key)}`,
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
              userKey: 123,
              auth: {
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgBySlug: {
                  loadMany: jest.fn().mockReturnValue([{}, undefined]),
                },
                loadUserByKey: jest.fn(),
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
            `User: 123 attempted to create an organization that already exists: treasury-board-of-canada-secretariat`,
          ])
        })
      })
      describe('transaction error occurs', () => {
        describe('when inserting organization', () => {
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
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockRejectedValue(new Error('trx step error')),
                }),
                userKey: 123,
                auth: {
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                  verifiedRequired: jest.fn(),
                },
                loaders: {
                  loadOrgBySlug: {
                    loadMany: jest.fn().mockReturnValue([undefined, undefined]),
                  },
                  loadUserByKey: jest.fn(),
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
              `Transaction error occurred when user: 123 was creating new organization treasury-board-of-canada-secretariat: Error: trx step error`,
            ])
          })
        })
        describe('when inserting edge', () => {
          it('returns an error message', async () => {
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
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockReturnValueOnce({ next: jest.fn() })
                    .mockRejectedValue(new Error('trx step error')),
                }),
                userKey: 123,
                auth: {
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                  verifiedRequired: jest.fn(),
                },
                loaders: {
                  loadOrgBySlug: {
                    loadMany: jest.fn().mockReturnValue([undefined, undefined]),
                  },
                  loadUserByKey: jest.fn(),
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
              `Transaction error occurred when inserting edge definition for user: 123 to treasury-board-of-canada-secretariat: Error: trx step error`,
            ])
          })
        })
        describe('when committing information to db', () => {
          it('returns an error message', async () => {
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
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({ next: jest.fn() }),
                  commit: jest
                    .fn()
                    .mockRejectedValue(new Error('trx commit error')),
                }),
                userKey: 123,
                auth: {
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                  verifiedRequired: jest.fn(),
                },
                loaders: {
                  loadOrgBySlug: {
                    loadMany: jest.fn().mockReturnValue([undefined, undefined]),
                  },
                  loadUserByKey: jest.fn(),
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
              `Transaction error occurred when committing new organization: treasury-board-of-canada-secretariat for user: 123 to db: Error: trx commit error`,
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
              userKey: 123,
              auth: {
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
                verifiedRequired: jest.fn(),
              },
              loaders: {
                loadOrgBySlug: {
                  loadMany: jest.fn().mockReturnValue([{}, undefined]),
                },
                loadUserByKey: jest.fn(),
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
                    "Le nom de l'organisation est déjà utilisé. Veuillez réessayer avec un nom différent.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to create an organization that already exists: treasury-board-of-canada-secretariat`,
          ])
        })
      })
      describe('transaction error occurs', () => {
        describe('when inserting organization', () => {
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
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockRejectedValue(new Error('trx step error')),
                }),
                userKey: 123,
                auth: {
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                  verifiedRequired: jest.fn(),
                },
                loaders: {
                  loadOrgBySlug: {
                    loadMany: jest.fn().mockReturnValue([undefined, undefined]),
                  },
                  loadUserByKey: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de créer une organisation. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred when user: 123 was creating new organization treasury-board-of-canada-secretariat: Error: trx step error`,
            ])
          })
        })
        describe('when inserting edge', () => {
          it('returns an error message', async () => {
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
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockReturnValueOnce({ next: jest.fn() })
                    .mockRejectedValue(new Error('trx step error')),
                }),
                userKey: 123,
                auth: {
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                  verifiedRequired: jest.fn(),
                },
                loaders: {
                  loadOrgBySlug: {
                    loadMany: jest.fn().mockReturnValue([undefined, undefined]),
                  },
                  loadUserByKey: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de créer une organisation. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred when inserting edge definition for user: 123 to treasury-board-of-canada-secretariat: Error: trx step error`,
            ])
          })
        })
        describe('when committing information to db', () => {
          it('returns an error message', async () => {
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
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({ next: jest.fn() }),
                  commit: jest
                    .fn()
                    .mockRejectedValue(new Error('trx commit error')),
                }),
                userKey: 123,
                auth: {
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                  verifiedRequired: jest.fn(),
                },
                loaders: {
                  loadOrgBySlug: {
                    loadMany: jest.fn().mockReturnValue([undefined, undefined]),
                  },
                  loadUserByKey: jest.fn(),
                },
                validators: {
                  cleanseInput,
                  slugify,
                },
              },
            )

            const error = [
              new GraphQLError(
                'Impossible de créer une organisation. Veuillez réessayer.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred when committing new organization: treasury-board-of-canada-secretariat for user: 123 to db: Error: trx commit error`,
            ])
          })
        })
      })
    })
  })
})
