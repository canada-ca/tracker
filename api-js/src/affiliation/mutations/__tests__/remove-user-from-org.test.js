import { setupI18n } from '@lingui/core'
import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { checkPermission, userRequired } from '../../../auth'
import { orgLoaderByKey } from '../../../organization/loaders'
import { userLoaderByKey } from '../../../user/loaders'
import { affiliationLoaderByKey } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('removing a user from an organization', () => {
  let query,
    drop,
    truncate,
    collections,
    transaction,
    migrate,
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
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections, transaction } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))

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

  describe('given a users language is set to english', () => {
    beforeAll(() => {
      i18n = setupI18n({
        language: 'en',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
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
                    status
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
                    userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                  }),
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en', admin._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                },
                validators: { cleanseInput },
              },
            )

            const expectedResponse = {
              data: {
                removeUserFromOrg: {
                  status: 'Successfully removed user from organization.',
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
                    status
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
                    userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                  }),
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en', admin._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                },
                validators: { cleanseInput },
              },
            )

            const loader = affiliationLoaderByKey(query, admin._key, i18n)

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
                    status
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
                    userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                  }),
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en', admin._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                },
                validators: { cleanseInput },
              },
            )

            const expectedResponse = {
              data: {
                removeUserFromOrg: {
                  status: 'Successfully removed user from organization.',
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
                    status
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
                    userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                  }),
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en', admin._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                },
                validators: { cleanseInput },
              },
            )

            const loader = affiliationLoaderByKey(query, admin._key, i18n)

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
                    status
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
                    userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                  }),
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en', admin._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                },
                validators: { cleanseInput },
              },
            )

            const expectedResponse = {
              data: {
                removeUserFromOrg: {
                  status: 'Successfully removed user from organization.',
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
                    status
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
                    userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                  }),
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en', admin._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                },
                validators: { cleanseInput },
              },
            )

            const loader = affiliationLoaderByKey(query, admin._key, i18n)

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
                  status
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
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en', admin._key, i18n),
                userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to remove user from organization. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
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
                  status
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
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en', admin._key, i18n),
                userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to remove user from organization. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
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
                  status
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
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en', admin._key, i18n),
                userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to remove user from organization. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
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
                  status
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
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en', admin._key, i18n),
                userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to remove user from organization. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
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
                  status
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
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en', admin._key, i18n),
                userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to remove user from organization. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
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
                  status
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
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en', admin._key, i18n),
                userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to remove user from organization. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
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
                  status
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
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en', admin._key, i18n),
                userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to remove user from organization. Please try again.',
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
            run() {
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
                  status
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
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en', admin._key, i18n),
                userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to remove user from organization. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction run error occurred when user: ${admin._key} attempted to remove user: ${user._key} from org: ${orgOne._key}, error: Error: Transaction error occurred.`,
          ])
        })
      })
      describe('when committing transaction', () => {
        beforeEach(() => {
          mockedTransaction = jest.fn().mockReturnValue({
            run() {
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
                  status
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
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en', admin._key, i18n),
                userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
              },
              validators: { cleanseInput },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to remove user from organization. Please try again.',
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
  describe('users language is set to french', () => {
    beforeAll(() => {
      i18n = setupI18n({
        language: 'fr',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
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
                    status
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
                    userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                  }),
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr', admin._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                },
                validators: { cleanseInput },
              },
            )

            const expectedResponse = {
              data: {
                removeUserFromOrg: {
                  status: 'todo',
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
                    status
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
                    userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                  }),
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr', admin._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                },
                validators: { cleanseInput },
              },
            )

            const loader = affiliationLoaderByKey(query, admin._key, i18n)

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
                    status
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
                    userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                  }),
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr', admin._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                },
                validators: { cleanseInput },
              },
            )

            const expectedResponse = {
              data: {
                removeUserFromOrg: {
                  status: 'todo',
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
                    status
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
                    userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                  }),
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr', admin._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                },
                validators: { cleanseInput },
              },
            )

            const loader = affiliationLoaderByKey(query, admin._key, i18n)

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
                    status
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
                    userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                  }),
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr', admin._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                },
                validators: { cleanseInput },
              },
            )

            const expectedResponse = {
              data: {
                removeUserFromOrg: {
                  status: 'todo',
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
                    status
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
                    userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                  }),
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'fr', admin._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                },
                validators: { cleanseInput },
              },
            )

            const loader = affiliationLoaderByKey(query, admin._key, i18n)

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
                  status
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
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr', admin._key, i18n),
                userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
              },
              validators: { cleanseInput },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
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
                  status
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
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr', admin._key, i18n),
                userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
              },
              validators: { cleanseInput },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
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
                  status
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
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr', admin._key, i18n),
                userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
              },
              validators: { cleanseInput },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
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
                  status
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
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr', admin._key, i18n),
                userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
              },
              validators: { cleanseInput },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
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
                  status
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
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr', admin._key, i18n),
                userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
              },
              validators: { cleanseInput },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
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
                  status
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
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr', admin._key, i18n),
                userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
              },
              validators: { cleanseInput },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
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
                  status
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
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr', admin._key, i18n),
                userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
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
            run() {
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
                  status
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
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr', admin._key, i18n),
                userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
              },
              validators: { cleanseInput },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction run error occurred when user: ${admin._key} attempted to remove user: ${user._key} from org: ${orgOne._key}, error: Error: Transaction error occurred.`,
          ])
        })
      })
      describe('when committing transaction', () => {
        beforeEach(() => {
          mockedTransaction = jest.fn().mockReturnValue({
            run() {
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
                  status
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
                  userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr', admin._key, i18n),
                userLoaderByKey: userLoaderByKey(query, admin._key, i18n),
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
