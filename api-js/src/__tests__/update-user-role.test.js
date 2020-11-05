const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const bcrypt = require('bcrypt')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../locale/en/messages')
const frenchMessages = require('../locale/fr/messages')
const { makeMigrations } = require('../../migrations')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')
const { cleanseInput } = require('../validators')
const { checkPermission, tokenize, userRequired } = require('../auth')
const {
  userLoaderByUserName,
  orgLoaderByKey,
  userLoaderByKey,
} = require('../loaders')
const { toGlobalId } = require('graphql-relay')

describe('update a users role', () => {
  let query, drop, truncate, migrate, schema, collections, transaction, i18n

  beforeAll(async () => {
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
    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections, transaction } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    await truncate()
    await graphql(
      schema,
      `
        mutation {
          signUp(
            input: {
              displayName: "Test Account"
              userName: "test.account@istio.actually.exists"
              password: "testpassword123"
              confirmPassword: "testpassword123"
              preferredLang: FRENCH
            }
          ) {
            authResult {
              user {
                id
              }
            }
          }
        }
      `,
      null,
      {
        query,
        auth: {
          bcrypt,
          tokenize,
        },
        validators: {
          cleanseInput,
        },
        loaders: {
          userLoaderByUserName: userLoaderByUserName(query),
        },
      },
    )
    consoleOutput = []
  })

  afterEach(async () => {
    await drop()
  })

  describe('users language is set to english', () => {
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
    describe('given a successful role update', () => {
      let org, user, secondaryUser
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

        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        user = await userCursor.next()

        await collections.users.save({
          displayName: 'Test Account',
          userName: 'test@email.gc.ca',
          preferredLang: 'english',
        })
        const secondaryUserCursor = await query`
        FOR user IN users
          FILTER user.userName == "test@email.gc.ca"
          RETURN user
        `
        secondaryUser = await secondaryUserCursor.next()
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
                      userName: "${secondaryUser.userName}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: SUPER_ADMIN
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
                  userId: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userId: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userId: user._key,
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    status: 'User role was updated successfully.',
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
                      userName: "${secondaryUser.userName}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: USER
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
                  userId: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userId: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userId: user._key,
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    status: 'User role was updated successfully.',
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
                      userName: "${secondaryUser.userName}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: SUPER_ADMIN
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
                  userId: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userId: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userId: user._key,
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    status: 'User role was updated successfully.',
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
                      userName: "${secondaryUser.userName}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: ADMIN
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
                  userId: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userId: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userId: user._key,
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    status: 'User role was updated successfully.',
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
                      userName: "${secondaryUser.userName}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: ADMIN
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
                  userId: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userId: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userId: user._key,
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    status: 'User role was updated successfully.',
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
      let org, user, secondaryUser
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

        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        user = await userCursor.next()

        await collections.users.save({
          displayName: 'Test Account',
          userName: 'test@email.gc.ca',
          preferredLang: 'english',
        })
        const secondaryUserCursor = await query`
          FOR user IN users
            FILTER user.userName == "test@email.gc.ca"
            RETURN user
        `
        secondaryUser = await secondaryUserCursor.next()
      })
      describe('user attempts to update their own role', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "${user.userName}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
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
              userId: user._key,
              auth: {
                checkPermission: checkPermission({ userId: user._key, query }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to update your own role. Please try again.',
            ),
          ]

          expect(response.errors).toEqual(error)
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
              userId: user._key,
              auth: {
                checkPermission: checkPermission({ userId: user._key, query }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update users role. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
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
                  userName: "${secondaryUser.userName}"
                  orgId: "${toGlobalId('organizations', 1)}"
                  role: ADMIN
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
              userId: user._key,
              auth: {
                checkPermission: checkPermission({ userId: user._key, query }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update users role. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
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
                  userName: "${secondaryUser.userName}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
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
              userId: user._key,
              auth: {
                checkPermission: checkPermission({ userId: user._key, query }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update users role. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update a user: ${secondaryUser._key} role in org: treasury-board-secretariat, however they do not have permission to do so.`,
          ])
        })
      })
      describe('user attempts to update a users role in an org that the requesting user does not belong to', () => {
        let secondaryOrg
        beforeEach(async () => {
          secondaryOrg = await collections.organizations.save({
            blueCheck: false,
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
                  userName: "${secondaryUser.userName}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
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
              userId: user._key,
              auth: {
                checkPermission: checkPermission({ userId: user._key, query }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update users role. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
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
                  userName: "${secondaryUser.userName}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
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
              userId: user._key,
              auth: {
                checkPermission: checkPermission({ userId: user._key, query }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [
            new GraphQLError(
              'Unable to update users role. Please invite user to the organization.',
            ),
          ]

          expect(response.errors).toEqual(error)
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
                      userName: "${secondaryUser.userName}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: ADMIN
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
                  userId: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userId: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userId: user._key,
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const error = [
                new GraphQLError(
                  'Unable to update users role. Please try again.',
                ),
              ]

              expect(response.errors).toEqual(error)
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
                      userName: "${secondaryUser.userName}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: USER
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
                  userId: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userId: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userId: user._key,
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const error = [
                new GraphQLError(
                  'Unable to update users role. Please try again.',
                ),
              ]

              expect(response.errors).toEqual(error)
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
                    userName: "${secondaryUser.userName}"
                    orgId: "${toGlobalId('organizations', org._key)}"
                    role: USER
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
                userId: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userId: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userId: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                  userLoaderByUserName: userLoaderByUserName(query),
                },
                validators: {
                  cleanseInput,
                },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to update users role. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
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
                    userName: "${secondaryUser.userName}"
                    orgId: "${toGlobalId('organizations', org._key)}"
                    role: USER
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
                userId: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userId: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userId: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                  userLoaderByUserName: userLoaderByUserName(query),
                },
                validators: {
                  cleanseInput,
                },
              },
            )

            const error = [
              new GraphQLError(
                'Unable to update users role. Please try again.',
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to lower user: ${secondaryUser._key} from admin to: user.`,
            ])
          })
        })
      })
    })
    describe('database error occurs', () => {
      let org, user, secondaryUser
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

        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        user = await userCursor.next()

        await collections.users.save({
          displayName: 'Test Account',
          userName: 'test@email.gc.ca',
          preferredLang: 'english',
        })
        const secondaryUserCursor = await query`
          FOR user IN users
            FILTER user.userName == "test@email.gc.ca"
            RETURN user
        `
        secondaryUser = await secondaryUserCursor.next()

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
          const orgLoader = orgLoaderByKey(query, 'en')
          const userLoaderId = userLoaderByKey(query)
          const userLoaderUserName = userLoaderByUserName(query)

          query = jest
            .fn()
            .mockReturnValueOnce({
              next() {
                return 'admin'
              },
            })
            .mockReturnValueOnce({
              next() {
                return 'admin'
              },
            })
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "${secondaryUser.userName}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: USER
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
              userId: user._key,
              auth: {
                checkPermission: checkPermission({ userId: user._key, query }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderId,
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoader,
                userLoaderByKey: userLoaderId,
                userLoaderByUserName: userLoaderUserName,
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update users role. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when user: ${user._key} attempted to update a users: ${secondaryUser._key} role, error: Error: Database error occurred.`,
          ])
        })
      })
    })
    describe('transaction error occurs', () => {
      let org, user, secondaryUser
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

        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        user = await userCursor.next()

        await collections.users.save({
          displayName: 'Test Account',
          userName: 'test@email.gc.ca',
          preferredLang: 'english',
        })
        const secondaryUserCursor = await query`
          FOR user IN users
            FILTER user.userName == "test@email.gc.ca"
            RETURN user
        `
        secondaryUser = await secondaryUserCursor.next()

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
          const orgLoader = orgLoaderByKey(query, 'en')
          const userLoaderId = userLoaderByKey(query)
          const userLoaderUserName = userLoaderByUserName(query)

          transaction = jest.fn().mockReturnValue({
            run() {
              throw new Error('Transaction error occurred.')
            },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "${secondaryUser.userName}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
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
              userId: user._key,
              auth: {
                checkPermission: checkPermission({ userId: user._key, query }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoader,
                userLoaderByKey: userLoaderId,
                userLoaderByUserName: userLoaderUserName,
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update users role. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction run error occurred when user: ${user._key} attempted to update a users: ${secondaryUser._key} role, error: Error: Transaction error occurred.`,
          ])
        })
      })
      describe('when committing transaction', () => {
        it('returns an error message', async () => {
          const orgLoader = orgLoaderByKey(query, 'en')
          const userLoaderId = userLoaderByKey(query)
          const userLoaderUserName = userLoaderByUserName(query)

          transaction = jest.fn().mockReturnValue({
            run() {
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
                  userName: "${secondaryUser.userName}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
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
              userId: user._key,
              auth: {
                checkPermission: checkPermission({ userId: user._key, query }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoader,
                userLoaderByKey: userLoaderId,
                userLoaderByUserName: userLoaderUserName,
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [
            new GraphQLError('Unable to update users role. Please try again.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction commit error occurred when user: ${user._key} attempted to update a users: ${secondaryUser._key} role, error: Error: Transaction error occurred.`,
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
    describe('given a successful role update', () => {
      let org, user, secondaryUser
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

        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        user = await userCursor.next()

        await collections.users.save({
          displayName: 'Test Account',
          userName: 'test@email.gc.ca',
          preferredLang: 'english',
        })
        const secondaryUserCursor = await query`
        FOR user IN users
          FILTER user.userName == "test@email.gc.ca"
          RETURN user
        `
        secondaryUser = await secondaryUserCursor.next()
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
                      userName: "${secondaryUser.userName}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: SUPER_ADMIN
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
                  userId: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userId: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userId: user._key,
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    status: 'todo',
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
                      userName: "${secondaryUser.userName}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: USER
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
                  userId: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userId: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userId: user._key,
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    status: 'todo',
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
                      userName: "${secondaryUser.userName}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: SUPER_ADMIN
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
                  userId: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userId: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userId: user._key,
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    status: 'todo',
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
                      userName: "${secondaryUser.userName}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: ADMIN
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
                  userId: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userId: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userId: user._key,
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    status: 'todo',
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
                      userName: "${secondaryUser.userName}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: ADMIN
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
                  userId: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userId: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userId: user._key,
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const expectedResponse = {
                data: {
                  updateUserRole: {
                    status: 'todo',
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
      let org, user, secondaryUser
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

        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        user = await userCursor.next()

        await collections.users.save({
          displayName: 'Test Account',
          userName: 'test@email.gc.ca',
          preferredLang: 'english',
        })
        const secondaryUserCursor = await query`
          FOR user IN users
            FILTER user.userName == "test@email.gc.ca"
            RETURN user
        `
        secondaryUser = await secondaryUserCursor.next()
      })
      describe('user attempts to update their own role', () => {
        it('returns an error message', async () => {
          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "${user.userName}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
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
              userId: user._key,
              auth: {
                checkPermission: checkPermission({ userId: user._key, query }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
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
              userId: user._key,
              auth: {
                checkPermission: checkPermission({ userId: user._key, query }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
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
                  userName: "${secondaryUser.userName}"
                  orgId: "${toGlobalId('organizations', 1)}"
                  role: ADMIN
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
              userId: user._key,
              auth: {
                checkPermission: checkPermission({ userId: user._key, query }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
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
                  userName: "${secondaryUser.userName}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
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
              userId: user._key,
              auth: {
                checkPermission: checkPermission({ userId: user._key, query }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to update a user: ${secondaryUser._key} role in org: treasury-board-secretariat, however they do not have permission to do so.`,
          ])
        })
      })
      describe('user attempts to update a users role in an org that the requesting user does not belong to', () => {
        let secondaryOrg
        beforeEach(async () => {
          secondaryOrg = await collections.organizations.save({
            blueCheck: false,
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
                  userName: "${secondaryUser.userName}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
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
              userId: user._key,
              auth: {
                checkPermission: checkPermission({ userId: user._key, query }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
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
                  userName: "${secondaryUser.userName}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
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
              userId: user._key,
              auth: {
                checkPermission: checkPermission({ userId: user._key, query }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
                userLoaderByUserName: userLoaderByUserName(query),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
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
                      userName: "${secondaryUser.userName}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: ADMIN
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
                  userId: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userId: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userId: user._key,
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const error = [new GraphQLError('todo')]

              expect(response.errors).toEqual(error)
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
                      userName: "${secondaryUser.userName}"
                      orgId: "${toGlobalId('organizations', org._key)}"
                      role: USER
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
                  userId: user._key,
                  auth: {
                    checkPermission: checkPermission({
                      userId: user._key,
                      query,
                    }),
                    userRequired: userRequired({
                      userId: user._key,
                      userLoaderByKey: userLoaderByKey(query),
                    }),
                  },
                  loaders: {
                    orgLoaderByKey: orgLoaderByKey(query, 'en'),
                    userLoaderByKey: userLoaderByKey(query),
                    userLoaderByUserName: userLoaderByUserName(query),
                  },
                  validators: {
                    cleanseInput,
                  },
                },
              )

              const error = [new GraphQLError('todo')]

              expect(response.errors).toEqual(error)
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
                    userName: "${secondaryUser.userName}"
                    orgId: "${toGlobalId('organizations', org._key)}"
                    role: USER
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
                userId: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userId: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userId: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                  userLoaderByUserName: userLoaderByUserName(query),
                },
                validators: {
                  cleanseInput,
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
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
                    userName: "${secondaryUser.userName}"
                    orgId: "${toGlobalId('organizations', org._key)}"
                    role: USER
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
                userId: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userId: user._key,
                    query,
                  }),
                  userRequired: userRequired({
                    userId: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en'),
                  userLoaderByKey: userLoaderByKey(query),
                  userLoaderByUserName: userLoaderByUserName(query),
                },
                validators: {
                  cleanseInput,
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to lower user: ${secondaryUser._key} from admin to: user.`,
            ])
          })
        })
      })
    })
    describe('database error occurs', () => {
      let org, user, secondaryUser
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

        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        user = await userCursor.next()

        await collections.users.save({
          displayName: 'Test Account',
          userName: 'test@email.gc.ca',
          preferredLang: 'english',
        })
        const secondaryUserCursor = await query`
          FOR user IN users
            FILTER user.userName == "test@email.gc.ca"
            RETURN user
        `
        secondaryUser = await secondaryUserCursor.next()

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
          const orgLoader = orgLoaderByKey(query, 'en')
          const userLoaderId = userLoaderByKey(query)
          const userLoaderUserName = userLoaderByUserName(query)

          query = jest
            .fn()
            .mockReturnValueOnce({
              next() {
                return 'admin'
              },
            })
            .mockReturnValueOnce({
              next() {
                return 'admin'
              },
            })
            .mockRejectedValue(new Error('Database error occurred.'))

          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "${secondaryUser.userName}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: USER
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
              userId: user._key,
              auth: {
                checkPermission: checkPermission({ userId: user._key, query }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderId,
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoader,
                userLoaderByKey: userLoaderId,
                userLoaderByUserName: userLoaderUserName,
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Database error occurred when user: ${user._key} attempted to update a users: ${secondaryUser._key} role, error: Error: Database error occurred.`,
          ])
        })
      })
    })
    describe('transaction error occurs', () => {
      let org, user, secondaryUser
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

        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        user = await userCursor.next()

        await collections.users.save({
          displayName: 'Test Account',
          userName: 'test@email.gc.ca',
          preferredLang: 'english',
        })
        const secondaryUserCursor = await query`
          FOR user IN users
            FILTER user.userName == "test@email.gc.ca"
            RETURN user
        `
        secondaryUser = await secondaryUserCursor.next()

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
          const orgLoader = orgLoaderByKey(query, 'en')
          const userLoaderId = userLoaderByKey(query)
          const userLoaderUserName = userLoaderByUserName(query)

          transaction = jest.fn().mockReturnValue({
            run() {
              throw new Error('Transaction error occurred.')
            },
          })

          const response = await graphql(
            schema,
            `
            mutation {
              updateUserRole (
                input: {
                  userName: "${secondaryUser.userName}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
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
              userId: user._key,
              auth: {
                checkPermission: checkPermission({ userId: user._key, query }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoader,
                userLoaderByKey: userLoaderId,
                userLoaderByUserName: userLoaderUserName,
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction run error occurred when user: ${user._key} attempted to update a users: ${secondaryUser._key} role, error: Error: Transaction error occurred.`,
          ])
        })
      })
      describe('when committing transaction', () => {
        it('returns an error message', async () => {
          const orgLoader = orgLoaderByKey(query, 'en')
          const userLoaderId = userLoaderByKey(query)
          const userLoaderUserName = userLoaderByUserName(query)

          transaction = jest.fn().mockReturnValue({
            run() {
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
                  userName: "${secondaryUser.userName}"
                  orgId: "${toGlobalId('organizations', org._key)}"
                  role: ADMIN
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
              userId: user._key,
              auth: {
                checkPermission: checkPermission({ userId: user._key, query }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                orgLoaderByKey: orgLoader,
                userLoaderByKey: userLoaderId,
                userLoaderByUserName: userLoaderUserName,
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `Transaction commit error occurred when user: ${user._key} attempted to update a users: ${secondaryUser._key} role, error: Error: Transaction error occurred.`,
          ])
        })
      })
    })
  })
})
