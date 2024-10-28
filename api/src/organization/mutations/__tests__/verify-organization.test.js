import { setupI18n } from '@lingui/core'
import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput } from '../../../validators'
import { checkPermission, userRequired, verifiedRequired } from '../../../auth'
import { loadUserByKey } from '../../../user/loaders'
import { loadOrgByKey } from '../../loaders'
import { loadDomainByKey } from '../../../domain/loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('removing an organization', () => {
  let query, drop, truncate, schema, collections, transaction, i18n, user

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
  })

  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful org verification', () => {
    let org, domain
    beforeAll(async () => {
      // Generate DB Items
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
    })
    beforeEach(async () => {
      user = await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        emailValidated: true,
      })
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
      domain = await collections.domains.save({
        domain: 'test.gc.ca',
        archived: true,
      })
      await collections.claims.save({
        _from: org._id,
        _to: domain._id,
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
      describe('super admin is able to verify organization', () => {
        it('returns a status message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                verifyOrganization(
                  input: {
                    orgId: "${toGlobalId('organization', org._key)}"
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
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
          })

          const expectedResponse = {
            data: {
              verifyOrganization: {
                result: {
                  status: 'Successfully verified organization: treasury-board-secretariat.',
                  organization: {
                    name: 'Treasury Board of Canada Secretariat',
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([`User: ${user._key}, successfully verified org: ${org._key}.`])

          const orgLoader = loadOrgByKey({
            query,
            language: 'en',
            userKey: user._key,
            i18n,
          })
          const verifiedOrg = await orgLoader.load(org._key)
          expect(verifiedOrg.verified).toEqual(true)

          const domainLoader = loadDomainByKey({ query, userKey: user._key, i18n })

          const unarchivedDomain = await domainLoader.load(domain._key)
          expect(unarchivedDomain.archived).toEqual(false)
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
          const response = await graphql({
            schema,
            source: `
              mutation {
                verifyOrganization(
                  input: {
                    orgId: "${toGlobalId('organization', org._key)}"
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
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
          })

          const expectedResponse = {
            data: {
              verifyOrganization: {
                result: {
                  status: "Envoi réussi de l'invitation au service, et de l'email de l'organisation.",
                  organization: {
                    name: 'Secrétariat du Conseil Trésor du Canada',
                  },
                },
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([`User: ${user._key}, successfully verified org: ${org._key}.`])

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
      describe('organization is not found', () => {
        it('throws an error message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                verifyOrganization(
                  input: {
                    orgId: "${toGlobalId('organization', -1)}"
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn(),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
            },
          })

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
            `User: 123 attempted to verify organization: -1, however no organizations is associated with that id.`,
          ])
        })
      })
      describe('user permission is not super admin', () => {
        describe('users permission level is admin', () => {
          it('throws an error message', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  verifyOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _id: 'organizations/123',
                    }),
                  },
                },
              },
            })

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
              `User: 123 attempted to verify organization: 123, however they do not have the correct permission level. Permission: admin`,
            ])
          })
        })
        describe('users permission level is user', () => {
          it('throws an error message', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  verifyOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('user'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _id: 'organizations/123',
                    }),
                  },
                },
              },
            })

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
              `User: 123 attempted to verify organization: 123, however they do not have the correct permission level. Permission: user`,
            ])
          })
        })
      })
      describe('organization is already verified', () => {
        it('throws an error message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                verifyOrganization(
                  input: {
                    orgId: "${toGlobalId('organization', 123)}"
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('super_admin'),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    verified: true,
                  }),
                },
              },
            },
          })

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
            `User: 123 attempted to verify organization: 123, however the organization has already been verified.`,
          ])
        })
      })
      describe('transaction error occurs', () => {
        describe('when stepping transaction', () => {
          describe('when upserting org information', () => {
            it('throws an error message', async () => {
              const response = await graphql({
                schema,
                source: `
                  mutation {
                    verifyOrganization(
                      input: {
                        orgId: "${toGlobalId('organization', 123)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
                  transaction: jest.fn().mockReturnValue({
                    step: jest.fn().mockRejectedValue(new Error('trx step error')),
                    abort: jest.fn(),
                  }),
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('super_admin'),
                    userRequired: jest.fn(),
                    verifiedRequired: jest.fn(),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        verified: false,
                      }),
                    },
                  },
                },
              })

              const error = [new GraphQLError('Unable to verify organization. Please try again.')]

              expect(response.errors).toEqual(error)

              expect(consoleOutput).toEqual([
                `Transaction error occurred while upserting verified org: 123, err: Error: trx step error`,
              ])
            })
          })
          describe('when clearing owners', () => {
            it('throws an error message', async () => {
              const response = await graphql({
                schema,
                source: `
                  mutation {
                    verifyOrganization(
                      input: {
                        orgId: "${toGlobalId('organization', 123)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
                  transaction: jest.fn().mockReturnValue({
                    step: jest.fn().mockRejectedValue(new Error('trx step error')),
                    abort: jest.fn(),
                  }),
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('super_admin'),
                    userRequired: jest.fn(),
                    verifiedRequired: jest.fn(),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        verified: false,
                      }),
                    },
                  },
                },
              })

              const error = [new GraphQLError('Unable to verify organization. Please try again.')]

              expect(response.errors).toEqual(error)

              expect(consoleOutput).toEqual([
                `Transaction error occurred while upserting verified org: 123, err: Error: trx step error`,
              ])
            })
          })
        })
        describe('when committing transaction', () => {
          it('throws an error message', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  verifyOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue(),
                  commit: jest.fn().mockRejectedValue(new Error('trx commit error')),
                  abort: jest.fn(),
                }),
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('super_admin'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: false,
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError('Unable to verify organization. Please try again.')]

            expect(response.errors).toEqual(error)

            expect(consoleOutput).toEqual([
              `Transaction error occurred while committing newly verified org: 123, err: Error: trx commit error`,
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
      describe('organization is not found', () => {
        it('throws an error message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                verifyOrganization(
                  input: {
                    orgId: "${toGlobalId('organization', -1)}"
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn(),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
            },
          })

          const error = {
            data: {
              verifyOrganization: {
                result: {
                  code: 400,
                  description: 'Impossible de vérifier une organisation inconnue.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: 123 attempted to verify organization: -1, however no organizations is associated with that id.`,
          ])
        })
      })
      describe('user permission is not super admin', () => {
        describe('users permission level is admin', () => {
          it('throws an error message', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  verifyOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _id: 'organizations/123',
                    }),
                  },
                },
              },
            })

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
              `User: 123 attempted to verify organization: 123, however they do not have the correct permission level. Permission: admin`,
            ])
          })
        })
        describe('users permission level is user', () => {
          it('throws an error message', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  verifyOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('user'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      _id: 'organizations/123',
                    }),
                  },
                },
              },
            })

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
              `User: 123 attempted to verify organization: 123, however they do not have the correct permission level. Permission: user`,
            ])
          })
        })
      })
      describe('organization is already verified', () => {
        it('throws an error message', async () => {
          const response = await graphql({
            schema,
            source: `
              mutation {
                verifyOrganization(
                  input: {
                    orgId: "${toGlobalId('organization', 123)}"
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
            rootValue: null,
            contextValue: {
              i18n,
              query,
              collections: collectionNames,
              transaction,
              userKey: 123,
              auth: {
                checkPermission: jest.fn().mockReturnValue('super_admin'),
                userRequired: jest.fn(),
                verifiedRequired: jest.fn(),
              },
              validators: { cleanseInput },
              loaders: {
                loadOrgByKey: {
                  load: jest.fn().mockReturnValue({
                    verified: true,
                  }),
                },
              },
            },
          })

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
            `User: 123 attempted to verify organization: 123, however the organization has already been verified.`,
          ])
        })
      })
      describe('transaction error occurs', () => {
        describe('when stepping transaction', () => {
          describe('when upserting org information', () => {
            it('throws an error message', async () => {
              const response = await graphql({
                schema,
                source: `
                  mutation {
                    verifyOrganization(
                      input: {
                        orgId: "${toGlobalId('organization', 123)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
                  transaction: jest.fn().mockReturnValue({
                    step: jest.fn().mockRejectedValue(new Error('trx step error')),
                    abort: jest.fn(),
                  }),
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('super_admin'),
                    userRequired: jest.fn(),
                    verifiedRequired: jest.fn(),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        verified: false,
                      }),
                    },
                  },
                },
              })

              const error = [new GraphQLError("Impossible de vérifier l'organisation. Veuillez réessayer.")]

              expect(response.errors).toEqual(error)

              expect(consoleOutput).toEqual([
                `Transaction error occurred while upserting verified org: 123, err: Error: trx step error`,
              ])
            })
          })
          describe('when clearing owners', () => {
            it('throws an error message', async () => {
              const response = await graphql({
                schema,
                source: `
                  mutation {
                    verifyOrganization(
                      input: {
                        orgId: "${toGlobalId('organization', 123)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query,
                  collections: collectionNames,
                  transaction: jest.fn().mockReturnValue({
                    step: jest.fn().mockRejectedValue(new Error('trx step error')),
                    abort: jest.fn(),
                  }),
                  userKey: 123,
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('super_admin'),
                    userRequired: jest.fn(),
                    verifiedRequired: jest.fn(),
                  },
                  validators: { cleanseInput },
                  loaders: {
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        verified: false,
                      }),
                    },
                  },
                },
              })

              const error = [new GraphQLError("Impossible de vérifier l'organisation. Veuillez réessayer.")]

              expect(response.errors).toEqual(error)

              expect(consoleOutput).toEqual([
                `Transaction error occurred while upserting verified org: 123, err: Error: trx step error`,
              ])
            })
          })
        })
        describe('when committing transaction', () => {
          it('throws an error message', async () => {
            const response = await graphql({
              schema,
              source: `
                mutation {
                  verifyOrganization(
                    input: {
                      orgId: "${toGlobalId('organization', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockReturnValue(),
                  commit: jest.fn().mockRejectedValue(new Error('trx commit error')),
                  abort: jest.fn(),
                }),
                userKey: 123,
                auth: {
                  checkPermission: jest.fn().mockReturnValue('super_admin'),
                  userRequired: jest.fn(),
                  verifiedRequired: jest.fn(),
                },
                validators: { cleanseInput },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      verified: false,
                    }),
                  },
                },
              },
            })

            const error = [new GraphQLError("Impossible de vérifier l'organisation. Veuillez réessayer.")]

            expect(response.errors).toEqual(error)

            expect(consoleOutput).toEqual([
              `Transaction error occurred while committing newly verified org: 123, err: Error: trx commit error`,
            ])
          })
        })
      })
    })
  })
})
