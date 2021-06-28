import { setupI18n } from '@lingui/core'
import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput } from '../../../validators'
import { checkPermission, userRequired, verifiedRequired } from '../../../auth'
import { loadUserByKey } from '../../../user/loaders'
import { loadOrgByKey } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('removing an organization', () => {
  let query, drop, truncate, schema, collections, transaction, i18n, user
  beforeAll(async () => {
    // Generate DB Items
    ;({ query, drop, truncate, collections, transaction } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
  })
  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      emailValidated: true,
    })
    consoleOutput = []
  })
  afterEach(async () => {
    await truncate()
  })
  afterAll(async () => {
    await drop()
  })
  describe('given a successful org verification', () => {
    let org
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
      await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'super_admin',
      })
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
      describe('super admin is able to verify organization', () => {
        it('returns a status message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                verifyOrganization(
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                  }
                ) {
                  result {
                    ... on OrganizationResult {
                      status
                      organization {
                        name
                      }
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
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({
                  userKey: user._key,
                  query,
                  i18n,
                }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                  i18n,
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  userKey: user._key,
                  i18n,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
            },
          )

          const expectedResponse = {
            data: {
              verifyOrganization: {
                result: {
                  status:
                    'Successfully verified organization: treasury-board-secretariat.',
                  organization: {
                    name: 'Treasury Board of Canada Secretariat',
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key}, successfully verified org: ${org._key}.`,
          ])

          const orgLoader = loadOrgByKey({
            query,
            language: 'en',
            userKey: user._key,
            i18n,
          })
          const verifiedOrg = await orgLoader.load(org._key)
          expect(verifiedOrg.verified).toEqual(true)
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
      describe('super admin is able to verify organization', () => {
        it('returns a status message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                verifyOrganization(
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                  }
                ) {
                  result {
                    ... on OrganizationResult {
                      status
                      organization {
                        name
                      }
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
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({
                  userKey: user._key,
                  query,
                  i18n,
                }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                  i18n,
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'fr',
                  userKey: user._key,
                  i18n,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
            },
          )

          const expectedResponse = {
            data: {
              verifyOrganization: {
                result: {
                  status:
                    "Envoi réussi de l'invitation au service, et de l'email de l'organisation.",
                  organization: {
                    name: 'Secrétariat du Conseil Trésor du Canada',
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key}, successfully verified org: ${org._key}.`,
          ])

          const orgLoader = loadOrgByKey({
            query,
            language: 'fr',
            userKey: user._key,
            i18n,
          })
          const verifiedOrg = await orgLoader.load(org._key)
          expect(verifiedOrg.verified).toEqual(true)
        })
      })
    })
  })
  describe('given an unsuccessful org verification', () => {
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
      describe('organization is already verified', () => {
        let org
        beforeEach(async () => {
          org = await collections.organizations.save({
            verified: true,
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
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        it('throws an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                verifyOrganization(
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                  }
                ) {
                  result {
                    ... on OrganizationResult {
                      status
                      organization {
                        name
                      }
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
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({
                  userKey: user._key,
                  query,
                  i18n,
                }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                  i18n,
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  userKey: user._key,
                  i18n,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
            },
          )

          const error = {
            data: {
              verifyOrganization: {
                result: {
                  code: 400,
                  description: 'Organization has already been verified.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to verify organization: ${org._key}, however the organization has already been verified.`,
          ])
        })
      })
      describe('organization is not found', () => {
        let org
        beforeEach(async () => {
          org = await collections.organizations.save({
            verified: true,
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
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        it('throws an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                verifyOrganization(
                  input: {
                    orgId: "${toGlobalId('organizations', -1)}"
                  }
                ) {
                  result {
                    ... on OrganizationResult {
                      status
                      organization {
                        name
                      }
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
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({
                  userKey: user._key,
                  query,
                  i18n,
                }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                  i18n,
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  userKey: user._key,
                  i18n,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
            },
          )

          const error = {
            data: {
              verifyOrganization: {
                result: {
                  code: 400,
                  description: 'Unable to verify unknown organization.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to verify organization: -1, however no organizations is associated with that id.`,
          ])
        })
      })
      describe('user permission is not super admin', () => {
        describe('users permission level is admin', () => {
          let org
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
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'admin',
            })
          })
          it('throws an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  verifyOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
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
                query,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                    i18n,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                    i18n,
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    userKey: user._key,
                    i18n,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                },
              },
            )
            const error = {
              data: {
                verifyOrganization: {
                  result: {
                    code: 403,
                    description:
                      'Permission Denied: Please contact super admin for help with verifying this organization.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to verify organization: ${org._key}, however they do not have the correct permission level. Permission: admin`,
            ])
          })
        })
        describe('users permission level is user', () => {
          let org
          beforeEach(async () => {
            org = await collections.organizations.save({
              verified: true,
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
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('throws an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  verifyOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
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
                query,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                    i18n,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                    i18n,
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    userKey: user._key,
                    i18n,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                },
              },
            )

            const error = {
              data: {
                verifyOrganization: {
                  result: {
                    code: 403,
                    description:
                      'Permission Denied: Please contact super admin for help with verifying this organization.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to verify organization: ${org._key}, however they do not have the correct permission level. Permission: user`,
            ])
          })
        })
      })
      describe('transaction error occurs', () => {
        let org
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
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        describe('when stepping transaction', () => {
          describe('when upserting org information', () => {
            it('throws an error message', async () => {
              const mockedTransaction = jest.fn().mockReturnValue({
                step() {
                  throw new Error('Database error occurred.')
                },
                commit() {
                  throw new Error('Database error occurred.')
                },
              })

              const response = await graphql(
                schema,
                `
                  mutation {
                    verifyOrganization(
                      input: {
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
                      result {
                        ... on OrganizationResult {
                          status
                          organization {
                            name
                          }
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
                  query,
                  collections,
                  transaction: mockedTransaction,
                  userKey: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                      i18n,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({
                        query,
                        userKey: user._key,
                        i18n,
                      }),
                      i18n,
                    }),
                    verifiedRequired: verifiedRequired({}),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({
                      query,
                      language: 'en',
                      userKey: user._key,
                      i18n,
                    }),
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  },
                },
              )

              const error = [
                new GraphQLError(
                  'Unable to verify organization. Please try again.',
                ),
              ]

              expect(response.errors).toEqual(error)

              expect(consoleOutput).toEqual([
                `Transaction error occurred while upserting verified org: ${org._key}, err: Error: Database error occurred.`,
              ])
            })
          })
          describe('when clearing owners', () => {
            it('throws an error message', async () => {
              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest
                  .fn()
                  .mockReturnValueOnce({})
                  .mockRejectedValue(new Error('Trx step error')),
              })

              const response = await graphql(
                schema,
                `
                  mutation {
                    verifyOrganization(
                      input: {
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
                      result {
                        ... on OrganizationResult {
                          status
                          organization {
                            name
                          }
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
                  query,
                  collections,
                  transaction: mockedTransaction,
                  userKey: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                      i18n,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({
                        query,
                        userKey: user._key,
                        i18n,
                      }),
                      i18n,
                    }),
                    verifiedRequired: verifiedRequired({}),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({
                      query,
                      language: 'en',
                      userKey: user._key,
                      i18n,
                    }),
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  },
                },
              )

              const error = [
                new GraphQLError(
                  'Unable to verify organization. Please try again.',
                ),
              ]

              expect(response.errors).toEqual(error)

              expect(consoleOutput).toEqual([
                `Trx step error occurred when clearing owners for org: ${org._key}: Error: Trx step error`,
              ])
            })
          })
        })
        describe('when committing transaction', () => {
          it('throws an error message', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step() {
                return undefined
              },
              commit() {
                throw new Error('Database error occurred.')
              },
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  verifyOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
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
                query,
                collections,
                transaction: mockedTransaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                    i18n,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                    i18n,
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    userKey: user._key,
                    i18n,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to verify organization. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)

            expect(consoleOutput).toEqual([
              `Transaction error occurred while committing newly verified org: ${org._key}, err: Error: Database error occurred.`,
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
      describe('organization is already verified', () => {
        let org
        beforeEach(async () => {
          org = await collections.organizations.save({
            verified: true,
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
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        it('throws an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                verifyOrganization(
                  input: {
                    orgId: "${toGlobalId('organizations', org._key)}"
                  }
                ) {
                  result {
                    ... on OrganizationResult {
                      status
                      organization {
                        name
                      }
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
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({
                  userKey: user._key,
                  query,
                  i18n,
                }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                  i18n,
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  userKey: user._key,
                  i18n,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
            },
          )

          const error = {
            data: {
              verifyOrganization: {
                result: {
                  code: 400,
                  description: "L'organisation a déjà été vérifiée.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to verify organization: ${org._key}, however the organization has already been verified.`,
          ])
        })
      })
      describe('organization is not found', () => {
        let org
        beforeEach(async () => {
          org = await collections.organizations.save({
            verified: true,
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
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        it('throws an error message', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                verifyOrganization(
                  input: {
                    orgId: "${toGlobalId('organizations', -1)}"
                  }
                ) {
                  result {
                    ... on OrganizationResult {
                      status
                      organization {
                        name
                      }
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
              query,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({
                  userKey: user._key,
                  query,
                  i18n,
                }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                  i18n,
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'en',
                  userKey: user._key,
                  i18n,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: user._key,
                  i18n,
                }),
              },
            },
          )

          const error = {
            data: {
              verifyOrganization: {
                result: {
                  code: 400,
                  description:
                    'Impossible de vérifier une organisation inconnue.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to verify organization: -1, however no organizations is associated with that id.`,
          ])
        })
      })
      describe('user permission is not super admin', () => {
        describe('users permission level is admin', () => {
          let org
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
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'admin',
            })
          })
          it('throws an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  verifyOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
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
                query,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                    i18n,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                    i18n,
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    userKey: user._key,
                    i18n,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                },
              },
            )

            const error = {
              data: {
                verifyOrganization: {
                  result: {
                    code: 403,
                    description:
                      "Permission refusée : Veuillez contacter le super administrateur pour qu'il vous aide à vérifier cette organisation.",
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to verify organization: ${org._key}, however they do not have the correct permission level. Permission: admin`,
            ])
          })
        })
        describe('users permission level is user', () => {
          let org
          beforeEach(async () => {
            org = await collections.organizations.save({
              verified: true,
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
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'user',
            })
          })
          it('throws an error message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  verifyOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
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
                query,
                collections,
                transaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                    i18n,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                    i18n,
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    userKey: user._key,
                    i18n,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                },
              },
            )

            const error = {
              data: {
                verifyOrganization: {
                  result: {
                    code: 403,
                    description:
                      "Permission refusée : Veuillez contacter le super administrateur pour qu'il vous aide à vérifier cette organisation.",
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to verify organization: ${org._key}, however they do not have the correct permission level. Permission: user`,
            ])
          })
        })
      })
      describe('transaction error occurs', () => {
        let org
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
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        describe('when running transaction', () => {
          describe('when upserting org information', () => {
            it('throws an error message', async () => {
              const mockedTransaction = jest.fn().mockReturnValue({
                step() {
                  throw new Error('Database error occurred.')
                },
                commit() {
                  throw new Error('Database error occurred.')
                },
              })

              const response = await graphql(
                schema,
                `
                  mutation {
                    verifyOrganization(
                      input: {
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
                      result {
                        ... on OrganizationResult {
                          status
                          organization {
                            name
                          }
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
                  query,
                  collections,
                  transaction: mockedTransaction,
                  userKey: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                      i18n,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({
                        query,
                        userKey: user._key,
                        i18n,
                      }),
                      i18n,
                    }),
                    verifiedRequired: verifiedRequired({}),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({
                      query,
                      language: 'en',
                      userKey: user._key,
                      i18n,
                    }),
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  },
                },
              )

              const error = [
                new GraphQLError(
                  "Impossible de vérifier l'organisation. Veuillez réessayer.",
                ),
              ]

              expect(response.errors).toEqual(error)

              expect(consoleOutput).toEqual([
                `Transaction error occurred while upserting verified org: ${org._key}, err: Error: Database error occurred.`,
              ])
            })
          })
          describe('when clearing owners', () => {
            it('throws an error message', async () => {
              const mockedTransaction = jest.fn().mockReturnValue({
                step: jest
                  .fn()
                  .mockReturnValueOnce({})
                  .mockRejectedValue(new Error('Trx step error')),
              })

              const response = await graphql(
                schema,
                `
                  mutation {
                    verifyOrganization(
                      input: {
                        orgId: "${toGlobalId('organizations', org._key)}"
                      }
                    ) {
                      result {
                        ... on OrganizationResult {
                          status
                          organization {
                            name
                          }
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
                  query,
                  collections,
                  transaction: mockedTransaction,
                  userKey: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                      i18n,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({
                        query,
                        userKey: user._key,
                        i18n,
                      }),
                      i18n,
                    }),
                    verifiedRequired: verifiedRequired({}),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({
                      query,
                      language: 'en',
                      userKey: user._key,
                      i18n,
                    }),
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                  },
                },
              )

              const error = [
                new GraphQLError(
                  "Impossible de vérifier l'organisation. Veuillez réessayer.",
                ),
              ]

              expect(response.errors).toEqual(error)

              expect(consoleOutput).toEqual([
                `Trx step error occurred when clearing owners for org: ${org._key}: Error: Trx step error`,
              ])
            })
          })
        })
        describe('when committing transaction', () => {
          it('throws an error message', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              step() {
                return undefined
              },
              commit() {
                throw new Error('Database error occurred.')
              },
            })

            const response = await graphql(
              schema,
              `
                mutation {
                  verifyOrganization(
                    input: {
                      orgId: "${toGlobalId('organizations', org._key)}"
                    }
                  ) {
                    result {
                      ... on OrganizationResult {
                        status
                        organization {
                          name
                        }
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
                query,
                collections,
                transaction: mockedTransaction,
                userKey: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                    i18n,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: user._key,
                      i18n,
                    }),
                    i18n,
                  }),
                  verifiedRequired: verifiedRequired({}),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'en',
                    userKey: user._key,
                    i18n,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: user._key,
                    i18n,
                  }),
                },
              },
            )

            const error = [
              new GraphQLError(
                "Impossible de vérifier l'organisation. Veuillez réessayer.",
              ),
            ]

            expect(response.errors).toEqual(error)

            expect(consoleOutput).toEqual([
              `Transaction error occurred while committing newly verified org: ${org._key}, err: Error: Database error occurred.`,
            ])
          })
        })
      })
    })
  })
})
