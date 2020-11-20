const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { setupI18n } = require('@lingui/core')
const { makeMigrations } = require('../../../../migrations')
const { userRequired, checkUserIsAdminForUser } = require('../../../auth')
const { createQuerySchema } = require('../..')
const { cleanseInput } = require('../../../validators')
const { createMutationSchema } = require('../../../mutations')
const { userLoaderByKey, userLoaderByUserName } = require('../../../loaders')
const englishMessages = require('../../../locale/en/messages')
const frenchMessages = require('../../../locale/fr/messages')

describe('given the findUserByUsername query', () => {
  let query,
    drop,
    truncate,
    migrate,
    schema,
    collections,
    org,
    i18n,
    user,
    userTwo

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
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    await truncate()
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
    })
    userTwo = await collections.users.save({
      userName: 'test.accounttwo@istio.actually.exists',
      displayName: 'Test Account Two',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
    })
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
    describe('given a successful query', () => {
      describe('user queries for another user', () => {
        describe('if the user is a super admin for an organization', () => {
          beforeEach(async () => {
            await query`
              INSERT {
                _from: ${org._id},
                _to: ${user._id},
                permission: "super_admin"
              } INTO affiliations
            `
          })
          it('will return specified user', async () => {
            const response = await graphql(
              schema,
              `
                query {
                  findUserByUsername(
                    userName: "test.accounttwo@istio.actually.exists"
                  ) {
                    id
                    userName
                    displayName
                    preferredLang
                    tfaValidated
                    emailValidated
                  }
                }
              `,
              null,
              {
                i18n,
                userKey: user._key,
                query: query,
                auth: {
                  userRequired: userRequired({
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                  checkUserIsAdminForUser: checkUserIsAdminForUser({
                    userKey: user._key,
                    query,
                  }),
                },
                loaders: {
                  userLoaderByUserName: userLoaderByUserName(query),
                },
                validators: {
                  cleanseInput,
                },
              },
            )

            const expectedResponse = {
              data: {
                findUserByUsername: {
                  id: toGlobalId('users', userTwo._key),
                  displayName: 'Test Account Two',
                  emailValidated: false,
                  preferredLang: 'FRENCH',
                  tfaValidated: false,
                  userName: 'test.accounttwo@istio.actually.exists',
                },
              },
            }
            expect(response).toEqual(expectedResponse)
          })
        })
        describe('if the user is an admin for the same organization', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'admin',
            })
            await collections.affiliations.save({
              _from: org._id,
              _to: userTwo._id,
              permission: 'user',
            })
          })
          it('will return specified user', async () => {
            const response = await graphql(
              schema,
              `
                query {
                  findUserByUsername(
                    userName: "test.accounttwo@istio.actually.exists"
                  ) {
                    id
                    userName
                    displayName
                    preferredLang
                    tfaValidated
                    emailValidated
                  }
                }
              `,
              null,
              {
                i18n,
                userKey: user._key,
                query: query,
                auth: {
                  userRequired: userRequired({
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                  checkUserIsAdminForUser: checkUserIsAdminForUser({
                    userKey: user._key,
                    query,
                  }),
                },
                loaders: {
                  userLoaderByUserName: userLoaderByUserName(query),
                },
                validators: {
                  cleanseInput,
                },
              },
            )

            const expectedResponse = {
              data: {
                findUserByUsername: {
                  id: toGlobalId('users', userTwo._key),
                  displayName: 'Test Account Two',
                  emailValidated: false,
                  preferredLang: 'FRENCH',
                  tfaValidated: false,
                  userName: 'test.accounttwo@istio.actually.exists',
                },
              },
            }
            expect(response).toEqual(expectedResponse)
          })
        })
      })
    })
    describe('given an unsuccessful query', () => {
      describe('if the user is an admin for a different organization', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
          await collections.affiliations.save({
            _from: 'organizations/2',
            _to: userTwo._id,
            permission: 'user',
          })
        })
        it('will return specified user', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findUserByUsername(
                  userName: "test.accounttwo@istio.actually.exists"
                ) {
                  id
                  userName
                  displayName
                  preferredLang
                  tfaValidated
                  emailValidated
                }
              }
            `,
            null,
            {
              i18n,
              userKey: user._key,
              query: query,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
                checkUserIsAdminForUser: checkUserIsAdminForUser({
                  userKey: user._key,
                  query,
                }),
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
              },
              validators: {
                cleanseInput,
              },
            },
          )
          expect(response.errors).toEqual([
            new GraphQLError('User could not be queried.'),
          ])
        })
      })
      describe('if the user is only a user for their organization(s)', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
          await collections.affiliations.save({
            _from: org._id,
            _to: userTwo._id,
            permission: 'user',
          })
        })
        it('will return error', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findUserByUsername(
                  userName: "test.accounttwo@istio.actually.exists"
                ) {
                  id
                  userName
                  displayName
                  preferredLang
                  tfaValidated
                  emailValidated
                }
              }
            `,
            null,
            {
              i18n,
              userKey: user._key,
              query: query,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
                checkUserIsAdminForUser: checkUserIsAdminForUser({
                  userKey: user._key,
                  query,
                }),
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [new GraphQLError(`User could not be queried.`)]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User ${user._key} is not permitted to query users.`,
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
    describe('given a successful query', () => {
      describe('user queries for another user', () => {
        describe('if the user is a super admin for an organization', () => {
          beforeEach(async () => {
            await query`
              INSERT {
                _from: ${org._id},
                _to: ${user._id},
                permission: "super_admin"
              } INTO affiliations
            `
          })
          it('will return specified user', async () => {
            const response = await graphql(
              schema,
              `
                query {
                  findUserByUsername(
                    userName: "test.accounttwo@istio.actually.exists"
                  ) {
                    id
                    userName
                    displayName
                    preferredLang
                    tfaValidated
                    emailValidated
                  }
                }
              `,
              null,
              {
                i18n,
                userKey: user._key,
                query: query,
                auth: {
                  userRequired: userRequired({
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                  checkUserIsAdminForUser: checkUserIsAdminForUser({
                    userKey: user._key,
                    query,
                  }),
                },
                loaders: {
                  userLoaderByUserName: userLoaderByUserName(query),
                },
                validators: {
                  cleanseInput,
                },
              },
            )

            const expectedResponse = {
              data: {
                findUserByUsername: {
                  id: toGlobalId('users', userTwo._key),
                  displayName: 'Test Account Two',
                  emailValidated: false,
                  preferredLang: 'FRENCH',
                  tfaValidated: false,
                  userName: 'test.accounttwo@istio.actually.exists',
                },
              },
            }
            expect(response).toEqual(expectedResponse)
          })
        })
        describe('if the user is an admin for the same organization', () => {
          beforeEach(async () => {
            await collections.affiliations.save({
              _from: org._id,
              _to: user._id,
              permission: 'admin',
            })
            await collections.affiliations.save({
              _from: org._id,
              _to: userTwo._id,
              permission: 'user',
            })
          })
          it('will return specified user', async () => {
            const response = await graphql(
              schema,
              `
                query {
                  findUserByUsername(
                    userName: "test.accounttwo@istio.actually.exists"
                  ) {
                    id
                    userName
                    displayName
                    preferredLang
                    tfaValidated
                    emailValidated
                  }
                }
              `,
              null,
              {
                i18n,
                userKey: user._key,
                query: query,
                auth: {
                  userRequired: userRequired({
                    userKey: user._key,
                    userLoaderByKey: userLoaderByKey(query),
                  }),
                  checkUserIsAdminForUser: checkUserIsAdminForUser({
                    userKey: user._key,
                    query,
                  }),
                },
                loaders: {
                  userLoaderByUserName: userLoaderByUserName(query),
                },
                validators: {
                  cleanseInput,
                },
              },
            )

            const expectedResponse = {
              data: {
                findUserByUsername: {
                  id: toGlobalId('users', userTwo._key),
                  displayName: 'Test Account Two',
                  emailValidated: false,
                  preferredLang: 'FRENCH',
                  tfaValidated: false,
                  userName: 'test.accounttwo@istio.actually.exists',
                },
              },
            }
            expect(response).toEqual(expectedResponse)
          })
        })
      })
    })
    describe('given an unsuccessful query', () => {
      describe('if the user is an admin for a different organization', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'admin',
          })
          await collections.affiliations.save({
            _from: 'organizations/2',
            _to: userTwo._id,
            permission: 'user',
          })
        })
        it('will return specified user', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findUserByUsername(
                  userName: "test.accounttwo@istio.actually.exists"
                ) {
                  id
                  userName
                  displayName
                  preferredLang
                  tfaValidated
                  emailValidated
                }
              }
            `,
            null,
            {
              i18n,
              userKey: user._key,
              query: query,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
                checkUserIsAdminForUser: checkUserIsAdminForUser({
                  userKey: user._key,
                  query,
                }),
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
              },
              validators: {
                cleanseInput,
              },
            },
          )
          expect(response.errors).toEqual([new GraphQLError('todo')])
        })
      })
      describe('if the user is only a user for their organization(s)', () => {
        beforeEach(async () => {
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'user',
          })
          await collections.affiliations.save({
            _from: org._id,
            _to: userTwo._id,
            permission: 'user',
          })
        })
        it('will return error', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findUserByUsername(
                  userName: "test.accounttwo@istio.actually.exists"
                ) {
                  id
                  userName
                  displayName
                  preferredLang
                  tfaValidated
                  emailValidated
                }
              }
            `,
            null,
            {
              i18n,
              userKey: user._key,
              query: query,
              auth: {
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
                checkUserIsAdminForUser: checkUserIsAdminForUser({
                  userKey: user._key,
                  query,
                }),
              },
              loaders: {
                userLoaderByUserName: userLoaderByUserName(query),
              },
              validators: {
                cleanseInput,
              },
            },
          )

          const error = [new GraphQLError(`todo`)]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User ${user._key} is not permitted to query users.`,
          ])
        })
      })
    })
  })
})
