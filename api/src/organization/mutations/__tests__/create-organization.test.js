import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput, slugify } from '../../../validators'
import { checkSuperAdmin, superAdminRequired, userRequired, verifiedRequired } from '../../../auth'
import { loadUserByKey } from '../../../user/loaders'
import { loadOrgBySlug } from '../../loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url, SIGN_IN_KEY } = process.env

describe('create an organization', () => {
  let query, drop, truncate, schema, collections, transaction, user, i18n

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

  describe('given a successful org creation', () => {
    beforeEach(async () => {
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
        const response = await graphql({
          schema,
          source: `
            mutation {
              createOrganization(
                input: {
                  acronymEN: "TBS"
                  acronymFR: "SCT"
                  nameEN: "Treasury Board of Canada Secretariat"
                  nameFR: "Secrétariat du Conseil Trésor du Canada"
                  externalId: "EXT123"
                  verified: false
                }
              ) {
                result {
                  ... on Organization {
                    id
                    acronym
                    slug
                    name
                    verified
                    externalId
                  }
                }
              }
            }
          `,
          rootValue: null,
          contextValue: {
            request: {
              language: 'en',
            },
            query,
            collections: collectionNames,
            transaction,
            userKey: user._key,
            auth: {
              userRequired: userRequired({
                userKey: user._key,
                loadUserByKey: loadUserByKey({ query }),
              }),
              verifiedRequired: verifiedRequired({}),
              checkSuperAdmin: checkSuperAdmin({ i18n, query, userKey: user._key }),
              superAdminRequired: superAdminRequired({ i18n }),
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
        })

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
                verified: org.verified,
                externalId: org.externalId,
              },
            },
          },
        }

        // externalId is returned as null if not set, not undefined
        expectedResponse.data.createOrganization.result.externalId = null
        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([`User: ${user._key} successfully created a new organization: ${org.slug}`])
      })
    })
    describe('language is set to french', () => {
      it('returns the organizations information', async () => {
        const response = await graphql({
          schema,
          source: `
            mutation {
              createOrganization(
                input: {
                  acronymEN: "TBS"
                  acronymFR: "SCT"
                  nameEN: "Treasury Board of Canada Secretariat"
                  nameFR: "Secrétariat du Conseil Trésor du Canada"
                  externalId: "EXT123"
                  verified: false
                }
              ) {
                result {
                  ... on Organization {
                    id
                    acronym
                    slug
                    name
                    verified
                    externalId
                  }
                }
              }
            }
          `,
          rootValue: null,
          contextValue: {
            request: {
              language: 'fr',
            },
            query,
            collections: collectionNames,
            transaction,
            userKey: user._key,
            auth: {
              userRequired: userRequired({
                userKey: user._key,
                loadUserByKey: loadUserByKey({ query }),
              }),
              verifiedRequired: verifiedRequired({}),
              checkSuperAdmin: checkSuperAdmin({ i18n, query, userKey: user._key }),
              superAdminRequired: superAdminRequired({ i18n }),
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
        })

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
                verified: org.verified,
                externalId: org.externalId,
              },
            },
          },
        }

        // externalId is returned as null if not set, not undefined
        expectedResponse.data.createOrganization.result.externalId = null
        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully created a new organization: treasury-board-of-canada-secretariat`,
        ])
      })
    })
  })
  describe('given an unsuccessful org creation', () => {
    describe('users language is set to english', () => {
      describe('organization already exists', () => {
        it('returns an error', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                createOrganization(
                  input: {
                    acronymEN: "TBS"
                    acronymFR: "SCT"
                    nameEN: "Treasury Board of Canada Secretariat"
                    nameFR: "Secrétariat du Conseil Trésor du Canada"
                  }
                ) {
                  result {
                    ... on Organization {
                      id
                      acronym
                      slug
                      name
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
            rootValue: null,
            contextValue: {
              i18n,
              request: {
                language: 'en',
              },
              query,
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
                verifiedRequired: jest.fn(),
                checkSuperAdmin: jest.fn(),
                superAdminRequired: jest.fn(),
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
          })

          const error = {
            data: {
              createOrganization: {
                result: {
                  code: 400,
                  description: 'Organization name already in use. Please try again with a different name.',
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
            const response = await graphql({
              schema,
              source: `
                mutation {
                  createOrganization(
                    input: {
                      acronymEN: "TBS"
                      acronymFR: "SCT"
                      nameEN: "Treasury Board of Canada Secretariat"
                      nameFR: "Secrétariat du Conseil Trésor du Canada"
                    }
                  ) {
                    result {
                      ... on Organization {
                        id
                        acronym
                        slug
                        name
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
              rootValue: null,
              contextValue: {
                i18n,
                request: {
                  language: 'en',
                },
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockRejectedValue(new Error('trx step error')),
                  abort: jest.fn(),
                }),
                userKey: 123,
                auth: {
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                  verifiedRequired: jest.fn(),
                  checkSuperAdmin: jest.fn(),
                  superAdminRequired: jest.fn(),
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
            })

            const error = [new GraphQLError('Unable to create organization. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred when user: 123 was creating new organization treasury-board-of-canada-secretariat: Error: trx step error`,
            ])
          })
        })
        describe('when inserting edge', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  createOrganization(
                    input: {
                      acronymEN: "TBS"
                      acronymFR: "SCT"
                      nameEN: "Treasury Board of Canada Secretariat"
                      nameFR: "Secrétariat du Conseil Trésor du Canada"
                    }
                  ) {
                    result {
                      ... on Organization {
                        id
                        acronym
                        slug
                        name
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
              rootValue: null,
              contextValue: {
                i18n,
                request: {
                  language: 'en',
                },
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockReturnValueOnce({ next: jest.fn() })
                    .mockRejectedValue(new Error('trx step error')),
                  abort: jest.fn(),
                }),
                userKey: 123,
                auth: {
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                  verifiedRequired: jest.fn(),
                  checkSuperAdmin: jest.fn(),
                  superAdminRequired: jest.fn(),
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
            })

            const error = [new GraphQLError('Unable to create organization. Please try again.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred when inserting edge definition for user: 123 to treasury-board-of-canada-secretariat: Error: trx step error`,
            ])
          })
        })
        describe('when committing information to db', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  createOrganization(
                    input: {
                      acronymEN: "TBS"
                      acronymFR: "SCT"
                      nameEN: "Treasury Board of Canada Secretariat"
                      nameFR: "Secrétariat du Conseil Trésor du Canada"
                    }
                  ) {
                    result {
                      ... on Organization {
                        id
                        acronym
                        slug
                        name
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
              rootValue: null,
              contextValue: {
                i18n,
                request: {
                  language: 'en',
                },
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({ next: jest.fn() }),
                  commit: jest.fn().mockRejectedValue(new Error('trx commit error')),
                  abort: jest.fn(),
                }),
                userKey: 123,
                auth: {
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                  verifiedRequired: jest.fn(),
                  checkSuperAdmin: jest.fn(),
                  superAdminRequired: jest.fn(),
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
            })

            const error = [new GraphQLError('Unable to create organization. Please try again.')]

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
          const response = await graphql({
            schema,
            source: `
              mutation {
                createOrganization(
                  input: {
                    acronymEN: "TBS"
                    acronymFR: "SCT"
                    nameEN: "Treasury Board of Canada Secretariat"
                    nameFR: "Secrétariat du Conseil Trésor du Canada"
                  }
                ) {
                  result {
                    ... on Organization {
                      id
                      acronym
                      slug
                      name
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
            rootValue: null,
            contextValue: {
              i18n,
              request: {
                language: 'en',
              },
              query,
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                userRequired: jest.fn().mockReturnValue({
                  _key: 123,
                }),
                verifiedRequired: jest.fn(),
                checkSuperAdmin: jest.fn(),
                superAdminRequired: jest.fn(),
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
          })

          const error = {
            data: {
              createOrganization: {
                result: {
                  code: 400,
                  description: "Le nom de l'organisation est déjà utilisé. Veuillez réessayer avec un nom différent.",
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
            const response = await graphql({
              schema,
              source: `
                mutation {
                  createOrganization(
                    input: {
                      acronymEN: "TBS"
                      acronymFR: "SCT"
                      nameEN: "Treasury Board of Canada Secretariat"
                      nameFR: "Secrétariat du Conseil Trésor du Canada"
                    }
                  ) {
                    result {
                      ... on Organization {
                        id
                        acronym
                        slug
                        name
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
              rootValue: null,
              contextValue: {
                i18n,
                request: {
                  language: 'en',
                },
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockRejectedValue(new Error('trx step error')),
                  abort: jest.fn(),
                }),
                userKey: 123,
                auth: {
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                  verifiedRequired: jest.fn(),
                  checkSuperAdmin: jest.fn(),
                  superAdminRequired: jest.fn(),
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
            })

            const error = [new GraphQLError('Impossible de créer une organisation. Veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred when user: 123 was creating new organization treasury-board-of-canada-secretariat: Error: trx step error`,
            ])
          })
        })
        describe('when inserting edge', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  createOrganization(
                    input: {
                      acronymEN: "TBS"
                      acronymFR: "SCT"
                      nameEN: "Treasury Board of Canada Secretariat"
                      nameFR: "Secrétariat du Conseil Trésor du Canada"
                    }
                  ) {
                    result {
                      ... on Organization {
                        id
                        acronym
                        slug
                        name
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
              rootValue: null,
              contextValue: {
                i18n,
                request: {
                  language: 'en',
                },
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest
                    .fn()
                    .mockReturnValueOnce({ next: jest.fn() })
                    .mockRejectedValue(new Error('trx step error')),
                  abort: jest.fn(),
                }),
                userKey: 123,
                auth: {
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                  verifiedRequired: jest.fn(),
                  checkSuperAdmin: jest.fn(),
                  superAdminRequired: jest.fn(),
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
            })

            const error = [new GraphQLError('Impossible de créer une organisation. Veuillez réessayer.')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `Transaction error occurred when inserting edge definition for user: 123 to treasury-board-of-canada-secretariat: Error: trx step error`,
            ])
          })
        })
        describe('when committing information to db', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  createOrganization(
                    input: {
                      acronymEN: "TBS"
                      acronymFR: "SCT"
                      nameEN: "Treasury Board of Canada Secretariat"
                      nameFR: "Secrétariat du Conseil Trésor du Canada"
                    }
                  ) {
                    result {
                      ... on Organization {
                        id
                        acronym
                        slug
                        name
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
              rootValue: null,
              contextValue: {
                i18n,
                request: {
                  language: 'en',
                },
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue({ next: jest.fn() }),
                  commit: jest.fn().mockRejectedValue(new Error('trx commit error')),
                  abort: jest.fn(),
                }),
                userKey: 123,
                auth: {
                  userRequired: jest.fn().mockReturnValue({
                    _key: 123,
                  }),
                  verifiedRequired: jest.fn(),
                  checkSuperAdmin: jest.fn(),
                  superAdminRequired: jest.fn(),
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
            })

            const error = [new GraphQLError('Impossible de créer une organisation. Veuillez réessayer.')]

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
