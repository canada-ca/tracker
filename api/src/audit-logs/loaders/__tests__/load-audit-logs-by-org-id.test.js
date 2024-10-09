import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput } from '../../../validators'
import { loadAuditLogsByOrgId, loadAuditLogByKey } from '../index'
import { toGlobalId } from 'graphql-relay'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the load log connection using org id function', () => {
  let query, drop, truncate, collections, user, log1, log2, log3, i18n, language

  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.error = mockedError
    console.warn = mockedWarn
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful load', () => {
    beforeAll(async () => {
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
      language = 'en'
    })
    beforeEach(async () => {
      user = await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
        tfaValidated: false,
        emailValidated: false,
      })
      log1 = await collections.auditLogs.save({
        timestamp: 'Hello World',
        initiatedBy: {
          id: '0ca868c6-224c-446d-aaa9-c96f9a091f7e',
          userName: 'user1',
          role: 'Hello World',
          organization: 'Hello World',
        },
        action: 'add',
        target: {
          resource: 'user3',
          organization: {
            name: 'Hello World',
          },
          resourceType: 'user',
          updatedProperties: [],
        },
        reason: '',
      })
      log2 = await collections.auditLogs.save({
        timestamp: 'Hello World',
        initiatedBy: {
          id: '0ca868c6-224c-446d-aaa9-c96f9a091f7e',
          userName: 'user2',
          role: 'Hello World',
          organization: 'Hello World',
        },
        action: 'update',
        target: {
          resource: 'org1',
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
          ],
        },
        reason: '',
      })
      log3 = await collections.auditLogs.save({
        timestamp: 'Hello World',
        initiatedBy: {
          id: '0ca868c6-224c-446d-aaa9-c96f9a091f7e',
          userName: 'user3',
          role: 'Hello World',
          organization: 'Hello World',
        },
        action: 'remove',
        target: {
          resource: 'domain1',
          organization: {
            name: 'Hello World',
          },
          resourceType: 'domain',
          updatedProperties: [],
        },
        reason: 'wrong_org',
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('using first limit', () => {
      it('returns a log', async () => {
        const connectionLoader = loadAuditLogsByOrgId({
          query,
          language,
          userKey: user._key,
          cleanseInput,
        })

        const connectionArgs = {
          first: 1,
        }
        const logs = await connectionLoader({
          permission: 'super_admin',
          ...connectionArgs,
        })

        const logLoader = loadAuditLogByKey({ query })
        const expectedLogs = await logLoader.loadMany([log1._key, log2._key])

        expectedLogs[0].id = expectedLogs[0]._key
        expectedLogs[1].id = expectedLogs[1]._key

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('auditLog', expectedLogs[0]._key),
              node: {
                ...expectedLogs[0],
              },
            },
          ],
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('auditLog', expectedLogs[0]._key),
            endCursor: toGlobalId('auditLog', expectedLogs[0]._key),
          },
          totalCount: 3,
        }

        expect(logs).toEqual(expectedStructure)
      })
    })
    describe('using search argument', () => {
      beforeEach(async () => {
        // This is used to sync the view before running the test below
        await query`
          FOR log IN auditLogSearch
            SEARCH log.target.resource == "log"
            OPTIONS { waitForSync: true }
            RETURN log
        `
      })
      it('returns filtered logs', async () => {
        const connectionLoader = loadAuditLogsByOrgId({
          query,
          userKey: user._key,
          language,
          cleanseInput,
          auth: { loginRequired: true },
        })

        const logLoader = loadAuditLogByKey({ query })
        const expectedLog = await logLoader.load(log3._key)

        const connectionArgs = {
          first: 1,
          permission: 'super_admin',
          search: 'domain1',
        }

        const logs = await connectionLoader({ ...connectionArgs })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('auditLog', expectedLog._key),
              node: {
                ...expectedLog,
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('auditLog', expectedLog._key),
            endCursor: toGlobalId('auditLog', expectedLog._key),
          },
        }

        expect(logs).toEqual(expectedStructure)
      })
    })
    describe('no logs are found', () => {
      it('returns an empty structure', async () => {
        await truncate()
        const connectionLoader = loadAuditLogsByOrgId({
          query,
          userKey: user._key,
          language,
          cleanseInput,
          auth: { loginRequired: true },
        })

        const connectionArgs = {
          first: 10,
        }
        const logs = await connectionLoader({
          permission: 'super_admin',
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: '',
            endCursor: '',
          },
          totalCount: 0,
        }

        expect(logs).toEqual(expectedStructure)
      })
    })
    describe('using orderByField', () => {
      describe('using after cursor', () => {
        describe('ordering on TIMESTAMP', () => {
          describe('order direction is ASC', () => {
            it('returns logs in order', async () => {
              const logLoader = loadAuditLogByKey({ query })
              const expectedLogs = await logLoader.loadMany([log1._key, log2._key, log3._key])

              expectedLogs[0].id = expectedLogs[0]._key
              expectedLogs[1].id = expectedLogs[1]._key
              expectedLogs[2].id = expectedLogs[2]._key

              const connectionArgs = {
                first: 1,
                after: toGlobalId('auditLog', expectedLogs[1]._key),
                orderBy: {
                  field: 'timestamp',
                  direction: 'ASC',
                },
              }
              const connectionLoader = loadAuditLogsByOrgId({
                query,
                userKey: user._key,
                language,
                cleanseInput,
                auth: { loginRequired: true },
              })
              const logs = await connectionLoader({
                permission: 'super_admin',
                ...connectionArgs,
              })

              const expectedStructure = {
                edges: [
                  {
                    cursor: toGlobalId('auditLog', expectedLogs[2]._key),
                    node: {
                      ...expectedLogs[2],
                    },
                  },
                ],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: true,
                  startCursor: toGlobalId('auditLog', expectedLogs[2]._key),
                  endCursor: toGlobalId('auditLog', expectedLogs[2]._key),
                },
              }

              expect(logs).toEqual(expectedStructure)
            })
          })
        })
      })
    })
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
    describe('given an unsuccessful load', () => {
      describe('limits are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadAuditLogsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
            i18n,
          })

          const connectionArgs = {}
          try {
            await connectionLoader({
              permission: 'super_admin',
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(`You must provide a \`first\` or \`last\` value to properly paginate the \`Log\` connection.`),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadAuditLogsByOrgId.`,
          ])
        })
      })
      describe('both limits are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadAuditLogsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
            i18n,
          })

          const connectionArgs = {
            first: 1,
            last: 1,
          }
          try {
            await connectionLoader({
              permission: 'super_admin',
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(`Passing both \`first\` and \`last\` to paginate the \`Log\` connection is not supported.`),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadAuditLogsByOrgId.`,
          ])
        })
      })
      describe('limits are set below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadAuditLogsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              auth: { loginRequired: true },
              i18n,
            })

            const connectionArgs = {
              first: -5,
            }
            try {
              await connectionLoader({
                permission: 'super_admin',
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error(`\`first\` on the \`Log\` connection cannot be less than zero.`))
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadAuditLogsByOrgId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadAuditLogsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              auth: { loginRequired: true },
              i18n,
            })

            const connectionArgs = {
              last: -5,
            }
            try {
              await connectionLoader({
                permission: 'super_admin',
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error(`\`last\` on the \`Log\` connection cannot be less than zero.`))
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadAuditLogsByOrgId.`,
            ])
          })
        })
      })
      describe('limits are set above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadAuditLogsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              auth: { loginRequired: true },
              i18n,
            })

            const connectionArgs = {
              first: 1000,
            }
            try {
              await connectionLoader({
                permission: 'super_admin',
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  `Requesting \`1000\` records on the \`Log\` connection exceeds the \`first\` limit of 100 records.`,
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 1000 for: loadAuditLogsByOrgId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadAuditLogsByOrgId({
              query,
              userKey: user._key,
              cleanseInput,
              auth: { loginRequired: true },
              i18n,
            })

            const connectionArgs = {
              last: 1000,
            }
            try {
              await connectionLoader({
                permission: 'super_admin',
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  `Requesting \`1000\` records on the \`Log\` connection exceeds the \`last\` limit of 100 records.`,
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 1000 for: loadAuditLogsByOrgId.`,
            ])
          })
        })
      })
    })
    describe('given a database error', () => {
      describe('when gathering log keys that are claimed by orgs that the user has affiliations to', () => {
        it('returns an error message', async () => {
          const query = jest.fn().mockRejectedValue(new Error('Database Error Occurred.'))

          const connectionLoader = loadAuditLogsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
            i18n,
          })

          const connectionArgs = {
            first: 5,
          }
          try {
            await connectionLoader({
              permission: 'super_admin',
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('Unable to query log(s). Please try again.'))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to query logs in loadAuditLogsByOrgId, error: Error: Database Error Occurred.`,
          ])
        })
      })
    })
    describe('given a cursor error', () => {
      describe('when gathering log keys that are claimed by orgs that the user has affiliations to', () => {
        it('returns an error message', async () => {
          const cursor = {
            next() {
              throw new Error('Cursor error occurred.')
            },
          }
          const query = jest.fn().mockReturnValueOnce(cursor)

          const connectionLoader = loadAuditLogsByOrgId({
            query,
            userKey: user._key,
            cleanseInput,
            auth: { loginRequired: true },
            i18n,
          })

          const connectionArgs = {
            first: 5,
          }
          try {
            await connectionLoader({
              permission: 'super_admin',
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('Unable to load log(s). Please try again.'))
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user: ${user._key} was trying to gather logs in loadAuditLogsByOrgId, error: Error: Cursor error occurred.`,
          ])
        })
      })
    })
  })
})
