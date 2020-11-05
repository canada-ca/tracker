const { DB_PASS: rootPass, DB_URL: url } = process.env

const { stringify } = require('jest-matcher-utils')
const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { toGlobalId } = require('graphql-relay')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../locale/en/messages')
const frenchMessages = require('../locale/fr/messages')
const { makeMigrations } = require('../../migrations')
const { cleanseInput } = require('../validators')
const {
  httpsLoaderConnectionsByDomainId,
  httpsLoaderByKey,
} = require('../loaders')

describe('given the load https connection function', () => {
  let query, drop, truncate, migrate, collections, user, domain, i18n

  const consoleWarnOutput = []
  const mockedWarn = (output) => consoleWarnOutput.push(output)

  const consoleErrorOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)

  beforeAll(async () => {
    console.warn = mockedWarn
    console.error = mockedError
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
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

  beforeEach(async () => {
    await truncate()
    consoleWarnOutput.length = 0
    consoleErrorOutput.length = 0

    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
    })
    domain = await collections.domains.save({
      domain: 'test.domain.gc.ca',
      slug: 'test-domain-gc-ca',
    })
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful load', () => {
    let httpsScan1, httpsScan2
    beforeEach(async () => {
      httpsScan1 = await collections.https.save({
        timestamp: '2020-10-02T12:43:39Z',
      })
      httpsScan2 = await collections.https.save({
        timestamp: '2020-10-03T12:43:39Z',
      })
      await collections.domainsHTTPS.save({
        _to: httpsScan1._id,
        _from: domain._id,
      })
      await collections.domainsHTTPS.save({
        _to: httpsScan2._id,
        _from: domain._id,
      })
    })
    describe('using no cursor', () => {
      it('returns multiple https scans', async () => {
        const connectionLoader = httpsLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const httpsLoader = httpsLoaderByKey(query, i18n)
        const expectedHttpsScans = await httpsLoader.loadMany([
          httpsScan1._key,
          httpsScan2._key,
        ])

        expectedHttpsScans[0].id = expectedHttpsScans[0]._key
        expectedHttpsScans[0].domainId = domain._id

        expectedHttpsScans[1].id = expectedHttpsScans[1]._key
        expectedHttpsScans[1].domainId = domain._id

        const connectionArgs = {
          first: 5,
        }

        const httpsScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('https', expectedHttpsScans[0]._key),
              node: {
                ...expectedHttpsScans[0],
              },
            },
            {
              cursor: toGlobalId('https', expectedHttpsScans[1]._key),
              node: {
                ...expectedHttpsScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('https', expectedHttpsScans[0]._key),
            endCursor: toGlobalId('https', expectedHttpsScans[1]._key),
          },
        }

        expect(httpsScans).toEqual(expectedStructure)
      })
    })
    describe('using after cursor', () => {
      it('returns https scan(s) after a given node id', async () => {
        const connectionLoader = httpsLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const httpsLoader = httpsLoaderByKey(query, i18n)
        const expectedHttpsScans = await httpsLoader.loadMany([
          httpsScan1._key,
          httpsScan2._key,
        ])

        expectedHttpsScans[0].id = expectedHttpsScans[0]._key
        expectedHttpsScans[0].domainId = domain._id

        expectedHttpsScans[1].id = expectedHttpsScans[1]._key
        expectedHttpsScans[1].domainId = domain._id

        const connectionArgs = {
          first: 5,
          after: toGlobalId('https', expectedHttpsScans[0]._key),
        }

        const httpsScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('https', expectedHttpsScans[1]._key),
              node: {
                ...expectedHttpsScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('https', expectedHttpsScans[1]._key),
            endCursor: toGlobalId('https', expectedHttpsScans[1]._key),
          },
        }

        expect(httpsScans).toEqual(expectedStructure)
      })
    })
    describe('using before cursor', () => {
      it('returns https scan(s) before a given node id', async () => {
        const connectionLoader = httpsLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const httpsLoader = httpsLoaderByKey(query, i18n)
        const expectedHttpsScans = await httpsLoader.loadMany([
          httpsScan1._key,
          httpsScan2._key,
        ])

        expectedHttpsScans[0].id = expectedHttpsScans[0]._key
        expectedHttpsScans[0].domainId = domain._id

        expectedHttpsScans[1].id = expectedHttpsScans[1]._key
        expectedHttpsScans[1].domainId = domain._id

        const connectionArgs = {
          first: 5,
          before: toGlobalId('https', expectedHttpsScans[1]._key),
        }

        const httpsScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('https', expectedHttpsScans[0]._key),
              node: {
                ...expectedHttpsScans[0],
              },
            },
          ],
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('https', expectedHttpsScans[0]._key),
            endCursor: toGlobalId('https', expectedHttpsScans[0]._key),
          },
        }

        expect(httpsScans).toEqual(expectedStructure)
      })
    })
    describe('using first limit', () => {
      it('returns the first n amount of https scan(s)', async () => {
        const connectionLoader = httpsLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const httpsLoader = httpsLoaderByKey(query, i18n)
        const expectedHttpsScans = await httpsLoader.loadMany([
          httpsScan1._key,
          httpsScan2._key,
        ])

        expectedHttpsScans[0].id = expectedHttpsScans[0]._key
        expectedHttpsScans[0].domainId = domain._id

        expectedHttpsScans[1].id = expectedHttpsScans[1]._key
        expectedHttpsScans[1].domainId = domain._id

        const connectionArgs = {
          first: 1,
        }

        const httpsScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('https', expectedHttpsScans[0]._key),
              node: {
                ...expectedHttpsScans[0],
              },
            },
          ],
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('https', expectedHttpsScans[0]._key),
            endCursor: toGlobalId('https', expectedHttpsScans[0]._key),
          },
        }

        expect(httpsScans).toEqual(expectedStructure)
      })
    })
    describe('using last limit', () => {
      it('returns the last n amount of https scan(s)', async () => {
        const connectionLoader = httpsLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const httpsLoader = httpsLoaderByKey(query, i18n)
        const expectedHttpsScans = await httpsLoader.loadMany([
          httpsScan1._key,
          httpsScan2._key,
        ])

        expectedHttpsScans[0].id = expectedHttpsScans[0]._key
        expectedHttpsScans[0].domainId = domain._id

        expectedHttpsScans[1].id = expectedHttpsScans[1]._key
        expectedHttpsScans[1].domainId = domain._id

        const connectionArgs = {
          last: 1,
        }

        const httpsScans = await connectionLoader({
          domainId: domain._id,
          ...connectionArgs,
        })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('https', expectedHttpsScans[1]._key),
              node: {
                ...expectedHttpsScans[1],
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('https', expectedHttpsScans[1]._key),
            endCursor: toGlobalId('https', expectedHttpsScans[1]._key),
          },
        }

        expect(httpsScans).toEqual(expectedStructure)
      })
    })
    describe('using date filter', () => {
      let httpsScan3
      beforeEach(async () => {
        httpsScan3 = await collections.https.save({
          timestamp: '2020-10-04T12:43:39Z',
        })
        await collections.domainsHTTPS.save({
          _to: httpsScan3._id,
          _from: domain._id,
        })
      })
      describe('using start date filter', () => {
        it('returns https scans at and after the start date', async () => {
          const connectionLoader = httpsLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const httpsLoader = httpsLoaderByKey(query, i18n)
          const expectedHttpsScans = await httpsLoader.loadMany([
            httpsScan2._key,
            httpsScan3._key,
          ])

          expectedHttpsScans[0].id = expectedHttpsScans[0]._key
          expectedHttpsScans[0].domainId = domain._id

          expectedHttpsScans[1].id = expectedHttpsScans[1]._key
          expectedHttpsScans[1].domainId = domain._id

          const connectionArgs = {
            first: 5,
            startDate: '2020-10-03',
          }

          const httpsScans = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('https', expectedHttpsScans[0]._key),
                node: {
                  ...expectedHttpsScans[0],
                },
              },
              {
                cursor: toGlobalId('https', expectedHttpsScans[1]._key),
                node: {
                  ...expectedHttpsScans[1],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId('https', expectedHttpsScans[0]._key),
              endCursor: toGlobalId('https', expectedHttpsScans[1]._key),
            },
          }

          expect(httpsScans).toEqual(expectedStructure)
        })
      })
      describe('using end date filter', () => {
        it('returns https scans at and before the end date', async () => {
          const connectionLoader = httpsLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const httpsLoader = await httpsLoaderByKey(query, i18n)
          const expectedHttpsScans = await httpsLoader.loadMany([
            httpsScan1._key,
            httpsScan2._key,
          ])

          expectedHttpsScans[0].id = expectedHttpsScans[0]._key
          expectedHttpsScans[0].domainId = domain._id

          expectedHttpsScans[1].id = expectedHttpsScans[1]._key
          expectedHttpsScans[1].domainId = domain._id

          const connectionArgs = {
            first: 5,
            endDate: '2020-10-03T13:50:00Z',
          }

          const httpsScans = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('https', expectedHttpsScans[0]._key),
                node: {
                  ...expectedHttpsScans[0],
                },
              },
              {
                cursor: toGlobalId('https', expectedHttpsScans[1]._key),
                node: {
                  ...expectedHttpsScans[1],
                },
              },
            ],
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: toGlobalId('https', expectedHttpsScans[0]._key),
              endCursor: toGlobalId('https', expectedHttpsScans[1]._key),
            },
          }

          expect(httpsScans).toEqual(expectedStructure)
        })
      })
      describe('using start and end date filters', () => {
        it('returns a scan on a specific date', async () => {
          const connectionLoader = httpsLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const httpsLoader = httpsLoaderByKey(query, i18n)
          const expectedHttpsScans = await httpsLoader.loadMany([
            httpsScan2._key,
          ])

          expectedHttpsScans[0].id = expectedHttpsScans[0]._key
          expectedHttpsScans[0].domainId = domain._id

          const connectionArgs = {
            first: 5,
            startDate: '2020-10-03T00:00:00Z',
            endDate: '2020-10-03T23:59:59Z',
          }

          const httpsScans = await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('https', expectedHttpsScans[0]._key),
                node: {
                  ...expectedHttpsScans[0],
                },
              },
            ],
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: true,
              startCursor: toGlobalId('https', expectedHttpsScans[0]._key),
              endCursor: toGlobalId('https', expectedHttpsScans[0]._key),
            },
          }

          expect(httpsScans).toEqual(expectedStructure)
        })
      })
    })
    describe('no https scans are found', () => {
      it('returns an empty structure', async () => {
        await truncate()

        const connectionLoader = httpsLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const connectionArgs = {
          first: 5,
        }

        const httpsScans = await connectionLoader({
          domainId: domain._id,
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
        }

        expect(httpsScans).toEqual(expectedStructure)
      })
    })
  })
  describe('language is set to english', () => {
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
    describe('given an unsuccessful load', () => {
      describe('both limits are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = httpsLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {}

          try {
            await connectionLoader({
              domainId: domain._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'You must provide a `first` or `last` value to properly paginate the `https` connection.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: httpsLoaderConnectionsByDomainId.`,
          ])
        })
      })
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = httpsLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {
            first: 1,
            last: 5,
          }

          try {
            await connectionLoader({
              domainId: domain._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Passing both `first` and `last` to paginate the `https` connection is not supported.',
              ),
            )
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} tried to have \`first\` and \`last\` arguments set for: httpsLoaderConnectionsByDomainId.`,
          ])
        })
      })
      describe('limits are below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = httpsLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              first: -1,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`first` on the `https` connection cannot be less than zero.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: httpsLoaderConnectionsByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = httpsLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              last: -5,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`last` on the `https` connection cannot be less than zero.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: httpsLoaderConnectionsByDomainId.`,
            ])
          })
        })
      })
      describe('limits are above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = httpsLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              first: 101,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting 101 records on the `https` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 101 for: httpsLoaderConnectionsByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = httpsLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              last: 500,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting 500 records on the `https` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: httpsLoaderConnectionsByDomainId.`,
            ])
          })
        })
      })
      describe('limits are not set to numbers', () => {
        describe('first limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when first set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = httpsLoaderConnectionsByDomainId(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

              const connectionArgs = {
                first: invalidInput,
              }

              try {
                await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(
                  new Error(
                    `\`first\` must be of type \`number\` not \`${typeof invalidInput}\`.`,
                  ),
                )
              }
              expect(consoleWarnOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: httpsLoaderConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = httpsLoaderConnectionsByDomainId(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

              const connectionArgs = {
                last: invalidInput,
              }

              try {
                await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(
                  new Error(
                    `\`last\` must be of type \`number\` not \`${typeof invalidInput}\`.`,
                  ),
                )
              }
              expect(consoleWarnOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: httpsLoaderConnectionsByDomainId.`,
              ])
            })
          })
        })
      })
    })
    describe('database error occurs', () => {
      it('throws an error', async () => {
        const query = jest
          .fn()
          .mockRejectedValue(new Error('Database Error Occurred.'))

        const connectionLoader = httpsLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const connectionArgs = {
          first: 5,
        }

        try {
          await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to load https scans. Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to get https information for ${domain._id}, error: Error: Database Error Occurred.`,
        ])
      })
    })
    describe('cursor error occurs', () => {
      it('throws an error', async () => {
        const cursor = {
          next() {
            throw new Error('Cursor Error Occurred.')
          },
        }
        const query = jest.fn().mockReturnValueOnce(cursor)

        const connectionLoader = httpsLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const connectionArgs = {
          first: 5,
        }

        try {
          await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to load https scans. Please try again.'),
          )
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to get https information for ${domain._id}, error: Error: Cursor Error Occurred.`,
        ])
      })
    })
  })
  describe('language is set to french', () => {
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
    describe('given an unsuccessful load', () => {
      describe('both limits are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = httpsLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {}

          try {
            await connectionLoader({
              domainId: domain._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: httpsLoaderConnectionsByDomainId.`,
          ])
        })
      })
      describe('first and last arguments are set', () => {
        it('returns an error message', async () => {
          const connectionLoader = httpsLoaderConnectionsByDomainId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {
            first: 1,
            last: 5,
          }

          try {
            await connectionLoader({
              domainId: domain._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }
          expect(consoleWarnOutput).toEqual([
            `User: ${user._key} tried to have \`first\` and \`last\` arguments set for: httpsLoaderConnectionsByDomainId.`,
          ])
        })
      })
      describe('limits are below minimum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = httpsLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              first: -1,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: httpsLoaderConnectionsByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = httpsLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              last: -5,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: httpsLoaderConnectionsByDomainId.`,
            ])
          })
        })
      })
      describe('limits are above maximum', () => {
        describe('first limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = httpsLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              first: 101,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 101 for: httpsLoaderConnectionsByDomainId.`,
            ])
          })
        })
        describe('last limit is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = httpsLoaderConnectionsByDomainId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

            const connectionArgs = {
              last: 500,
            }

            try {
              await connectionLoader({
                domainId: domain._id,
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
            expect(consoleWarnOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 500 for: httpsLoaderConnectionsByDomainId.`,
            ])
          })
        })
      })
      describe('limits are not set to numbers', () => {
        describe('first limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when first set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = httpsLoaderConnectionsByDomainId(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

              const connectionArgs = {
                first: invalidInput,
              }

              try {
                await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error(`todo`))
              }
              expect(consoleWarnOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: httpsLoaderConnectionsByDomainId.`,
              ])
            })
          })
        })
        describe('last limit is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when last set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = httpsLoaderConnectionsByDomainId(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

              const connectionArgs = {
                last: invalidInput,
              }

              try {
                await connectionLoader({
                  domainId: domain._id,
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error(`todo`))
              }
              expect(consoleWarnOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: httpsLoaderConnectionsByDomainId.`,
              ])
            })
          })
        })
      })
    })
    describe('database error occurs', () => {
      it('throws an error', async () => {
        const query = jest
          .fn()
          .mockRejectedValue(new Error('Database Error Occurred.'))

        const connectionLoader = httpsLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const connectionArgs = {
          first: 5,
        }

        try {
          await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to get https information for ${domain._id}, error: Error: Database Error Occurred.`,
        ])
      })
    })
    describe('cursor error occurs', () => {
      it('throws an error', async () => {
        const cursor = {
          next() {
            throw new Error('Cursor Error Occurred.')
          },
        }
        const query = jest.fn().mockReturnValueOnce(cursor)

        const connectionLoader = httpsLoaderConnectionsByDomainId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const connectionArgs = {
          first: 5,
        }

        try {
          await connectionLoader({
            domainId: domain._id,
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleErrorOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to get https information for ${domain._id}, error: Error: Cursor Error Occurred.`,
        ])
      })
    })
  })
})
