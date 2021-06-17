import { setupI18n } from '@lingui/core'
import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { checkPermission, userRequired, verifiedRequired } from '../../../auth'
import { loadOrgByKey } from '../../../organization/loaders'
import { loadUserByKey } from '../../../user/loaders'
import { loadAffiliationByKey } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

// Create GQL Schema
const schema = new GraphQLSchema({
  query: createQuerySchema(),
  mutation: createMutationSchema(),
})

const i18n = setupI18n({
  locale: 'fr',
  localeData: {
    en: { plurals: {} },
    fr: { plurals: {} },
  },
  locales: ['en', 'fr'],
  messages: {
    fr: frenchMessages.messages,
  },
})

const orgOneData = {
  verified: true,
  summaries: {
    web: {
      pass: 50,
      fail: 1000,
      total: 1050,
    },
    mail: {
      pass: 50,
      fail: 1000,
      total: 1050,
    },
  },
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
}

const orgTwoData = {
  verified: true,
  summaries: {
    web: {
      pass: 50,
      fail: 1000,
      total: 1050,
    },
    mail: {
      pass: 50,
      fail: 1000,
      total: 1050,
    },
  },
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
}

const adminData = {
  userName: 'admin.account@istio.actually.exists',
  displayName: 'Test Admin',
  preferredLang: 'french',
  tfaValidated: false,
  emailValidated: true,
}

const userData = {
  userName: 'test.account@istio.actually.exists',
  displayName: 'Test Account',
  preferredLang: 'french',
  tfaValidated: false,
  emailValidated: true,
}

