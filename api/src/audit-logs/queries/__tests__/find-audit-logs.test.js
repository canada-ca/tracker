import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { checkPermission, userRequired, verifiedRequired } from '../../../auth'
import {
  loadAuditLogsByOrgId,
  loadOrgByKey,
  loadUserByKey,
} from '../../loaders'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findAuditLogs', () => {
  let query,
    drop,
    truncate,
    schema,
    collections,
    saOrg,
    log1,
    log2,
    log3,
    i18n,
    superAdmin

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
  })
  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    consoleOutput.length = 0
  })
  describe('given a successful load', () => {
    beforeAll(async () => {
      // Generate DB Items
      ;({ query, drop, truncate, collections } = await ensure({
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
      superAdmin = await collections.users.save({
        displayName: 'Super Admin',
        userName: 'super.admin@istio.actually.exists',
        preferredLang: 'english',
        emailValidated: true,
      })

      log1 = await collections.auditLogs.save({
        id: 'ca8f1312-de3d-476a-89bf-92542118ec3a',
        timestamp: 'Hello World',
        initiatedBy: {
          id: '0ca868c6-224c-446d-aaa9-c96f9a091f7e',
          userName: 'Hello World',
          role: 'Hello World',
          organization: 'Hello World',
        },
        action: 'add',
        target: {
          resource: 'Hello World',
          organization: {
            name: 'Hello World',
          },
          resourceType: 'user',
          updatedProperties: [],
        },
        reason: '',
      })

      log2 = await collections.auditLogs.save({
        id: 'ca8f1312-de3d-476a-89bf-92542118ec3b',
        timestamp: 'Hello World',
        initiatedBy: {
          id: '0ca868c6-224c-446d-aaa9-c96f9a091f7e',
          userName: 'Hello World',
          role: 'Hello World',
          organization: 'Hello World',
        },
        action: 'update',
        target: {
          resource: 'Hello World',
          organization: {
            name: 'Hello World',
          },
          resourceType: 'organization',
          updatedProperties: [
            {
              name: 'Hello World',
              oldValue: 'Hello World',
              newValue: 'Hello World',
            },
            {
              name: 'Hello World',
              oldValue: 'Hello World',
              newValue: 'Hello World',
            },
          ],
        },
        reason: '',
      })

      log3 = await collections.auditLogs.save({
        id: 'ca8f1312-de3d-476a-89bf-92542118ec3c',
        timestamp: 'Hello World',
        initiatedBy: {
          id: '0ca868c6-224c-446d-aaa9-c96f9a091f7e',
          userName: 'Hello World',
          role: 'Hello World',
          organization: 'Hello World',
        },
        action: 'remove',
        target: {
          resource: 'Hello World',
          organization: {
            name: 'Hello World',
          },
          resourceType: 'domain',
          updatedProperties: [],
        },
        reason: 'wrong_org',
      })

      saOrg = await collections.organizations.save({
        orgDetails: {
          en: {
            slug: 'super-admin',
            acronym: 'SA',
            name: 'Super Admin',
            zone: 'FED',
            sector: 'SA',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
          fr: {
            slug: 'super-admin',
            acronym: 'SA',
            name: 'Super Admin',
            zone: 'FED',
            sector: 'SA',
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
          _from: saOrg._id,
          _to: superAdmin._id,
          permission: 'super_admin',
        })
      })
      describe('given successful retrieval of logs', () => {
        describe('super admin queries for logs', () => {
          describe('in english', () => {
            it('returns logs', async () => {
              const response = await graphql(
                schema,
                `
                  query {
                    findAuditLogs(first: 10) {
                      edges {
                        node {
                          id
                          timestamp
                          initiatedBy {
                            id
                            userName
                            role
                            organization
                          }
                          action
                          target {
                            resource
                            organization {
                              name
                            }
                            resourceType
                            updatedProperties {
                              name
                              oldValue
                              newValue
                            }
                          }
                          reason
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
                  userKey: superAdmin._key,
                  auth: {
                    userRequired: userRequired({
                      i18n,
                      userKey: superAdmin._key,
                      loadUserByKey: loadUserByKey({
                        query,
                        userKey: superAdmin._key,
                        i18n,
                      }),
                    }),
                    verifiedRequired: verifiedRequired({}),
                    checkPermission: checkPermission({}),
                  },
                  loaders: {
                    loadAuditLogsByOrgId: loadAuditLogsByOrgId({
                      query,
                      userKey: superAdmin._key,
                      cleanseInput,
                      auth: { loginRequired: true },
                      language: 'en',
                    }),
                    loadOrgByKey: loadOrgByKey({}),
                  },
                },
              )

              const expectedResponse = {
                data: {
                  findMyUsers: {
                    edges: [
                      {
                        cursor: toGlobalId('auditLog', log1._key),
                        node: {
                          id: toGlobalId('auditLog', log1._key),
                          timestamp: 'Hello World',
                          initiatedBy: {
                            id: '0ca868c6-224c-446d-aaa9-c96f9a091f7e',
                            userName: 'Hello World',
                            role: 'Hello World',
                            organization: 'Hello World',
                          },
                          action: 'add',
                          target: {
                            resource: 'Hello World',
                            organization: {
                              name: 'Hello World',
                            },
                            resourceType: 'user',
                            updatedProperties: [],
                          },
                          reason: '',
                        },
                      },
                      {
                        cursor: toGlobalId('auditLog', log2._key),
                        node: {
                          id: toGlobalId('auditLog', log2._key),
                          timestamp: 'Hello World',
                          initiatedBy: {
                            id: '0ca868c6-224c-446d-aaa9-c96f9a091f7e',
                            userName: 'Hello World',
                            role: 'Hello World',
                            organization: 'Hello World',
                          },
                          action: 'update',
                          target: {
                            resource: 'Hello World',
                            organization: {
                              name: 'Hello World',
                            },
                            resourceType: 'organization',
                            updatedProperties: [
                              {
                                name: 'Hello World',
                                oldValue: 'Hello World',
                                newValue: 'Hello World',
                              },
                              {
                                name: 'Hello World',
                                oldValue: 'Hello World',
                                newValue: 'Hello World',
                              },
                            ],
                          },
                          reason: '',
                        },
                      },
                      {
                        cursor: toGlobalId('auditLog', log3._key),
                        node: {
                          id: toGlobalId('auditLog', log3._key),
                          timestamp: 'Hello World',
                          initiatedBy: {
                            id: '0ca868c6-224c-446d-aaa9-c96f9a091f7e',
                            userName: 'Hello World',
                            role: 'Hello World',
                            organization: 'Hello World',
                          },
                          action: 'remove',
                          target: {
                            resource: 'Hello World',
                            organization: {
                              name: 'Hello World',
                            },
                            resourceType: 'domain',
                            updatedProperties: [],
                          },
                          reason: 'wrong_org',
                        },
                      },
                    ],
                    pageInfo: {
                      endCursor: toGlobalId('auditLog', log3._key),
                      hasNextPage: false,
                      hasPreviousPage: false,
                      startCursor: toGlobalId('auditLog', log1._key),
                    },
                  },
                },
              }
              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${superAdmin._key} successfully retrieved audit logs.`,
              ])
            })
          })
        })
      })
    })
  })
  describe('given an unsuccessful load', () => {
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
      describe('database error occurs', () => {
        it('returns an error message', async () => {
          const mockedQuery = jest
            .fn()
            .mockRejectedValueOnce(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
              query {
                findAuditLogs(first: 10) {
                  edges {
                    node {
                      id
                      timestamp
                      initiatedBy {
                        id
                        userName
                        role
                        organization
                      }
                      action
                      target {
                        resource
                        organization {
                          name
                        }
                        resourceType
                        updatedProperties {
                          name
                          oldValue
                          newValue
                        }
                      }
                      reason
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
              userKey: superAdmin._key,
              auth: {
                checkSuperAdmin: jest.fn(),
                userRequired: jest.fn().mockReturnValue({}),
                verifiedRequired: jest.fn(),
                superAdminRequired: jest.fn(),
              },
              loaders: {
                loadAuditLogsByOrgId: loadAuditLogsByOrgId({
                  query: mockedQuery,
                  userKey: superAdmin._key,
                  cleanseInput,
                  auth: { loginRequired: true },
                  language: 'en',
                  i18n,
                }),
                loadOrgByKey: loadOrgByKey({}),
              },
            },
          )

          const error = [
            new GraphQLError('Unable to query log(s). Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${superAdmin._key} was trying to query logs in loadAuditLogsByOrgId, error: Error: Database error occurred.`,
          ])
        })
      })
    })
  })
})
