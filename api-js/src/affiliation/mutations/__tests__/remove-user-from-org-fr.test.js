import { setupI18n } from '@lingui/core'
import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { checkPermission, userRequired } from '../../../auth'
import { loadOrgByKey } from '../../../organization/loaders'
import { loadUserByKey } from '../../../user/loaders'
import { loadAffiliationByKey } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('removing a user from an organization', () => {
  let query,
    drop,
    truncate,
    collections,
    transaction,
    schema,
    i18n,
    orgOne,
    orgTwo,
    admin,
    user,
    affiliation

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

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

  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError

    orgOne = await collections.organizations.save({
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
    })
    orgTwo = await collections.organizations.save({
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
    })
    admin = await collections.users.save({
      userName: 'admin.account@istio.actually.exists',
      displayName: 'Test Admin',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
    })
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
    })
  })

  afterEach(async () => {
    await truncate()
    consoleOutput.length = 0
  })

  afterAll(async () => {
    await drop()
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
          fr: frenchMessages.messages,
        },
      })
    })
    describe('given a successful removal', () => {
      describe('user is a super admin', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: orgTwo._id,
            _to: admin._id,
            permission: 'super_admin',
          })
        })
        describe('super admin can remove an admin from any org', () => {
          beforeEach(async () => {
            affiliation = await collections.affiliations.save({
              _from: orgOne._id,
              _to: user._id,
              permission: 'admin',
            })
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
                    status: 'todo',
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
          beforeEach(async () => {
            affiliation = await collections.affiliations.save({
              _from: orgOne._id,
              _to: user._id,
              permission: 'user',
            })
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
                    status: 'todo',
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
        beforeEach(async () => {
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
        describe('user can remove a user from the shared org', () => {
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
                    status: 'todo',
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
        beforeEach(async () => {
          await query`
            FOR org IN organizations
              REMOVE org IN organizations
              RETURN true
          `
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
            `User: ${admin._key} attempted to remove user: ${user._key} from org: ${orgOne._key}, however no org with that id could be found.`,
          ])
        })
      })
      describe('super admin attempts to remove another super admin', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: orgOne._id,
            _to: admin._id,
            permission: 'super_admin',
          })
          affiliation = await collections.affiliations.save({
            _from: orgOne._id,
            _to: user._id,
            permission: 'super_admin',
          })
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
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: orgOne._id,
            _to: admin._id,
            permission: 'admin',
          })
          affiliation = await collections.affiliations.save({
            _from: orgTwo._id,
            _to: user._id,
            permission: 'user',
          })
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
            `User: ${admin._key} attempted to remove user: ${user._key}, but they do not have any affiliations to org: ${orgOne._key}.`,
          ])
        })
      })
      describe('admin attempts to remove another admin', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: orgOne._id,
            _to: admin._id,
            permission: 'admin',
          })
          affiliation = await collections.affiliations.save({
            _from: orgOne._id,
            _to: user._id,
            permission: 'admin',
          })
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
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: orgOne._id,
            _to: admin._id,
            permission: 'user',
          })
          affiliation = await collections.affiliations.save({
            _from: orgOne._id,
            _to: user._id,
            permission: 'user',
          })
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
            `User: ${admin._key} attempted to remove user: ${user._key} from org: ${orgOne._key}, however they do not have the permission to remove users.`,
          ])
        })
      })
      describe('requested user is not found', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: orgOne._id,
            _to: admin._id,
            permission: 'admin',
          })
          await query`
            FOR user IN users
              FILTER user._key == ${user._key}
              REMOVE user IN users
              RETURN true
          `
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
            `User: ${admin._key} attempted to remove user: ${user._key} from org: ${orgOne._key}, however no user with that id could be found.`,
          ])
        })
      })
    })
    describe('database error occurs', () => {
      describe('when checking requested users permission in requested org', () => {
        let mockedQuery
        beforeEach(async () => {
          mockedQuery = jest
            .fn()
            .mockRejectedValue(new Error('Database error occurred.'))

          await collections.affiliations.save({
            _from: orgTwo._id,
            _to: admin._id,
            permission: 'super_admin',
          })
          await collections.affiliations.save({
            _from: orgOne._id,
            _to: user._id,
            permission: 'user',
          })
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

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when user: ${admin._key} attempted to check the current permission of user: ${user._key} to see if they could be removed.`,
          ])
        })
      })
    })
    describe('transaction error occurs', () => {
      let mockedTransaction
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: orgTwo._id,
          _to: admin._id,
          permission: 'super_admin',
        })
        await collections.affiliations.save({
          _from: orgOne._id,
          _to: user._id,
          permission: 'user',
        })
      })
      describe('when running transaction', () => {
        beforeEach(() => {
          mockedTransaction = jest.fn().mockReturnValue({
            step() {
              throw new Error('Transaction error occurred.')
            },
          })
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

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction step error occurred when user: ${admin._key} attempted to remove user: ${user._key} from org: ${orgOne._key}, error: Error: Transaction error occurred.`,
          ])
        })
      })
      describe('when committing transaction', () => {
        beforeEach(() => {
          mockedTransaction = jest.fn().mockReturnValue({
            step() {
              return undefined
            },
            commit() {
              throw new Error('Transaction error occurred.')
            },
          })
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

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction commit error occurred when user: ${admin._key} attempted to remove user: ${user._key} from org: ${orgOne._key}, error: Error: Transaction error occurred.`,
          ])
        })
      })
    })
  })
})