describe('removing a user from an organization', () => {
  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    // Generate DB Items
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
  })

  describe('users language is set to french', () => {
    describe('given a successful removal', () => {
      describe('user is a super admin', () => {
        describe('super admin can remove an admin from any org', () => {
          let query,
            drop,
            truncate,
            collections,
            transaction,
            orgOne,
            orgTwo,
            admin,
            user,
            affiliation
          beforeEach(async () => {
            ;({ query, drop, truncate, collections, transaction } =
              await ensure({
                type: 'database',
                name: 'sa_rm_admin_fr_' + dbNameFromFile(__filename),
                url,
                rootPassword: rootPass,
                options: databaseOptions({ rootPass }),
              }))

            orgOne = await collections.organizations.save(orgOneData)
            orgTwo = await collections.organizations.save(orgTwoData)

            admin = await collections.users.save(adminData)
            user = await collections.users.save(userData)

            await collections.affiliations.save({
              _from: orgTwo._id,
              _to: admin._id,
              permission: 'super_admin',
            })

            affiliation = await collections.affiliations.save({
              _from: orgOne._id,
              _to: user._id,
              permission: 'admin',
            })
          })

          afterEach(async () => {
            await truncate()
            consoleOutput.length = 0
          })

          afterAll(async () => {
            await drop()
          })

          it('returns a status message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeUserFromOrg (
                    input: {
                      userId: "${toGlobalId('users', user._key)}"
                      orgId: "${toGlobalId('organizations', orgOne._key)}"
                    }
                  ) {
                    result {
                      ... on RemoveUserFromOrgResult {
                        status
                        user {
                          id
                          userName
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
              null,
              {
                i18n,
                query,
                collections,
                transaction,
                userKey: admin._key,
                auth: {
                  checkPermission: checkPermission({
                    i18n,
                    userKey: admin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: admin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: admin._key,
                      i18n,
                    }),
                  }),
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'fr',
                    userKey: admin._key,
                    i18n,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                },
                validators: { cleanseInput },
              },
            )

            const expectedResponse = {
              data: {
                removeUserFromOrg: {
                  result: {
                    status:
                      "L'utilisateur a été retiré de l'organisation avec succès.",
                    user: {
                      id: toGlobalId('users', user._key),
                      userName: 'test.account@istio.actually.exists',
                    },
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${admin._key} successfully removed user: ${user._key} from org: ${orgOne._key}.`,
            ])
          })

          it('removes the user from the org', async () => {
            await graphql(
              schema,
              `
                mutation {
                  removeUserFromOrg (
                    input: {
                      userId: "${toGlobalId('users', user._key)}"
                      orgId: "${toGlobalId('organizations', orgOne._key)}"
                    }
                  ) {
                    result {
                      ... on RemoveUserFromOrgResult {
                        status
                        user {
                          id
                          userName
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
              null,
              {
                i18n,
                query,
                collections,
                transaction,
                userKey: admin._key,
                auth: {
                  checkPermission: checkPermission({
                    i18n,
                    userKey: admin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: admin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: admin._key,
                      i18n,
                    }),
                  }),
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'fr',
                    userKey: admin._key,
                    i18n,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                },
                validators: { cleanseInput },
              },
            )

            const loader = loadAffiliationByKey({
              query,
              userKey: admin._key,
              i18n,
            })

            const data = await loader.load(affiliation._key)

            expect(data).toEqual(undefined)
            expect(consoleOutput).toEqual([
              `User: ${admin._key} successfully removed user: ${user._key} from org: ${orgOne._key}.`,
            ])
          })
        })

        describe('super admin can remove a user from any org', () => {
          let query,
            drop,
            truncate,
            collections,
            transaction,
            orgOne,
            orgTwo,
            admin,
            user

          beforeEach(async () => {
            ;({ query, drop, truncate, collections, transaction } =
              await ensure({
                type: 'database',
                name: 'sa_rm_msg_fr_' + dbNameFromFile(__filename),
                url,
                rootPassword: rootPass,
                options: databaseOptions({ rootPass }),
              }))

            orgOne = await collections.organizations.save(orgOneData)
            orgTwo = await collections.organizations.save(orgTwoData)
            admin = await collections.users.save(adminData)
            user = await collections.users.save(userData)

            await collections.affiliations.save([
              {
                _from: orgTwo._id,
                _to: admin._id,
                permission: 'super_admin',
              },

              {
                _from: orgOne._id,
                _to: user._id,
                permission: 'user',
              },
            ])
          })

          afterEach(async () => {
            await truncate()
            consoleOutput.length = 0
          })

          afterAll(async () => {
            await drop()
          })

          it('returns a status message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeUserFromOrg (
                    input: {
                      userId: "${toGlobalId('users', user._key)}"
                      orgId: "${toGlobalId('organizations', orgOne._key)}"
                    }
                  ) {
                    result {
                      ... on RemoveUserFromOrgResult {
                        status
                        user {
                          id
                          userName
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
              null,
              {
                i18n,
                query,
                collections,
                transaction,
                userKey: admin._key,
                auth: {
                  checkPermission: checkPermission({
                    i18n,
                    userKey: admin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: admin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: admin._key,
                      i18n,
                    }),
                  }),
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'fr',
                    userKey: admin._key,
                    i18n,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                },
                validators: { cleanseInput },
              },
            )

            const expectedResponse = {
              data: {
                removeUserFromOrg: {
                  result: {
                    status:
                      "L'utilisateur a été retiré de l'organisation avec succès.",
                    user: {
                      id: toGlobalId('users', user._key),
                      userName: 'test.account@istio.actually.exists',
                    },
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${admin._key} successfully removed user: ${user._key} from org: ${orgOne._key}.`,
            ])
          })
        })

        describe('super admin can remove a user from any org', () => {
          let query,
            drop,
            truncate,
            collections,
            transaction,
            orgOne,
            orgTwo,
            admin,
            user,
            affiliation

          beforeEach(async () => {
            ;({ query, drop, truncate, collections, transaction } =
              await ensure({
                type: 'database',
                name: 'sa_rm_usr_fr_' + dbNameFromFile(__filename),
                url,
                rootPassword: rootPass,
                options: databaseOptions({ rootPass }),
              }))

            orgOne = await collections.organizations.save(orgOneData)
            orgTwo = await collections.organizations.save(orgTwoData)
            admin = await collections.users.save(adminData)
            user = await collections.users.save(userData)

            await collections.affiliations.save({
              _from: orgTwo._id,
              _to: admin._id,
              permission: 'super_admin',
            })

            affiliation = await collections.affiliations.save({
              _from: orgOne._id,
              _to: user._id,
              permission: 'user',
            })
          })

          afterEach(async () => {
            await truncate()
            consoleOutput.length = 0
          })

          afterAll(async () => {
            await drop()
          })

          it('removes the user from the org', async () => {
            await graphql(
              schema,
              `
                mutation {
                  removeUserFromOrg (
                    input: {
                      userId: "${toGlobalId('users', user._key)}"
                      orgId: "${toGlobalId('organizations', orgOne._key)}"
                    }
                  ) {
                    result {
                      ... on RemoveUserFromOrgResult {
                        status
                        user {
                          id
                          userName
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
              null,
              {
                i18n,
                query,
                collections,
                transaction,
                userKey: admin._key,
                auth: {
                  checkPermission: checkPermission({
                    i18n,
                    userKey: admin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: admin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: admin._key,
                      i18n,
                    }),
                  }),
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'fr',
                    userKey: admin._key,
                    i18n,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                },
                validators: { cleanseInput },
              },
            )

            const loader = loadAffiliationByKey({
              query,
              userKey: admin._key,
              i18n,
            })

            const data = await loader.load(affiliation._key)

            expect(data).toEqual(undefined)
            expect(consoleOutput).toEqual([
              `User: ${admin._key} successfully removed user: ${user._key} from org: ${orgOne._key}.`,
            ])
          })
        })
      })

      describe('user is an org admin', () => {
        describe('user can remove a user from the shared org', () => {
          let query,
            drop,
            truncate,
            collections,
            transaction,
            orgOne,
            admin,
            user,
            affiliation

          beforeEach(async () => {
            ;({ query, drop, truncate, collections, transaction } =
              await ensure({
                type: 'database',
                name: 'adm_rm_usr_shared_' + dbNameFromFile(__filename),
                url,
                rootPassword: rootPass,
                options: databaseOptions({ rootPass }),
              }))

            orgOne = await collections.organizations.save(orgOneData)
            admin = await collections.users.save(adminData)
            user = await collections.users.save(userData)

            await collections.affiliations.save({
              _from: orgOne._id,
              _to: admin._id,
              permission: 'admin',
            })

            affiliation = await collections.affiliations.save({
              _from: orgOne._id,
              _to: user._id,
              permission: 'user',
            })
          })

          afterEach(async () => {
            await truncate()
            consoleOutput.length = 0
          })

          afterAll(async () => {
            await drop()
          })

          it('returns a status message', async () => {
            const response = await graphql(
              schema,
              `
                mutation {
                  removeUserFromOrg (
                    input: {
                      userId: "${toGlobalId('users', user._key)}"
                      orgId: "${toGlobalId('organizations', orgOne._key)}"
                    }
                  ) {
                    result {
                      ... on RemoveUserFromOrgResult {
                        status
                        user {
                          id
                          userName
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
              null,
              {
                i18n,
                query,
                collections,
                transaction,
                userKey: admin._key,
                auth: {
                  checkPermission: checkPermission({
                    i18n,
                    userKey: admin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: admin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: admin._key,
                      i18n,
                    }),
                  }),
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'fr',
                    userKey: admin._key,
                    i18n,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                },
                validators: { cleanseInput },
              },
            )

            const expectedResponse = {
              data: {
                removeUserFromOrg: {
                  result: {
                    status:
                      "L'utilisateur a été retiré de l'organisation avec succès.",
                    user: {
                      id: toGlobalId('users', user._key),
                      userName: 'test.account@istio.actually.exists',
                    },
                  },
                },
              },
            }

            expect(response).toEqual(expectedResponse)
            expect(consoleOutput).toEqual([
              `User: ${admin._key} successfully removed user: ${user._key} from org: ${orgOne._key}.`,
            ])
          })

          it('removes the user from the org', async () => {
            await graphql(
              schema,
              `
                mutation {
                  removeUserFromOrg (
                    input: {
                      userId: "${toGlobalId('users', user._key)}"
                      orgId: "${toGlobalId('organizations', orgOne._key)}"
                    }
                  ) {
                    result {
                      ... on RemoveUserFromOrgResult {
                        status
                        user {
                          id
                          userName
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
              null,
              {
                i18n,
                query,
                collections,
                transaction,
                userKey: admin._key,
                auth: {
                  checkPermission: checkPermission({
                    i18n,
                    userKey: admin._key,
                    query,
                  }),
                  userRequired: userRequired({
                    i18n,
                    userKey: admin._key,
                    loadUserByKey: loadUserByKey({
                      query,
                      userKey: admin._key,
                      i18n,
                    }),
                  }),
                  verifiedRequired: verifiedRequired({ i18n }),
                },
                loaders: {
                  loadOrgByKey: loadOrgByKey({
                    query,
                    language: 'fr',
                    userKey: admin._key,
                    i18n,
                  }),
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                },
                validators: { cleanseInput },
              },
            )

            const loader = loadAffiliationByKey({
              query,
              userKey: admin._key,
              i18n,
            })

            const data = await loader.load(affiliation._key)

            expect(data).toEqual(undefined)
            expect(consoleOutput).toEqual([
              `User: ${admin._key} successfully removed user: ${user._key} from org: ${orgOne._key}.`,
            ])
          })
        })
      })
    })

    describe('given an unsuccessful removal', () => {
      describe('org is not found', () => {
        let query, drop, collections, transaction, admin, user

        beforeEach(async () => {
          ;({ query, drop, collections, transaction } = await ensure({
            type: 'database',
            name: 'no_org_' + dbNameFromFile(__filename),
            url,
            rootPassword: rootPass,
            options: databaseOptions({ rootPass }),
          }))

          admin = await collections.users.save(adminData)
          user = await collections.users.save(userData)
        })

        afterEach(async () => {
          consoleOutput.length = 0
        })

        afterAll(async () => {
          await drop()
        })

        it('returns an error', async () => {
          const doesnotexist = 12345

          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', user._key)}"
                    orgId: "${toGlobalId('organizations', doesnotexist)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
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
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: admin._key,
              auth: {
                checkPermission: checkPermission({
                  i18n,
                  userKey: admin._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: admin._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'fr',
                  userKey: admin._key,
                  i18n,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: admin._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description:
                    "Impossible de supprimer un utilisateur d'une organisation inconnue.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${admin._key} attempted to remove user: ${user._key} from org: ${doesnotexist}, however no org with that id could be found.`,
          ])
        })
      })

      describe('super admin attempts to remove another super admin', () => {
        let query, drop, truncate, collections, transaction, orgOne, admin, user

        beforeEach(async () => {
          ;({ query, drop, truncate, collections, transaction } = await ensure({
            type: 'database',
            name: 'sa_rm_sa_' + dbNameFromFile(__filename),
            url,
            rootPassword: rootPass,
            options: databaseOptions({ rootPass }),
          }))

          orgOne = await collections.organizations.save(orgOneData)
          admin = await collections.users.save(adminData)
          user = await collections.users.save(userData)

          await collections.affiliations.import([
            {
              _from: orgOne._id,
              _to: admin._id,
              permission: 'super_admin',
            },
            {
              _from: orgOne._id,
              _to: user._id,
              permission: 'super_admin',
            },
          ])
        })

        afterEach(async () => {
          await truncate()
          consoleOutput.length = 0
        })

        afterAll(async () => {
          await drop()
        })

        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', user._key)}"
                    orgId: "${toGlobalId('organizations', orgOne._key)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
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
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: admin._key,
              auth: {
                checkPermission: checkPermission({
                  i18n,
                  userKey: admin._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: admin._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'fr',
                  userKey: admin._key,
                  i18n,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: admin._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${admin._key} attempted to remove user: ${user._key} from org: ${orgOne._key}, but they do not have the right permission.`,
          ])
        })
      })

      describe('requesting user is an admin for another org', () => {
        let query,
          drop,
          truncate,
          collections,
          transaction,
          orgOne,
          orgTwo,
          admin,
          user

        beforeEach(async () => {
          ;({ query, drop, truncate, collections, transaction } = await ensure({
            type: 'database',
            name: 'sa_rm_sa_' + dbNameFromFile(__filename),
            url,
            rootPassword: rootPass,
            options: databaseOptions({ rootPass }),
          }))

          orgOne = await collections.organizations.save(orgOneData)
          orgTwo = await collections.organizations.save(orgTwoData)
          admin = await collections.users.save(adminData)
          user = await collections.users.save(userData)

          await collections.affiliations.import([
            {
              _from: orgOne._id,
              _to: admin._id,
              permission: 'admin',
            },

            {
              _from: orgTwo._id,
              _to: user._id,
              permission: 'user',
            },
          ])
        })

        afterEach(async () => {
          await truncate()
          consoleOutput.length = 0
        })

        afterAll(async () => {
          await drop()
        })

        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', user._key)}"
                    orgId: "${toGlobalId('organizations', orgOne._key)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
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
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: admin._key,
              auth: {
                checkPermission: checkPermission({
                  i18n,
                  userKey: admin._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: admin._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'fr',
                  userKey: admin._key,
                  i18n,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: admin._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description:
                    "Impossible de supprimer un utilisateur qui n'appartient déjà plus à cette organisation.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${admin._key} attempted to remove user: ${user._key}, but they do not have any affiliations to org: ${orgOne._key}.`,
          ])
        })
      })

      describe('admin attempts to remove another admin', () => {
        let query, drop, truncate, collections, transaction, orgOne, admin, user

        beforeEach(async () => {
          ;({ query, drop, truncate, collections, transaction } = await ensure({
            type: 'database',
            name: 'adm_vs_adm_fr_' + dbNameFromFile(__filename),
            url,
            rootPassword: rootPass,
            options: databaseOptions({ rootPass }),
          }))

          orgOne = await collections.organizations.save(orgOneData)
          admin = await collections.users.save(adminData)
          user = await collections.users.save(userData)

          await collections.affiliations.import([
            {
              _from: orgOne._id,
              _to: admin._id,
              permission: 'admin',
            },

            {
              _from: orgOne._id,
              _to: user._id,
              permission: 'admin',
            },
          ])
        })

        afterEach(async () => {
          await truncate()
          consoleOutput.length = 0
        })

        afterAll(async () => {
          await drop()
        })

        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', user._key)}"
                    orgId: "${toGlobalId('organizations', orgOne._key)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
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
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: admin._key,
              auth: {
                checkPermission: checkPermission({
                  i18n,
                  userKey: admin._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: admin._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'fr',
                  userKey: admin._key,
                  i18n,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: admin._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description: 'todo',
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${admin._key} attempted to remove user: ${user._key} from org: ${orgOne._key}, but they do not have the right permission.`,
          ])
        })
      })

      describe('requesting user is not an admin', () => {
        let query, drop, truncate, collections, transaction, orgOne, admin, user

        beforeEach(async () => {
          ;({ query, drop, truncate, collections, transaction } = await ensure({
            type: 'database',
            name: 'usr_vs_usr_fr_' + dbNameFromFile(__filename),
            url,
            rootPassword: rootPass,
            options: databaseOptions({ rootPass }),
          }))

          orgOne = await collections.organizations.save(orgOneData)
          admin = await collections.users.save(adminData)
          user = await collections.users.save(userData)

          await collections.affiliations.import([
            {
              _from: orgOne._id,
              _to: admin._id,
              permission: 'user',
            },

            {
              _from: orgOne._id,
              _to: user._id,
              permission: 'user',
            },
          ])
        })

        afterEach(async () => {
          await truncate()
          consoleOutput.length = 0
        })

        afterAll(async () => {
          await drop()
        })

        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', user._key)}"
                    orgId: "${toGlobalId('organizations', orgOne._key)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
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
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: admin._key,
              auth: {
                checkPermission: checkPermission({
                  i18n,
                  userKey: admin._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: admin._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'fr',
                  userKey: admin._key,
                  i18n,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: admin._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description:
                    "Impossible de supprimer un utilisateur de l'organisation.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${admin._key} attempted to remove user: ${user._key} from org: ${orgOne._key}, however they do not have the permission to remove users.`,
          ])
        })
      })

      describe('requested user is not found', () => {
        let query, drop, collections, transaction, orgOne, admin

        const doesnotexist = 12345

        beforeEach(async () => {
          ;({ query, drop, collections, transaction } = await ensure({
            type: 'database',
            name: 'usr_not_found_' + dbNameFromFile(__filename),
            url,
            rootPassword: rootPass,
            options: databaseOptions({ rootPass }),
          }))

          orgOne = await collections.organizations.save(orgOneData)
          admin = await collections.users.save(adminData)

          await collections.affiliations.import([
            {
              _from: orgOne._id,
              _to: admin._id,
              permission: 'admin',
            },
            {
              _from: orgOne._id,
              _to: `users/${doesnotexist}`,
              permission: 'user',
            },
          ])
        })

        afterAll(async () => {
          consoleOutput.length = 0
          await drop()
        })

        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', doesnotexist)}"
                    orgId: "${toGlobalId('organizations', orgOne._key)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
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
            null,
            {
              i18n,
              query,
              collections,
              transaction,
              userKey: admin._key,
              auth: {
                checkPermission: checkPermission({
                  i18n,
                  userKey: admin._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: admin._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'fr',
                  userKey: admin._key,
                  i18n,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: admin._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const error = {
            data: {
              removeUserFromOrg: {
                result: {
                  code: 400,
                  description:
                    "Impossible de supprimer un utilisateur inconnu de l'organisation.",
                },
              },
            },
          }

          expect(response).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${admin._key} attempted to remove user: ${doesnotexist} from org: ${orgOne._key}, however no user with that id could be found.`,
          ])
        })
      })
    })

    describe('database error occurs', () => {
      describe('when checking requested users permission in requested org', () => {
        let query,
          drop,
          truncate,
          collections,
          transaction,
          orgOne,
          orgTwo,
          admin,
          user,
          mockedQuery

        beforeEach(async () => {
          ;({ query, drop, truncate, collections, transaction } = await ensure({
            type: 'database',
            name: 'db_err_fr_' + dbNameFromFile(__filename),
            url,
            rootPassword: rootPass,
            options: databaseOptions({ rootPass }),
          }))

          orgOne = await collections.organizations.save(orgOneData)
          orgTwo = await collections.organizations.save(orgTwoData)

          admin = await collections.users.save(adminData)
          user = await collections.users.save(userData)

          mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          await collections.affiliations.import([
            {
              _from: orgTwo._id,
              _to: admin._id,
              permission: 'super_admin',
            },
            {
              _from: orgOne._id,
              _to: user._id,
              permission: 'user',
            },
          ])
        })

        afterEach(async () => {
          await truncate()
          consoleOutput.length = 0
        })

        afterAll(async () => {
          await drop()
        })

        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', user._key)}"
                    orgId: "${toGlobalId('organizations', orgOne._key)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
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
            null,
            {
              i18n,
              query: mockedQuery,
              collections,
              transaction,
              userKey: admin._key,
              auth: {
                checkPermission: checkPermission({
                  i18n,
                  userKey: admin._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: admin._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'fr',
                  userKey: admin._key,
                  i18n,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: admin._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              "Impossible de supprimer l'utilisateur de cette organisation. Veuillez réessayer.",
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when user: ${admin._key} attempted to check the current permission of user: ${user._key} to see if they could be removed.`,
          ])
        })
      })
    })

    describe('transaction error occurs', () => {
      describe('when running transaction', () => {
        let query,
          drop,
          truncate,
          collections,
          orgOne,
          orgTwo,
          admin,
          user,
          mockedTransaction

        beforeEach(async () => {
          ;({ query, drop, truncate, collections } = await ensure({
            type: 'database',
            name: 'txn_err_fr_' + dbNameFromFile(__filename),
            url,
            rootPassword: rootPass,
            options: databaseOptions({ rootPass }),
          }))

          orgOne = await collections.organizations.save(orgOneData)
          orgTwo = await collections.organizations.save(orgTwoData)
          admin = await collections.users.save(adminData)
          user = await collections.users.save(userData)

          mockedTransaction = jest.fn().mockReturnValue({
            step() {
              throw new Error('Transaction error occurred.')
            },
          })

          await collections.affiliations.import([
            {
              _from: orgTwo._id,
              _to: admin._id,
              permission: 'super_admin',
            },
            { _from: orgOne._id, _to: user._id, permission: 'user' },
          ])
        })

        afterEach(async () => {
          await truncate()
          consoleOutput.length = 0
        })

        afterAll(async () => {
          await drop()
        })

        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', user._key)}"
                    orgId: "${toGlobalId('organizations', orgOne._key)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
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
            null,
            {
              i18n,
              query,
              collections,
              transaction: mockedTransaction,
              userKey: admin._key,
              auth: {
                checkPermission: checkPermission({
                  i18n,
                  userKey: admin._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: admin._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'fr',
                  userKey: admin._key,
                  i18n,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: admin._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              "Impossible de supprimer un utilisateur de l'organisation. Veuillez réessayer.",
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction step error occurred when user: ${admin._key} attempted to remove user: ${user._key} from org: ${orgOne._key}, error: Error: Transaction error occurred.`,
          ])
        })
      })

      describe('when committing transaction', () => {
        let query,
          drop,
          truncate,
          collections,
          orgOne,
          orgTwo,
          admin,
          user,
          mockedTransaction

        beforeEach(async () => {
          ;({ query, drop, truncate, collections } = await ensure({
            type: 'database',
            name: 'txn_commit_fr_' + dbNameFromFile(__filename),
            url,
            rootPassword: rootPass,
            options: databaseOptions({ rootPass }),
          }))

          orgOne = await collections.organizations.save(orgOneData)
          orgTwo = await collections.organizations.save(orgTwoData)
          admin = await collections.users.save(adminData)
          user = await collections.users.save(userData)

          mockedTransaction = jest.fn().mockReturnValue({
            step() {
              return undefined
            },
            commit() {
              throw new Error('Transaction error occurred.')
            },
          })

          await collections.affiliations.import([
            {
              _from: orgTwo._id,
              _to: admin._id,
              permission: 'super_admin',
            },
            {
              _from: orgOne._id,
              _to: user._id,
              permission: 'user',
            },
          ])
        })

        afterEach(async () => {
          await truncate()
          consoleOutput.length = 0
        })

        afterAll(async () => {
          await drop()
        })

        it('returns an error', async () => {
          const response = await graphql(
            schema,
            `
              mutation {
                removeUserFromOrg (
                  input: {
                    userId: "${toGlobalId('users', user._key)}"
                    orgId: "${toGlobalId('organizations', orgOne._key)}"
                  }
                ) {
                  result {
                    ... on RemoveUserFromOrgResult {
                      status
                      user {
                        id
                        userName
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
            null,
            {
              i18n,
              query,
              collections,
              transaction: mockedTransaction,
              userKey: admin._key,
              auth: {
                checkPermission: checkPermission({
                  i18n,
                  userKey: admin._key,
                  query,
                }),
                userRequired: userRequired({
                  i18n,
                  userKey: admin._key,
                  loadUserByKey: loadUserByKey({
                    query,
                    userKey: admin._key,
                    i18n,
                  }),
                }),
                verifiedRequired: verifiedRequired({ i18n }),
              },
              loaders: {
                loadOrgByKey: loadOrgByKey({
                  query,
                  language: 'fr',
                  userKey: admin._key,
                  i18n,
                }),
                loadUserByKey: loadUserByKey({
                  query,
                  userKey: admin._key,
                  i18n,
                }),
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              "Impossible de supprimer un utilisateur de l'organisation. Veuillez réessayer.",
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction commit error occurred when user: ${admin._key} attempted to remove user: ${user._key} from org: ${orgOne._key}, error: Error: Transaction error occurred.`,
          ])
        })
      })
    })
  })
})
