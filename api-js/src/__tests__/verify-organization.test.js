const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { setupI18n } = require('@lingui/core')
const { makeMigrations } = require('../../migrations')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')

const englishMessages = require('../locale/en/messages')
const frenchMessages = require('../locale/fr/messages')

const bcrypt = require('bcrypt')
const { cleanseInput } = require('../validators')
const { checkPermission, tokenize, userRequired } = require('../auth')
const {
  orgLoaderByKey,
  userLoaderByKey,
  userLoaderByUserName,
} = require('../loaders')
const { toGlobalId } = require('graphql-relay')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('removing an organization', () => {
  let query, drop, truncate, migrate, schema, collections, transaction, i18n

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

  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
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

  afterAll(async () => {
    await drop()
  })

  describe('given a successful org verification', () => {
    let org, user
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
      user = await userLoaderByUserName(query).load(
        'test.account@istio.actually.exists',
      )
      await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'super_admin',
      })
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
                  i18n,
                }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                  i18n,
                }),
              },
              validators: { cleanseInput },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en', user._key, i18n),
                userLoaderByKey: userLoaderByKey(query, user._key, i18n),
              },
            },
          )

          const expectedResponse = {
            data: {
              verifyOrganization: {
                status:
                  'Successfully verified organization: treasury-board-secretariat.',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key}, successfully verified org: ${org._key}.`,
          ])

          const orgLoader = orgLoaderByKey(query, 'en', user._key, i18n)
          const verifiedOrg = await orgLoader.load(org._key)
          expect(verifiedOrg.verified).toEqual(true)
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
                  i18n,
                }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                  i18n,
                }),
              },
              validators: { cleanseInput },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'fr', user._key, i18n),
                userLoaderByKey: userLoaderByKey(query, user._key, i18n),
              },
            },
          )

          const expectedResponse = {
            data: {
              verifyOrganization: {
                status: 'todo',
              },
            },
          }

          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User: ${user._key}, successfully verified org: ${org._key}.`,
          ])

          const orgLoader = orgLoaderByKey(query, 'fr', user._key, i18n)
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
          language: 'en',
          locales: ['en', 'fr'],
          missing: 'Traduction manquante',
          catalogs: {
            en: englishMessages,
            fr: frenchMessages,
          },
        })
      })
      describe('organization is already verified', () => {
        let org, user
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
          user = await userLoaderByUserName(query).load(
            'test.account@istio.actually.exists',
          )
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
                  i18n,
                }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                  i18n,
                }),
              },
              validators: { cleanseInput },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en', user._key, i18n),
                userLoaderByKey: userLoaderByKey(query, user._key, i18n),
              },
            },
          )

          const error = [
            new GraphQLError('Organization has already been verified.'),
          ]

          expect(response.errors).toEqual(error)

          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to verify organization: ${org._key}, however the organization has already been verified.`,
          ])
        })
      })
      describe('organization is not found', () => {
        let org, user
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
          user = await userLoaderByUserName(query).load(
            'test.account@istio.actually.exists',
          )
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
                  i18n,
                }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                  i18n,
                }),
              },
              validators: { cleanseInput },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en', user._key, i18n),
                userLoaderByKey: userLoaderByKey(query, user._key, i18n),
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
            `User: ${user._key} attempted to verify organization: -1, however no organizations is associated with that id.`,
          ])
        })
      })
      describe('user permission is not super admin', () => {
        describe('users permission level is admin', () => {
          let org, user
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
            user = await userLoaderByUserName(query).load(
              'test.account@istio.actually.exists',
            )
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
                    i18n,
                  }),
                  userRequired: userRequired({
                    userId: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                    i18n,
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en', user._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
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
              `User: ${user._key} attempted to verify organization: ${org._key}, however they do not have the correct permission level. Permission: admin`,
            ])
          })
        })
        describe('users permission level is user', () => {
          let org, user
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
            user = await userLoaderByUserName(query).load(
              'test.account@istio.actually.exists',
            )
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
                    i18n,
                  }),
                  userRequired: userRequired({
                    userId: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                    i18n,
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en', user._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
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
              `User: ${user._key} attempted to verify organization: ${org._key}, however they do not have the correct permission level. Permission: user`,
            ])
          })
        })
      })
      describe('transaction error occurs', () => {
        let org, user
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
          user = await userLoaderByUserName(query).load(
            'test.account@istio.actually.exists',
          )
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        describe('when running transaction', () => {
          it('throws an error message', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              run() {
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
                userId: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userId: user._key,
                    query,
                    i18n,
                  }),
                  userRequired: userRequired({
                    userId: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                    i18n,
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en', user._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
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
        describe('when committing transaction', () => {
          it('throws an error message', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              run() {
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
                userId: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userId: user._key,
                    query,
                    i18n,
                  }),
                  userRequired: userRequired({
                    userId: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                    i18n,
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en', user._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
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
          language: 'fr',
          locales: ['en', 'fr'],
          missing: 'Traduction manquante',
          catalogs: {
            en: englishMessages,
            fr: frenchMessages,
          },
        })
      })
      describe('organization is already verified', () => {
        let org, user
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
          user = await userLoaderByUserName(query).load(
            'test.account@istio.actually.exists',
          )
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
                  i18n,
                }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                  i18n,
                }),
              },
              validators: { cleanseInput },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en', user._key, i18n),
                userLoaderByKey: userLoaderByKey(query, user._key, i18n),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)

          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to verify organization: ${org._key}, however the organization has already been verified.`,
          ])
        })
      })
      describe('organization is not found', () => {
        let org, user
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
          user = await userLoaderByUserName(query).load(
            'test.account@istio.actually.exists',
          )
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
                  i18n,
                }),
                userRequired: userRequired({
                  userId: user._key,
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                  i18n,
                }),
              },
              validators: { cleanseInput },
              loaders: {
                orgLoaderByKey: orgLoaderByKey(query, 'en', user._key, i18n),
                userLoaderByKey: userLoaderByKey(query, user._key, i18n),
              },
            },
          )

          const error = [new GraphQLError('todo')]

          expect(response.errors).toEqual(error)

          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to verify organization: -1, however no organizations is associated with that id.`,
          ])
        })
      })
      describe('user permission is not super admin', () => {
        describe('users permission level is admin', () => {
          let org, user
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
            user = await userLoaderByUserName(query).load(
              'test.account@istio.actually.exists',
            )
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
                    i18n,
                  }),
                  userRequired: userRequired({
                    userId: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                    i18n,
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en', user._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to verify organization: ${org._key}, however they do not have the correct permission level. Permission: admin`,
            ])
          })
        })
        describe('users permission level is user', () => {
          let org, user
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
            user = await userLoaderByUserName(query).load(
              'test.account@istio.actually.exists',
            )
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
                    i18n,
                  }),
                  userRequired: userRequired({
                    userId: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                    i18n,
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en', user._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to verify organization: ${org._key}, however they do not have the correct permission level. Permission: user`,
            ])
          })
        })
      })
      describe('transaction error occurs', () => {
        let org, user
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
          user = await userLoaderByUserName(query).load(
            'test.account@istio.actually.exists',
          )
          await collections.affiliations.save({
            _from: org._id,
            _to: user._id,
            permission: 'super_admin',
          })
        })
        describe('when running transaction', () => {
          it('throws an error message', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              run() {
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
                userId: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userId: user._key,
                    query,
                    i18n,
                  }),
                  userRequired: userRequired({
                    userId: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                    i18n,
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en', user._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                },
              },
            )

            const error = [new GraphQLError('todo')]

            expect(response.errors).toEqual(error)

            expect(consoleOutput).toEqual([
              `Transaction error occurred while upserting verified org: ${org._key}, err: Error: Database error occurred.`,
            ])
          })
        })
        describe('when committing transaction', () => {
          it('throws an error message', async () => {
            const mockedTransaction = jest.fn().mockReturnValue({
              run() {
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
                userId: user._key,
                auth: {
                  checkPermission: checkPermission({
                    userId: user._key,
                    query,
                    i18n,
                  }),
                  userRequired: userRequired({
                    userId: user._key,
                    userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                    i18n,
                  }),
                },
                validators: { cleanseInput },
                loaders: {
                  orgLoaderByKey: orgLoaderByKey(query, 'en', user._key, i18n),
                  userLoaderByKey: userLoaderByKey(query, user._key, i18n),
                },
              },
            )

            const error = [new GraphQLError('todo')]

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
