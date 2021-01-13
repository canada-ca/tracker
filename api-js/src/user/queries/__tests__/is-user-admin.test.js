import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema } from 'graphql'
import { setupI18n } from '@lingui/core'
import { makeMigrations } from '../../../../migrations'
import { checkPermission, userRequired } from '../../../auth'
import { createQuerySchema } from '../../../queries'
import { createMutationSchema } from '../../../mutations'
import { userLoaderByKey } from '../../../loaders'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the isUserAdmin query', () => {
  let query, drop, truncate, migrate, schema, collections, org, i18n, user

  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
  })

  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
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
    const userCursor = await query`
      FOR user IN users
        FILTER user.userName == "test.account@istio.actually.exists"
        RETURN user
    `
    user = await userCursor.next()
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful query', () => {
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
      it('will return true', async () => {
        const response = await graphql(
          schema,
          `
            query {
              isUserAdmin
            }
          `,
          null,
          {
            userKey: user._key,
            query: query,
            auth: {
              checkPermission: checkPermission({ userKey: user._key, query }),
              userRequired: userRequired({
                userKey: user._key,
                userLoaderByKey: userLoaderByKey(query),
              }),
            },
            loaders: {
              userLoaderByKey: userLoaderByKey(query),
            },
          },
        )

        const expectedResponse = {
          data: {
            isUserAdmin: true,
          },
        }
        expect(response).toEqual(expectedResponse)
      })
    })
    describe('if the user is an admin for an organization', () => {
      beforeEach(async () => {
        await query`
          INSERT {
            _from: ${org._id},
            _to: ${user._id},
            permission: "admin"
          } INTO affiliations
        `
      })
      it('will return true', async () => {
        const response = await graphql(
          schema,
          `
            query {
              isUserAdmin
            }
          `,
          null,
          {
            userKey: user._key,
            query: query,
            auth: {
              checkPermission: checkPermission({ userKey: user._key, query }),
              userRequired: userRequired({
                userKey: user._key,
                userLoaderByKey: userLoaderByKey(query),
              }),
            },
            loaders: {
              userLoaderByKey: userLoaderByKey(query),
            },
          },
        )

        const expectedResponse = {
          data: {
            isUserAdmin: true,
          },
        }
        expect(response).toEqual(expectedResponse)
      })
    })
    describe('if the user is only a user for their organization(s)', () => {
      beforeEach(async () => {
        await query`
          INSERT {
            _from: ${org._id},
            _to: ${user._id},
            permission: "user"
          } INTO affiliations
        `
      })
      it('will return false', async () => {
        const response = await graphql(
          schema,
          `
            query {
              isUserAdmin
            }
          `,
          null,
          {
            userKey: user._key,
            query: query,
            auth: {
              checkPermission: checkPermission({ userKey: user._key, query }),
              userRequired: userRequired({
                userKey: user._key,
                userLoaderByKey: userLoaderByKey(query),
              }),
            },
            loaders: {
              userLoaderByKey: userLoaderByKey(query),
            },
          },
        )

        const expectedResponse = {
          data: {
            isUserAdmin: false,
          },
        }
        expect(response).toEqual(expectedResponse)
      })
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
    describe('database error occurs', () => {
      it('returns an error message', async () => {
        const mockedQuery = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))

        try {
          await graphql(
            schema,
            `
              query {
                isUserAdmin
              }
            `,
            null,
            {
              i18n,
              userKey: user._key,
              query: mockedQuery,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Unable to verify if user is an admin, please try again.',
            ),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when user: ${user._key} was seeing if they were an admin, err: Error: Database error occurred.`,
        ])
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
    describe('database error occurs', () => {
      it('returns an error message', async () => {
        const mockedQuery = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))

        try {
          await graphql(
            schema,
            `
              query {
                isUserAdmin
              }
            `,
            null,
            {
              i18n,
              userKey: user._key,
              query: mockedQuery,
              auth: {
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  userLoaderByKey: userLoaderByKey(query),
                }),
              },
              loaders: {
                userLoaderByKey: userLoaderByKey(query),
              },
            },
          )
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Database error occurred when user: ${user._key} was seeing if they were an admin, err: Error: Database error occurred.`,
        ])
      })
    })
  })
})
