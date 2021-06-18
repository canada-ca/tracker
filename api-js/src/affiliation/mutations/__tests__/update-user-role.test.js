import { ensure, dbNameFromFile } from 'arango-tools'
import { setupI18n } from '@lingui/core'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { checkPermission, userRequired, verifiedRequired } from '../../../auth'
import { loadUserByUserName, loadUserByKey } from '../../../user/loaders'
import { loadOrgByKey } from '../../../organization/loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('update a users role', () => {
  let query, drop, truncate, schema, collections, transaction, i18n, user

  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    // Generate DB Items
    ;({ query, drop, truncate, collections, transaction } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    consoleOutput = []
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
    describe('given a successful role update', () => {
      let org, secondaryUser
      beforeEach(async () => {
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

        secondaryUser = await collections.users.save({
          displayName: 'Test Account',
          userName: 'test@email.gc.ca',
          preferredLang: 'english',
        })
      })
      describe('requesting user is a super admin', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        describe('update user from admin', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: secondaryUser._id,
              permission: 'admin',
            })
          })
          describe('to super admin', () => {
            it('returns status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  updateUserRole (
                    input: {
                      userName: "test@email.gc.ca"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: SUPER_ADMIN
                    }
                  ) {
                    result {
                      ... on UpdateUserRoleResult {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: 'User role was updated successfully.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to super_admin in org: treasury-board-secretariat.`,
              ])
            })
          })
          describe('to user', () => {
            it('returns status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  updateUserRole (
                    input: {
                      userName: "test@email.gc.ca"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: USER
                    }
                  ) {
                    result {
                      ... on UpdateUserRoleResult {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: 'User role was updated successfully.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to user in org: treasury-board-secretariat.`,
              ])
            })
          })
        })
        describe('update user from user', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: secondaryUser._id,
              permission: 'user',
            })
          })
          describe('to super admin', () => {
            it('returns status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  updateUserRole (
                    input: {
                      userName: "test@email.gc.ca"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: SUPER_ADMIN
                    }
                  ) {
                    result {
                      ... on UpdateUserRoleResult {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: 'User role was updated successfully.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to super_admin in org: treasury-board-secretariat.`,
              ])
            })
          })
          describe('to admin', () => {
            it('returns status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  updateUserRole (
                    input: {
                      userName: "test@email.gc.ca"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: ADMIN
                    }
                  ) {
                    result {
                      ... on UpdateUserRoleResult {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: 'User role was updated successfully.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to admin in org: treasury-board-secretariat.`,
              ])
            })
          })
        })
      })
      describe('requesting user is admin', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        describe('update user from user', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: secondaryUser._id,
              permission: 'user',
            })
          })
          describe('to admin', () => {
            it('returns status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  updateUserRole (
                    input: {
                      userName: "test@email.gc.ca"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: ADMIN
                    }
                  ) {
                    result {
                      ... on UpdateUserRoleResult {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: 'User role was updated successfully.',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to admin in org: treasury-board-secretariat.`,
              ])
            })
          })
        })
      })
    })
    describe('given an unsuccessful role update', () => {
      let org, secondaryUser
      beforeEach(async () => {
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

        secondaryUser = await collections.users.save({
          displayName: 'Test Account',
          userName: 'test@email.gc.ca',
          preferredLang: 'english',
        })
      })
      describe('user attempts to update their own role', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "test.account@istio.actually.exists"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
                }
              ) {
                result {
                  ... on UpdateUserRoleResult {
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
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query }),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = {
            data: {
              updateUserRole: {
                result: {
                  code: 400,
                  description: 'Unable to update your own role.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update their own role in org: ${org._key}.`,
          ])
        })
      })
      describe('user attempts to update a user that does not exist', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "random@email.ca"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
                }
              ) {
                result {
                  ... on UpdateUserRoleResult {
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
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query }),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = {
            data: {
              updateUserRole: {
                result: {
                  code: 400,
                  description: 'Unable to update role: user unknown.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update a user: random@email.ca role in org: ${org._key}, however there is no user associated with that user name.`,
          ])
        })
      })
      describe('user attempts to update a users role in an org that does not exist', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "test@email.gc.ca"
                  orgId: "${toGlobalId('organizations', 1)}"
                  role: ADMIN
                }
              ) {
                result {
                  ... on UpdateUserRoleResult {
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
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query }),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = {
            data: {
              updateUserRole: {
                result: {
                  code: 400,
                  description: 'Unable to update role: organization unknown.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update a user: ${secondaryUser._key} role in org: 1, however there is no org associated with that id.`,
          ])
        })
      })
      describe('requesting user permission is user', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
        })
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "test@email.gc.ca"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
                }
              ) {
                result {
                  ... on UpdateUserRoleResult {
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
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query }),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = {
            data: {
              updateUserRole: {
                result: {
                  code: 400,
                  description:
                    'Permission Denied: Please contact organization admin for help with user role changes.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update a user: ${secondaryUser._key} role in org: treasury-board-secretariat, however they do not have permission to do so.`,
          ])
        })
      })
      describe('user attempts to update a users role in an org that the requesting user does not belong to', () => {
        let secondaryOrg
        beforeEach(async () => {
          secondaryOrg = await collections.organizations.save({
            verified: false,
            orgDetails: {
              en: {
                slug: 'communications-security-establishment',
                acronym: 'CSE',
                name: 'Communications Security Establishment',
                zone: 'FED',
                sector: 'DND',
                country: 'Canada',
                province: 'Ontario',
                city: 'Ottawa',
              },
              fr: {
                slug: 'centre-de-la-securite-des-telecommunications',
                acronym: 'CST',
                name: 'Centre de la Securite des Telecommunications',
                zone: 'FED',
                sector: 'DND',
                country: 'Canada',
                province: 'Ontario',
                city: 'Ottawa',
              },
            },
          })
          await collections.affiliations.save({
            _from: secondaryOrg._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "test@email.gc.ca"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
                }
              ) {
                result {
                  ... on UpdateUserRoleResult {
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
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query }),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = {
            data: {
              updateUserRole: {
                result: {
                  code: 400,
                  description:
                    'Permission Denied: Please contact organization admin for help with user role changes.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update a user: ${secondaryUser._key} role in org: treasury-board-secretariat, however they do not have permission to do so.`,
          ])
        })
      })
      describe('user attempts to update a user that does not belong to the requested org', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "test@email.gc.ca"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
                }
              ) {
                result {
                  ... on UpdateUserRoleResult {
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
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query }),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = {
            data: {
              updateUserRole: {
                result: {
                  code: 400,
                  description:
                    'Unable to update role: user does not belong to organization.',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update a user: ${secondaryUser._key} role in org: treasury-board-secretariat, however that user does not have an affiliation with that organization.`,
          ])
        })
      })
      describe('requesting users role is super admin', () => {
        describe('user attempts to update users role to admin', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'super_admin',
            })
            await collections.affiliations.save({
              _from: org._id,
              _to: secondaryUser._id,
              permission: 'super_admin',
            })
          })
          describe('requested users current role is super admin', () => {
            it('returns an error message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  updateUserRole (
                    input: {
                      userName: "test@email.gc.ca"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: ADMIN
                    }
                  ) {
                    result {
                      ... on UpdateUserRoleResult {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const error = {
                data: {
                  updateUserRole: {
                    result: {
                      code: 400,
                      description:
                        'Permission Denied: Please contact organization admin for help with updating user roles.',
                    },
                  },
                },
              }

              expect(response).toEqual(error)
              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to lower user: ${secondaryUser._key} from super_admin to: admin.`,
              ])
            })
          })
        })
        describe('user attempts to update users role to user', () => {
          describe('requested users current role is super admin', () => {
            beforeEach(async () => {
              await collections.affiliations.save({
                _from: org._id,
                _to: user._id,
                permission: 'super_admin',
              })
              await collections.affiliations.save({
                _from: org._id,
                _to: secondaryUser._id,
                permission: 'super_admin',
              })
            })
            it('returns an error message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  updateUserRole (
                    input: {
                      userName: "test@email.gc.ca"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: USER
                    }
                  ) {
                    result {
                      ... on UpdateUserRoleResult {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const error = {
                data: {
                  updateUserRole: {
                    result: {
                      code: 400,
                      description:
                        'Permission Denied: Please contact organization admin for help with updating user roles.',
                    },
                  },
                },
              }

              expect(response).toEqual(error)
              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to lower user: ${secondaryUser._key} from super_admin to: user.`,
              ])
            })
          })
        })
      })
      describe('requesting users role is admin', () => {
        describe('requested users role is super admin', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'admin',
            })
            await collections.affiliations.save({
              _from: org._id,
              _to: secondaryUser._id,
              permission: 'super_admin',
            })
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test@email.gc.ca"
                    orgId: "${toGlobalId('organizations', org._key)}"
                    role: USER
                  }
                ) {
                  result {
                    ... on UpdateUserRoleResult {
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
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                  loadUserByUserName: loadUserByUserName({ query }),
                },
                validators: {
                  cleanseInput,
                },
              },
            )

            const error = {
              data: {
                updateUserRole: {
                  result: {
                    code: 400,
                    description:
                      'Permission Denied: Please contact organization admin for help with updating user roles.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to lower user: ${secondaryUser._key} from super_admin to: user.`,
            ])
          })
        })
        describe('requested users current role is admin', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'admin',
            })
            await collections.affiliations.save({
              _from: org._id,
              _to: secondaryUser._id,
              permission: 'admin',
            })
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test@email.gc.ca"
                    orgId: "${toGlobalId('organizations', org._key)}"
                    role: USER
                  }
                ) {
                  result {
                    ... on UpdateUserRoleResult {
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
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                  loadUserByUserName: loadUserByUserName({ query }),
                },
                validators: {
                  cleanseInput,
                },
              },
            )

            const error = {
              data: {
                updateUserRole: {
                  result: {
                    code: 400,
                    description:
                      'Permission Denied: Please contact organization admin for help with updating user roles.',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to lower user: ${secondaryUser._key} from admin to: user.`,
            ])
          })
        })
      })
    })
    describe('database error occurs', () => {
      let org, secondaryUser
      beforeEach(async () => {
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

        secondaryUser = await collections.users.save({
          displayName: 'Test Account',
          userName: 'test@email.gc.ca',
          preferredLang: 'english',
        })

        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
        await collections.affiliations.save({
          _from: org._id,
          _to: secondaryUser._id,
          permission: 'user',
        })
      })
      describe('when getting current affiliation', () => {
        it('returns an error message', async () => {
          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "test@email.gc.ca"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: USER
                }
              ) {
                result {
                  ... on UpdateUserRoleResult {
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
              query: mockedQuery,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query }),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [
            new GraphQLError(`Unable to update user's role. Please try again.`),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when user: ${user._key} attempted to update a user's: ${secondaryUser._key} role, error: Error: Database error occurred.`,
          ])
        })
      })
    })
    describe('transaction error occurs', () => {
      let org, secondaryUser
      beforeEach(async () => {
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

        secondaryUser = await collections.users.save({
          displayName: 'Test Account',
          userName: 'test@email.gc.ca',
          preferredLang: 'english',
        })

        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
        await collections.affiliations.save({
          _from: org._id,
          _to: secondaryUser._id,
          permission: 'user',
        })
      })
      describe('when running transaction', () => {
        it('returns an error message', async () => {
          const mockedTransaction = jest.fn().mockReturnValue({
            step() {
              throw new Error('Transaction error occurred.')
            },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "test@email.gc.ca"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
                }
              ) {
                result {
                  ... on UpdateUserRoleResult {
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
              transaction: mockedTransaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query }),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [
            new GraphQLError(`Unable to update user's role. Please try again.`),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction step error occurred when user: ${user._key} attempted to update a user's: ${secondaryUser._key} role, error: Error: Transaction error occurred.`,
          ])
        })
      })
      describe('when committing transaction', () => {
        it('returns an error message', async () => {
          const mockedTransaction = jest.fn().mockReturnValue({
            step() {
              return undefined
            },
            commit() {
              throw new Error('Transaction error occurred.')
            },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "test@email.gc.ca"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
                }
              ) {
                result {
                  ... on UpdateUserRoleResult {
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
              transaction: mockedTransaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query }),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [
            new GraphQLError(`Unable to update user's role. Please try again.`),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction commit error occurred when user: ${user._key} attempted to update a user's: ${secondaryUser._key} role, error: Error: Transaction error occurred.`,
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
    describe('given a successful role update', () => {
      let org, secondaryUser
      beforeEach(async () => {
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
        secondaryUser = await collections.users.save({
          displayName: 'Test Account',
          userName: 'test@email.gc.ca',
          preferredLang: 'english',
        })
      })
      describe('requesting user is a super admin', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        describe('update user from admin', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: secondaryUser._id,
              permission: 'admin',
            })
          })
          describe('to super admin', () => {
            it('returns status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  updateUserRole (
                    input: {
                      userName: "test@email.gc.ca"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: SUPER_ADMIN
                    }
                  ) {
                    result {
                      ... on UpdateUserRoleResult {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: 'todo',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to super_admin in org: treasury-board-secretariat.`,
              ])
            })
          })
          describe('to user', () => {
            it('returns status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  updateUserRole (
                    input: {
                      userName: "test@email.gc.ca"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: USER
                    }
                  ) {
                    result {
                      ... on UpdateUserRoleResult {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: 'todo',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to user in org: treasury-board-secretariat.`,
              ])
            })
          })
        })
        describe('update user from user', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: secondaryUser._id,
              permission: 'user',
            })
          })
          describe('to super admin', () => {
            it('returns status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  updateUserRole (
                    input: {
                      userName: "test@email.gc.ca"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: SUPER_ADMIN
                    }
                  ) {
                    result {
                      ... on UpdateUserRoleResult {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: 'todo',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to super_admin in org: treasury-board-secretariat.`,
              ])
            })
          })
          describe('to admin', () => {
            it('returns status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  updateUserRole (
                    input: {
                      userName: "test@email.gc.ca"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: ADMIN
                    }
                  ) {
                    result {
                      ... on UpdateUserRoleResult {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: 'todo',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to admin in org: treasury-board-secretariat.`,
              ])
            })
          })
        })
      })
      describe('requesting user is admin', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        describe('update user from user', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: secondaryUser._id,
              permission: 'user',
            })
          })
          describe('to admin', () => {
            it('returns status message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  updateUserRole (
                    input: {
                      userName: "test@email.gc.ca"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: ADMIN
                    }
                  ) {
                    result {
                      ... on UpdateUserRoleResult {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: 'todo',
                    },
                  },
                },
              }

              expect(response).toEqual(expectedResponse)
              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to admin in org: treasury-board-secretariat.`,
              ])
            })
          })
        })
      })
    })
    describe('given an unsuccessful role update', () => {
      let org, secondaryUser
      beforeEach(async () => {
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

        secondaryUser = await collections.users.save({
          displayName: 'Test Account',
          userName: 'test@email.gc.ca',
          preferredLang: 'english',
        })
      })
      describe('user attempts to update their own role', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "test.account@istio.actually.exists"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
                }
              ) {
                result {
                  ... on UpdateUserRoleResult {
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
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query }),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = {
            data: {
              updateUserRole: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update their own role in org: ${org._key}.`,
          ])
        })
      })
      describe('user attempts to update a user that does not exist', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "random@email.ca"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
                }
              ) {
                result {
                  ... on UpdateUserRoleResult {
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
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query }),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = {
            data: {
              updateUserRole: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update a user: random@email.ca role in org: ${org._key}, however there is no user associated with that user name.`,
          ])
        })
      })
      describe('user attempts to update a users role in an org that does not exist', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "test@email.gc.ca"
                  orgId: "${toGlobalId('organizations', 1)}"
                  role: ADMIN
                }
              ) {
                result {
                  ... on UpdateUserRoleResult {
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
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query }),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = {
            data: {
              updateUserRole: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update a user: ${secondaryUser._key} role in org: 1, however there is no org associated with that id.`,
          ])
        })
      })
      describe('requesting user permission is user', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
        })
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "test@email.gc.ca"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
                }
              ) {
                result {
                  ... on UpdateUserRoleResult {
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
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query }),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = {
            data: {
              updateUserRole: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update a user: ${secondaryUser._key} role in org: treasury-board-secretariat, however they do not have permission to do so.`,
          ])
        })
      })
      describe('user attempts to update a users role in an org that the requesting user does not belong to', () => {
        let secondaryOrg
        beforeEach(async () => {
          secondaryOrg = await collections.organizations.save({
            verified: false,
            orgDetails: {
              en: {
                slug: 'communications-security-establishment',
                acronym: 'CSE',
                name: 'Communications Security Establishment',
                zone: 'FED',
                sector: 'DND',
                country: 'Canada',
                province: 'Ontario',
                city: 'Ottawa',
              },
              fr: {
                slug: 'centre-de-la-securite-des-telecommunications',
                acronym: 'CST',
                name: 'Centre de la Securite des Telecommunications',
                zone: 'FED',
                sector: 'DND',
                country: 'Canada',
                province: 'Ontario',
                city: 'Ottawa',
              },
            },
          })
          await collections.affiliations.save({
            _from: secondaryOrg._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "test@email.gc.ca"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
                }
              ) {
                result {
                  ... on UpdateUserRoleResult {
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
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query }),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = {
            data: {
              updateUserRole: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update a user: ${secondaryUser._key} role in org: treasury-board-secretariat, however they do not have permission to do so.`,
          ])
        })
      })
      describe('user attempts to update a user that does not belong to the requested org', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "test@email.gc.ca"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
                }
              ) {
                result {
                  ... on UpdateUserRoleResult {
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
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query }),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = {
            data: {
              updateUserRole: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update a user: ${secondaryUser._key} role in org: treasury-board-secretariat, however that user does not have an affiliation with that organization.`,
          ])
        })
      })
      describe('requesting users role is super admin', () => {
        describe('user attempts to update users role to admin', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'super_admin',
            })
            await collections.affiliations.save({
              _from: org._id,
              _to: secondaryUser._id,
              permission: 'super_admin',
            })
          })
          describe('requested users current role is super admin', () => {
            it('returns an error message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  updateUserRole (
                    input: {
                      userName: "test@email.gc.ca"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: ADMIN
                    }
                  ) {
                    result {
                      ... on UpdateUserRoleResult {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const error = {
                data: {
                  updateUserRole: {
                    result: {
                      code: 400,
                      description: 'todo',
                    },
                  },
                },
              }

              expect(response).toEqual(error)
              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to lower user: ${secondaryUser._key} from super_admin to: admin.`,
              ])
            })
          })
        })
        describe('user attempts to update users role to user', () => {
          describe('requested users current role is super admin', () => {
            beforeEach(async () => {
              await collections.affiliations.save({
                _from: org._id,
                _to: user._id,
                permission: 'super_admin',
              })
              await collections.affiliations.save({
                _from: org._id,
                _to: secondaryUser._id,
                permission: 'super_admin',
              })
            })
            it('returns an error message', async () => {
              const response = await graphql(
                schema,
                `
                mutation {
                  updateUserRole (
                    input: {
                      userName: "test@email.gc.ca"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: USER
                    }
                  ) {
                    result {
                      ... on UpdateUserRoleResult {
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
                    checkPermission: checkPermission({
                      userKey: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userKey: user._key,
                      loadUserByKey: loadUserByKey({ query }),
                    }),
                    verifiedRequired: verifiedRequired({ i18n }),
                  },
                  loaders: {
                    loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                    loadUserByKey: loadUserByKey({ query }),
                    loadUserByUserName: loadUserByUserName({ query }),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const error = {
                data: {
                  updateUserRole: {
                    result: {
                      code: 400,
                      description: 'todo',
                    },
                  },
                },
              }

              expect(response).toEqual(error)
              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to lower user: ${secondaryUser._key} from super_admin to: user.`,
              ])
            })
          })
        })
      })
      describe('requesting users role is admin', () => {
        describe('requested users role is super admin', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'admin',
            })
            await collections.affiliations.save({
              _from: org._id,
              _to: secondaryUser._id,
              permission: 'super_admin',
            })
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test@email.gc.ca"
                    orgId: "${toGlobalId('organizations', org._key)}"
                    role: USER
                  }
                ) {
                  result {
                    ... on UpdateUserRoleResult {
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
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                  loadUserByUserName: loadUserByUserName({ query }),
                },
                validators: {
                  cleanseInput,
                },
              },
            )

            const error = {
              data: {
                updateUserRole: {
                  result: {
                    code: 400,
                    description: 'todo',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to lower user: ${secondaryUser._key} from super_admin to: user.`,
            ])
          })
        })
        describe('requested users current role is admin', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'admin',
            })
            await collections.affiliations.save({
              _from: org._id,
              _to: secondaryUser._id,
              permission: 'admin',
            })
          })
          it('returns an error message', async () => {
            const response = await graphql(
              schema,
              `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test@email.gc.ca"
                    orgId: "${toGlobalId('organizations', org._key)}"
                    role: USER
                  }
                ) {
                  result {
                    ... on UpdateUserRoleResult {
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
                  checkPermission: checkPermission({
                    userKey: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userKey: user._key,
                    loadUserByKey: loadUserByKey({ query }),
                  }),
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                  loadUserByKey: loadUserByKey({ query }),
                  loadUserByUserName: loadUserByUserName({ query }),
                },
                validators: {
                  cleanseInput,
                },
              },
            )

            const error = {
              data: {
                updateUserRole: {
                  result: {
                    code: 400,
                    description: 'todo',
                  },
                },
              },
            }

            expect(response).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to lower user: ${secondaryUser._key} from admin to: user.`,
            ])
          })
        })
      })
    })
    describe('database error occurs', () => {
      let org, secondaryUser
      beforeEach(async () => {
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

        secondaryUser = await collections.users.save({
          displayName: 'Test Account',
          userName: 'test@email.gc.ca',
          preferredLang: 'english',
        })

        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
        await collections.affiliations.save({
          _from: org._id,
          _to: secondaryUser._id,
          permission: 'user',
        })
      })
      describe('when getting current affiliation', () => {
        it('returns an error message', async () => {
          const mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "test@email.gc.ca"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: USER
                }
              ) {
                result {
                  ... on UpdateUserRoleResult {
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
              query: mockedQuery,
              collections,
              transaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query }),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when user: ${user._key} attempted to update a user's: ${secondaryUser._key} role, error: Error: Database error occurred.`,
          ])
        })
      })
    })
    describe('transaction error occurs', () => {
      let org, secondaryUser
      beforeEach(async () => {
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
        secondaryUser = await collections.users.save({
          displayName: 'Test Account',
          userName: 'test@email.gc.ca',
          preferredLang: 'english',
        })

        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'admin',
        })
        await collections.affiliations.save({
          _from: org._id,
          _to: secondaryUser._id,
          permission: 'user',
        })
      })
      describe('when running transaction', () => {
        it('returns an error message', async () => {
          const mockedTransaction = jest.fn().mockReturnValue({
            step() {
              throw new Error('Transaction error occurred.')
            },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "test@email.gc.ca"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
                }
              ) {
                result {
                  ... on UpdateUserRoleResult {
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
              transaction: mockedTransaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query }),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction step error occurred when user: ${user._key} attempted to update a user's: ${secondaryUser._key} role, error: Error: Transaction error occurred.`,
          ])
        })
      })
      describe('when committing transaction', () => {
        it('returns an error message', async () => {
          const mockedTransaction = jest.fn().mockReturnValue({
            step() {
              return undefined
            },
            commit() {
              throw new Error('Transaction error occurred.')
            },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "test@email.gc.ca"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
                }
              ) {
                result {
                  ... on UpdateUserRoleResult {
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
              transaction: mockedTransaction,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadUserByUserName: loadUserByUserName({ query }),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction commit error occurred when user: ${user._key} attempted to update a user's: ${secondaryUser._key} role, error: Error: Transaction error occurred.`,
          ])
        })
      })
    })
  })
})
