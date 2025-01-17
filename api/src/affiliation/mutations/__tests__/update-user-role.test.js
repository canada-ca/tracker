import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { setupI18n } from '@lingui/core'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { checkPermission, userRequired, verifiedRequired, tfaRequired } from '../../../auth'
import { loadUserByUserName, loadUserByKey } from '../../../user/loaders'
import { loadOrgByKey } from '../../../organization/loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('update a users role', () => {
  let query, drop, truncate, schema, collections, transaction, i18n, user

  let consoleOutput = []
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
    consoleOutput = []
  })

  describe('given a successful role update', () => {
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
        tfaSendMethod: 'email',
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('users language is set to english', () => {
      let org, secondaryUser
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
              const response = await graphql({
                schema,
                source: `
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
                        user {
                          displayName
                        }
                      }
                      ... on AffiliationError {
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
                  request: { ip: '127.0.0.1' },
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
                    tfaRequired: tfaRequired({ i18n }),
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
              })

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: 'User role was updated successfully.',
                      user: {
                        displayName: 'Test Account',
                      },
                    },
                  },
                },
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to super_admin in org: treasury-board-secretariat.`,
              ])
              expect(response).toEqual(expectedResponse)
            })
          })
          describe('to user', () => {
            it('returns status message', async () => {
              const response = await graphql({
                schema,
                source: `
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
                        user {
                          displayName
                        }
                      }
                      ... on AffiliationError {
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
                  request: { ip: '127.0.0.1' },
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
                    tfaRequired: tfaRequired({ i18n }),
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
              })

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: 'User role was updated successfully.',
                      user: {
                        displayName: 'Test Account',
                      },
                    },
                  },
                },
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to user in org: treasury-board-secretariat.`,
              ])
              expect(response).toEqual(expectedResponse)
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
              const response = await graphql({
                schema,
                source: `
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
                        user {
                          displayName
                        }
                      }
                      ... on AffiliationError {
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
                  request: { ip: '127.0.0.1' },
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
                    tfaRequired: tfaRequired({ i18n }),
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
              })

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: 'User role was updated successfully.',
                      user: {
                        displayName: 'Test Account',
                      },
                    },
                  },
                },
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to super_admin in org: treasury-board-secretariat.`,
              ])
              expect(response).toEqual(expectedResponse)
            })
          })
          describe('to admin', () => {
            it('returns status message', async () => {
              const response = await graphql({
                schema,
                source: `
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
                        user {
                          displayName
                        }
                      }
                      ... on AffiliationError {
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
                  request: { ip: '127.0.0.1' },
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
                    tfaRequired: tfaRequired({ i18n }),
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
              })

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: 'User role was updated successfully.',
                      user: {
                        displayName: 'Test Account',
                      },
                    },
                  },
                },
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to admin in org: treasury-board-secretariat.`,
              ])
              expect(response).toEqual(expectedResponse)
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
              const response = await graphql({
                schema,
                source: `
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
                        user {
                          displayName
                        }
                      }
                      ... on AffiliationError {
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
                  request: { ip: '127.0.0.1' },
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
                    tfaRequired: tfaRequired({ i18n }),
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
              })

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: 'User role was updated successfully.',
                      user: {
                        displayName: 'Test Account',
                      },
                    },
                  },
                },
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to admin in org: treasury-board-secretariat.`,
              ])
              expect(response).toEqual(expectedResponse)
            })
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
              const response = await graphql({
                schema,
                source: `
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
                        user {
                          displayName
                        }
                      }
                      ... on AffiliationError {
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
                  request: { ip: '127.0.0.1' },
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
                    tfaRequired: tfaRequired({ i18n }),
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
              })

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: "Le rôle de l'utilisateur a été mis à jour avec succès.",
                      user: {
                        displayName: 'Test Account',
                      },
                    },
                  },
                },
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to super_admin in org: treasury-board-secretariat.`,
              ])
              expect(response).toEqual(expectedResponse)
            })
          })
          describe('to user', () => {
            it('returns status message', async () => {
              const response = await graphql({
                schema,
                source: `
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
                        user {
                          displayName
                        }
                      }
                      ... on AffiliationError {
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
                  request: { ip: '127.0.0.1' },
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
                    tfaRequired: tfaRequired({ i18n }),
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
              })

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: "Le rôle de l'utilisateur a été mis à jour avec succès.",
                      user: {
                        displayName: 'Test Account',
                      },
                    },
                  },
                },
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to user in org: treasury-board-secretariat.`,
              ])
              expect(response).toEqual(expectedResponse)
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
              const response = await graphql({
                schema,
                source: `
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
                        user {
                          displayName
                        }
                      }
                      ... on AffiliationError {
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
                  request: { ip: '127.0.0.1' },
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
                    tfaRequired: tfaRequired({ i18n }),
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
              })

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: "Le rôle de l'utilisateur a été mis à jour avec succès.",
                      user: {
                        displayName: 'Test Account',
                      },
                    },
                  },
                },
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to super_admin in org: treasury-board-secretariat.`,
              ])
              expect(response).toEqual(expectedResponse)
            })
          })
          describe('to admin', () => {
            it('returns status message', async () => {
              const response = await graphql({
                schema,
                source: `
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
                        user {
                          displayName
                        }
                      }
                      ... on AffiliationError {
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
                  request: { ip: '127.0.0.1' },
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
                    tfaRequired: tfaRequired({ i18n }),
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
              })

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: "Le rôle de l'utilisateur a été mis à jour avec succès.",
                      user: {
                        displayName: 'Test Account',
                      },
                    },
                  },
                },
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to admin in org: treasury-board-secretariat.`,
              ])
              expect(response).toEqual(expectedResponse)
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
              const response = await graphql({
                schema,
                source: `
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
                        user {
                          displayName
                        }
                      }
                      ... on AffiliationError {
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
                  request: { ip: '127.0.0.1' },
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
                    tfaRequired: tfaRequired({ i18n }),
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
              })

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    result: {
                      status: "Le rôle de l'utilisateur a été mis à jour avec succès.",
                      user: {
                        displayName: 'Test Account',
                      },
                    },
                  },
                },
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} successful updated user: ${secondaryUser._key} role to admin in org: treasury-board-secretariat.`,
              ])
              expect(response).toEqual(expectedResponse)
            })
          })
        })
      })
    })
  })
  describe('given an unsuccessful update', () => {
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
      describe('given an unsuccessful role update', () => {
        describe('user attempts to update their own role', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test.account@istio.actually.exists"
                    orgId: "${toGlobalId('organizations', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn(),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn(),
                  },
                  loadUserByUserName: {
                    load: jest.fn(),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

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

            expect(consoleOutput).toEqual([`User: 123 attempted to update their own role in org: 123.`])
            expect(response).toEqual(error)
          })
        })
        describe('user attempts to update a user that does not exist', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateUserRole (
                  input: {
                    userName: "random@email.ca"
                    orgId: "${toGlobalId('organizations', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn(),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn(),
                  },
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

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

            expect(consoleOutput).toEqual([
              `User: 123 attempted to update a user: random@email.ca role in org: 123, however there is no user associated with that user name.`,
            ])
            expect(response).toEqual(error)
          })
        })
        describe('user attempts to update a users role in an org that does not exist', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn(),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

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

            expect(consoleOutput).toEqual([
              `User: 123 attempted to update a user: 456 role in org: 1, however there is no org associated with that id.`,
            ])
            expect(response).toEqual(error)
          })
        })
        describe('requesting user permission is user', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test@email.gc.ca"
                    orgId: "${toGlobalId('organizations', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('user'),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

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

            expect(consoleOutput).toEqual([
              `User: 123 attempted to update a user: 456 role in org: treasury-board-secretariat, however they do not have permission to do so.`,
            ])
            expect(response).toEqual(error)
          })
        })
        describe('user attempts to update a users role in an org that the requesting user does not belong to', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test@email.gc.ca"
                    orgId: "${toGlobalId('organizations', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockReturnValue({ count: 0 }),
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue(undefined),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

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

            expect(consoleOutput).toEqual([
              `User: 123 attempted to update a user: 456 role in org: treasury-board-secretariat, however they do not have permission to do so.`,
            ])
            expect(response).toEqual(error)
          })
        })
        describe('user attempts to update a user that does not belong to the requested org', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test@email.gc.ca"
                    orgId: "${toGlobalId('organizations', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockReturnValue({ count: 0 }),
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = {
              data: {
                updateUserRole: {
                  result: {
                    code: 400,
                    description: 'Unable to update role: user does not belong to organization.',
                  },
                },
              },
            }

            expect(consoleOutput).toEqual([
              `User: 123 attempted to update a user: 456 role in org: treasury-board-secretariat, however that user does not have an affiliation with that organization.`,
            ])
            expect(response).toEqual(error)
          })
        })
        describe('requesting users role is admin', () => {
          describe('requested users role is super admin', () => {
            it('returns an error message', async () => {
              const response = await graphql({
                schema,
                source: `
                mutation {
                  updateUserRole (
                    input: {
                      userName: "test@email.gc.ca"
                      orgId: "${toGlobalId('organizations', 123)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query: jest.fn().mockReturnValue({
                    count: 1,
                    next: jest.fn().mockReturnValue({ permission: 'super_admin' }),
                  }),
                  collections: collectionNames,
                  transaction: jest.fn(),
                  userKey: 123,
                  request: { ip: '127.0.0.1' },
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('admin'),
                    userRequired: jest.fn().mockReturnValue({
                      userName: 'test.account@istio.actually.exists',
                    }),
                    verifiedRequired: jest.fn(),
                    tfaRequired: jest.fn(),
                  },
                  loaders: {
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        slug: 'treasury-board-secretariat',
                      }),
                    },
                    loadUserByUserName: {
                      load: jest.fn().mockReturnValue({
                        _key: 456,
                      }),
                    },
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              })

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

              expect(consoleOutput).toEqual([
                `User: 123 attempted to update a user: 456 role in org: treasury-board-secretariat, however they do not have permission to update a super_admin.`,
              ])
              expect(response).toEqual(error)
            })
          })
        })
      })
      describe('database error occurs', () => {
        describe('when getting current affiliation', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test@email.gc.ca"
                    orgId: "${toGlobalId('organizations', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockRejectedValue(new Error('database error')),
                collections: collectionNames,
                transaction: jest.fn(),
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = [new GraphQLError(`Unable to update user's role. Please try again.`)]

            expect(consoleOutput).toEqual([
              `Database error occurred when user: 123 attempted to update a user's: 456 role, error: Error: database error`,
            ])
            expect(response.errors).toEqual(error)
          })
        })
      })
      describe('cursor error occur', () => {
        describe('when gathering affiliation info', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test@email.gc.ca"
                    orgId: "${toGlobalId('organizations', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockReturnValue({
                  count: 1,
                  next: jest.fn().mockRejectedValue(new Error('cursor error')),
                }),
                collections: collectionNames,
                transaction: jest.fn(),
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = [new GraphQLError(`Unable to update user's role. Please try again.`)]

            expect(consoleOutput).toEqual([
              `Cursor error occurred when user: 123 attempted to update a user's: 456 role, error: Error: cursor error`,
            ])
            expect(response.errors).toEqual(error)
          })
        })
      })
      describe('transaction error occurs', () => {
        describe('when running transaction', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test@email.gc.ca"
                    orgId: "${toGlobalId('organizations', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockReturnValue({
                  count: 1,
                  next: jest.fn().mockReturnValue({ permission: 'user' }),
                }),
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockRejectedValue('trx step error'),
                  abort: jest.fn(),
                }),
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = [new GraphQLError(`Unable to update user's role. Please try again.`)]

            expect(consoleOutput).toEqual([
              `Transaction step error occurred when user: 123 attempted to update a user's: 456 role, error: trx step error`,
            ])
            expect(response.errors).toEqual(error)
          })
        })
        describe('when committing transaction', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test@email.gc.ca"
                    orgId: "${toGlobalId('organizations', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockReturnValue({
                  count: 1,
                  next: jest.fn().mockReturnValue({ permission: 'user' }),
                }),
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn(),
                  commit: jest.fn().mockRejectedValue('trx commit error'),
                  abort: jest.fn(),
                }),
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = [new GraphQLError(`Unable to update user's role. Please try again.`)]

            expect(consoleOutput).toEqual([
              `Transaction commit error occurred when user: 123 attempted to update a user's: 456 role, error: trx commit error`,
            ])
            expect(response.errors).toEqual(error)
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
      describe('given an unsuccessful role update', () => {
        describe('user attempts to update their own role', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test.account@istio.actually.exists"
                    orgId: "${toGlobalId('organizations', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn(),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn(),
                  },
                  loadUserByUserName: {
                    load: jest.fn(),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = {
              data: {
                updateUserRole: {
                  result: {
                    code: 400,
                    description: 'Impossible de mettre à jour votre propre rôle.',
                  },
                },
              },
            }

            expect(consoleOutput).toEqual([`User: 123 attempted to update their own role in org: 123.`])
            expect(response).toEqual(error)
          })
        })
        describe('user attempts to update a user that does not exist', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateUserRole (
                  input: {
                    userName: "random@email.ca"
                    orgId: "${toGlobalId('organizations', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn(),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn(),
                  },
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = {
              data: {
                updateUserRole: {
                  result: {
                    code: 400,
                    description: 'Impossible de mettre à jour le rôle : utilisateur inconnu.',
                  },
                },
              },
            }

            expect(consoleOutput).toEqual([
              `User: 123 attempted to update a user: random@email.ca role in org: 123, however there is no user associated with that user name.`,
            ])
            expect(response).toEqual(error)
          })
        })
        describe('user attempts to update a users role in an org that does not exist', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn(),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = {
              data: {
                updateUserRole: {
                  result: {
                    code: 400,
                    description: 'Impossible de mettre à jour le rôle : organisation inconnue.',
                  },
                },
              },
            }

            expect(consoleOutput).toEqual([
              `User: 123 attempted to update a user: 456 role in org: 1, however there is no org associated with that id.`,
            ])
            expect(response).toEqual(error)
          })
        })
        describe('requesting user permission is user', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test@email.gc.ca"
                    orgId: "${toGlobalId('organizations', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query,
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('user'),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = {
              data: {
                updateUserRole: {
                  result: {
                    code: 400,
                    description:
                      "Permission refusée : Veuillez contacter l'administrateur de l'organisation pour obtenir de l'aide sur les changements de rôle des utilisateurs.",
                  },
                },
              },
            }

            expect(consoleOutput).toEqual([
              `User: 123 attempted to update a user: 456 role in org: treasury-board-secretariat, however they do not have permission to do so.`,
            ])
            expect(response).toEqual(error)
          })
        })
        describe('user attempts to update a users role in an org that the requesting user does not belong to', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test@email.gc.ca"
                    orgId: "${toGlobalId('organizations', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockReturnValue({ count: 0 }),
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue(undefined),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = {
              data: {
                updateUserRole: {
                  result: {
                    code: 400,
                    description:
                      "Permission refusée : Veuillez contacter l'administrateur de l'organisation pour obtenir de l'aide sur les changements de rôle des utilisateurs.",
                  },
                },
              },
            }

            expect(consoleOutput).toEqual([
              `User: 123 attempted to update a user: 456 role in org: treasury-board-secretariat, however they do not have permission to do so.`,
            ])
            expect(response).toEqual(error)
          })
        })
        describe('user attempts to update a user that does not belong to the requested org', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test@email.gc.ca"
                    orgId: "${toGlobalId('organizations', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockReturnValue({ count: 0 }),
                collections: collectionNames,
                transaction,
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = {
              data: {
                updateUserRole: {
                  result: {
                    code: 400,
                    description:
                      "Impossible de mettre à jour le rôle : l'utilisateur n'appartient pas à l'organisation.",
                  },
                },
              },
            }

            expect(consoleOutput).toEqual([
              `User: 123 attempted to update a user: 456 role in org: treasury-board-secretariat, however that user does not have an affiliation with that organization.`,
            ])
            expect(response).toEqual(error)
          })
        })

        describe('requesting users role is admin', () => {
          describe('requested users role is super admin', () => {
            it('returns an error message', async () => {
              const response = await graphql({
                schema,
                source: `
                mutation {
                  updateUserRole (
                    input: {
                      userName: "test@email.gc.ca"
                      orgId: "${toGlobalId('organizations', 123)}"
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
                rootValue: null,
                contextValue: {
                  i18n,
                  query: jest.fn().mockReturnValue({
                    count: 1,
                    next: jest.fn().mockReturnValue({ permission: 'super_admin' }),
                  }),
                  collections: collectionNames,
                  transaction: jest.fn(),
                  userKey: 123,
                  request: { ip: '127.0.0.1' },
                  auth: {
                    checkPermission: jest.fn().mockReturnValue('admin'),
                    userRequired: jest.fn().mockReturnValue({
                      userName: 'test.account@istio.actually.exists',
                    }),
                    verifiedRequired: jest.fn(),
                    tfaRequired: jest.fn(),
                  },
                  loaders: {
                    loadOrgByKey: {
                      load: jest.fn().mockReturnValue({
                        slug: 'treasury-board-secretariat',
                      }),
                    },
                    loadUserByUserName: {
                      load: jest.fn().mockReturnValue({
                        _key: 456,
                      }),
                    },
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              })

              const error = {
                data: {
                  updateUserRole: {
                    result: {
                      code: 400,
                      description:
                        "Permission refusée : Veuillez contacter l'administrateur de l'organisation pour obtenir de l'aide sur les changements de rôle des utilisateurs.",
                    },
                  },
                },
              }

              expect(consoleOutput).toEqual([
                `User: 123 attempted to update a user: 456 role in org: treasury-board-secretariat, however they do not have permission to update a super_admin.`,
              ])
              expect(response).toEqual(error)
            })
          })
        })
      })
      describe('database error occurs', () => {
        describe('when getting current affiliation', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test@email.gc.ca"
                    orgId: "${toGlobalId('organizations', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockRejectedValue(new Error('database error')),
                collections: collectionNames,
                transaction: jest.fn(),
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = [
              new GraphQLError(`Impossible de mettre à jour le rôle de l'utilisateur. Veuillez réessayer.`),
            ]

            expect(consoleOutput).toEqual([
              `Database error occurred when user: 123 attempted to update a user's: 456 role, error: Error: database error`,
            ])
            expect(response.errors).toEqual(error)
          })
        })
      })
      describe('cursor error occur', () => {
        describe('when gathering affiliation info', () => {
          it('throws an error', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test@email.gc.ca"
                    orgId: "${toGlobalId('organizations', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockReturnValue({
                  count: 1,
                  next: jest.fn().mockRejectedValue(new Error('cursor error')),
                }),
                collections: collectionNames,
                transaction: jest.fn(),
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = [
              new GraphQLError(`Impossible de mettre à jour le rôle de l'utilisateur. Veuillez réessayer.`),
            ]

            expect(consoleOutput).toEqual([
              `Cursor error occurred when user: 123 attempted to update a user's: 456 role, error: Error: cursor error`,
            ])
            expect(response.errors).toEqual(error)
          })
        })
      })
      describe('transaction error occurs', () => {
        describe('when running transaction', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test@email.gc.ca"
                    orgId: "${toGlobalId('organizations', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockReturnValue({
                  count: 1,
                  next: jest.fn().mockReturnValue({ permission: 'user' }),
                }),
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn().mockRejectedValue('trx step error'),
                  abort: jest.fn(),
                }),
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = [
              new GraphQLError(`Impossible de mettre à jour le rôle de l'utilisateur. Veuillez réessayer.`),
            ]

            expect(consoleOutput).toEqual([
              `Transaction step error occurred when user: 123 attempted to update a user's: 456 role, error: trx step error`,
            ])
            expect(response.errors).toEqual(error)
          })
        })
        describe('when committing transaction', () => {
          it('returns an error message', async () => {
            const response = await graphql({
              schema,
              source: `
              mutation {
                updateUserRole (
                  input: {
                    userName: "test@email.gc.ca"
                    orgId: "${toGlobalId('organizations', 123)}"
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
              rootValue: null,
              contextValue: {
                i18n,
                query: jest.fn().mockReturnValue({
                  count: 1,
                  next: jest.fn().mockReturnValue({ permission: 'user' }),
                }),
                collections: collectionNames,
                transaction: jest.fn().mockReturnValue({
                  step: jest.fn(),
                  commit: jest.fn().mockRejectedValue('trx commit error'),
                  abort: jest.fn(),
                }),
                userKey: 123,
                request: { ip: '127.0.0.1' },
                auth: {
                  checkPermission: jest.fn().mockReturnValue('admin'),
                  userRequired: jest.fn().mockReturnValue({
                    userName: 'test.account@istio.actually.exists',
                  }),
                  verifiedRequired: jest.fn(),
                  tfaRequired: jest.fn(),
                },
                loaders: {
                  loadOrgByKey: {
                    load: jest.fn().mockReturnValue({
                      slug: 'treasury-board-secretariat',
                    }),
                  },
                  loadUserByUserName: {
                    load: jest.fn().mockReturnValue({
                      _key: 456,
                    }),
                  },
                },
                validators: {
                  cleanseInput,
                },
              },
            })

            const error = [
              new GraphQLError(`Impossible de mettre à jour le rôle de l'utilisateur. Veuillez réessayer.`),
            ]

            expect(consoleOutput).toEqual([
              `Transaction commit error occurred when user: 123 attempted to update a user's: 456 role, error: trx commit error`,
            ])
            expect(response.errors).toEqual(error)
          })
        })
      })
    })
  })
})
