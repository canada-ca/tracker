import { stringify } from 'jest-matcher-utils'
import { ensure, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { cleanseInput } from '../../../validators'
import { loadSpfFailureConnectionsBySumId } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadSpfFailureConnectionsBySumId loader', () => {
  let query,
    drop,
    truncate,
    collections,
    i18n,
    user,
    dmarcSummary,
    spfFailure1,
    spfFailure2

  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.error = mockedError
    console.warn = mockedWarn
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeEach(async () => {
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
    })

    spfFailure1 = {
      sourceIpAddress: '123.456.78.91',
      envelopeFrom: 'envelope.from',
      headerFrom: 'header.from',
      spfDomains: 'spf.domains.ca',
      spfResults: 'fail',
      spfAligned: false,
      totalMessages: 1,
      id: 1,
      dnsHost: 'dns.host.ca',
      guidance: '',
    }

    spfFailure2 = {
      sourceIpAddress: '123.456.78.91',
      envelopeFrom: 'envelope.from',
      headerFrom: 'header.from',
      spfDomains: 'spf.domains.ca',
      spfResults: 'fail',
      spfAligned: false,
      totalMessages: 2,
      id: 2,
      dnsHost: 'dns.host.ca',
      guidance: '',
    }

    dmarcSummary = await collections.dmarcSummaries.save({
      detailTables: {
        dkimFailure: [],
        dmarcFailure: [],
        fullPass: [],
        spfFailure: [spfFailure1, spfFailure2],
      },
      categoryTotals: {
        pass: 0,
        fail: 0,
        passDkimOnly: 0,
        passSpfOnly: 0,
      },
    })
    await collections.domainsToDmarcSummaries.save({
      _from: 'domains/1',
      _to: dmarcSummary._id,
      startDate: 'thirtyDays',
    })
  })

  afterEach(async () => {
    await truncate()
    consoleOutput.length = 0
  })

  afterAll(async () => {
    await drop()
  })

  describe('given there are spf failures to load', () => {
    describe('using after cursor', () => {
      it('returns spf failure', async () => {
        const connectionLoader = loadSpfFailureConnectionsBySumId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const connectionArgs = {
          first: 100,
          after: toGlobalId('spfFail', 1),
          summaryId: dmarcSummary._id,
        }

        const summaries = await connectionLoader({ ...connectionArgs })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('spfFail', 2),
              node: {
                ...spfFailure2,
                type: 'spfFail',
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('spfFail', 2),
            endCursor: toGlobalId('spfFail', 2),
          },
        }

        expect(summaries).toEqual(expectedStructure)
      })
    })
    describe('using the before cursor', () => {
      it('returns spf failure', async () => {
        const connectionLoader = loadSpfFailureConnectionsBySumId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const connectionArgs = {
          first: 100,
          before: toGlobalId('spfFail', 2),
          summaryId: dmarcSummary._id,
        }

        const summaries = await connectionLoader({ ...connectionArgs })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('spfFail', 1),
              node: {
                ...spfFailure1,
                type: 'spfFail',
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('spfFail', 1),
            endCursor: toGlobalId('spfFail', 1),
          },
        }

        expect(summaries).toEqual(expectedStructure)
      })
    })
    describe('using the first limit', () => {
      it('returns spf failure', async () => {
        const connectionLoader = loadSpfFailureConnectionsBySumId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const connectionArgs = {
          first: 1,
          summaryId: dmarcSummary._id,
        }

        const summaries = await connectionLoader({ ...connectionArgs })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('spfFail', 1),
              node: {
                ...spfFailure1,
                type: 'spfFail',
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('spfFail', 1),
            endCursor: toGlobalId('spfFail', 1),
          },
        }

        expect(summaries).toEqual(expectedStructure)
      })
    })
    describe('using the last limit', () => {
      it('returns spf failure', async () => {
        const connectionLoader = loadSpfFailureConnectionsBySumId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const connectionArgs = {
          last: 1,
          summaryId: dmarcSummary._id,
        }

        const summaries = await connectionLoader({ ...connectionArgs })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('spfFail', 2),
              node: {
                ...spfFailure2,
                type: 'spfFail',
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('spfFail', 2),
            endCursor: toGlobalId('spfFail', 2),
          },
        }

        expect(summaries).toEqual(expectedStructure)
      })
    })
  })
  describe('given there are no spf failures to load', () => {
    it('returns no spf failure connections', async () => {
      await truncate()

      const connectionLoader = loadSpfFailureConnectionsBySumId({
        query,
        userKey: user._key,
        cleanseInput,
        i18n,
      })

      const connectionArgs = {
        first: 1,
        summaryId: dmarcSummary._id,
      }

      const summaries = await connectionLoader({ ...connectionArgs })

      const expectedStructure = {
        edges: [],
        totalCount: 0,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '',
          endCursor: '',
        },
      }

      expect(summaries).toEqual(expectedStructure)
    })
  })
  describe('given the users language is set to english', () => {
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
      describe('first and last arguments are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadSpfFailureConnectionsBySumId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            summaryId: '',
          }
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'You must provide a `first` or `last` value to properly paginate the `SpfFailureTable` connection.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadSpfFailureConnectionsBySumId.`,
          ])
        })
      })
      describe('first and last arguments are both set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadSpfFailureConnectionsBySumId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 1,
            last: 1,
            summaryId: '',
          }
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error(
                'Passing both `first` and `last` to paginate the `SpfFailureTable` connection is not supported.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadSpfFailureConnectionsBySumId.`,
          ])
        })
      })
      describe('first or last argument exceeds maximum', () => {
        describe('first argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadSpfFailureConnectionsBySumId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              first: 101,
              summaryId: '',
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting `101` records on the `SpfFailureTable` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 101 for: loadSpfFailureConnectionsBySumId.`,
            ])
          })
        })
        describe('last argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadSpfFailureConnectionsBySumId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              last: 101,
              summaryId: '',
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Requesting `101` records on the `SpfFailureTable` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 101 for: loadSpfFailureConnectionsBySumId.`,
            ])
          })
        })
      })
      describe('first or last argument exceeds minimum', () => {
        describe('first argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadSpfFailureConnectionsBySumId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              first: -1,
              summaryId: '',
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`first` on the `SpfFailureTable` connection cannot be less than zero.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadSpfFailureConnectionsBySumId.`,
            ])
          })
        })
        describe('last argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadSpfFailureConnectionsBySumId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              last: -1,
              summaryId: '',
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  '`last` on the `SpfFailureTable` connection cannot be less than zero.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadSpfFailureConnectionsBySumId.`,
            ])
          })
        })
      })
      describe('first or last argument is not set to a number', () => {
        describe('first argument is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when first set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = loadSpfFailureConnectionsBySumId({
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                first: invalidInput,
                summaryId: '',
              }

              try {
                await connectionLoader({
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(
                  new Error(
                    `\`first\` must be of type \`number\` not \`${typeof invalidInput}\`.`,
                  ),
                )
              }
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadSpfFailureConnectionsBySumId.`,
              ])
            })
          })
        })
        describe('last argument is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when first set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = loadSpfFailureConnectionsBySumId({
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                last: invalidInput,
                summaryId: '',
              }

              try {
                await connectionLoader({
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(
                  new Error(
                    `\`last\` must be of type \`number\` not \`${typeof invalidInput}\`.`,
                  ),
                )
              }
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadSpfFailureConnectionsBySumId.`,
              ])
            })
          })
        })
      })
      describe('summaryId is not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadSpfFailureConnectionsBySumId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 10,
          }
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to load SPF failure data. Please try again.'),
            )
          }

          expect(consoleOutput).toEqual([
            `SummaryId was undefined when user: ${user._key} attempted to load spf failures in loadSpfFailureConnectionsBySumId.`,
          ])
        })
      })
    })
    describe('given a database error', () => {
      it('returns an error message', async () => {
        const query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))

        const connectionLoader = loadSpfFailureConnectionsBySumId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const connectionArgs = {
          first: 50,
          summaryId: '',
        }
        try {
          await connectionLoader({
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to load SPF failure data. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to gather spf failures in loadSpfFailureConnectionsBySumId, error: Error: Database error occurred.`,
        ])
      })
    })
    describe('given a cursor error', () => {
      it('returns an error message', async () => {
        const cursor = {
          next() {
            throw new Error('Cursor error occurred.')
          },
        }
        const query = jest.fn().mockReturnValueOnce(cursor)

        const connectionLoader = loadSpfFailureConnectionsBySumId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const connectionArgs = {
          first: 50,
          summaryId: '',
        }
        try {
          await connectionLoader({
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to load SPF failure data. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to gather spf failures in loadSpfFailureConnectionsBySumId, error: Error: Cursor error occurred.`,
        ])
      })
    })
  })
  describe('given the users language is set to french', () => {
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
    describe('given an unsuccessful load', () => {
      describe('first and last arguments are not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadSpfFailureConnectionsBySumId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            summaryId: '',
          }
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadSpfFailureConnectionsBySumId.`,
          ])
        })
      })
      describe('first and last arguments are both set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadSpfFailureConnectionsBySumId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 1,
            last: 1,
            summaryId: '',
          }
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadSpfFailureConnectionsBySumId.`,
          ])
        })
      })
      describe('first or last argument exceeds maximum', () => {
        describe('first argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadSpfFailureConnectionsBySumId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              first: 101,
              summaryId: '',
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 101 for: loadSpfFailureConnectionsBySumId.`,
            ])
          })
        })
        describe('last argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadSpfFailureConnectionsBySumId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              last: 101,
              summaryId: '',
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 101 for: loadSpfFailureConnectionsBySumId.`,
            ])
          })
        })
      })
      describe('first or last argument exceeds minimum', () => {
        describe('first argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadSpfFailureConnectionsBySumId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              first: -1,
              summaryId: '',
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: loadSpfFailureConnectionsBySumId.`,
            ])
          })
        })
        describe('last argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadSpfFailureConnectionsBySumId({
              query,
              userKey: user._key,
              cleanseInput,
              i18n,
            })

            const connectionArgs = {
              last: -1,
              summaryId: '',
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: loadSpfFailureConnectionsBySumId.`,
            ])
          })
        })
      })
      describe('first or last argument is not set to a number', () => {
        describe('first argument is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when first set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = loadSpfFailureConnectionsBySumId({
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                first: invalidInput,
                summaryId: '',
              }

              try {
                await connectionLoader({
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error(`todo`))
              }
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`first\` set as a ${typeof invalidInput} for: loadSpfFailureConnectionsBySumId.`,
              ])
            })
          })
        })
        describe('last argument is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when first set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = loadSpfFailureConnectionsBySumId({
                query,
                userKey: user._key,
                cleanseInput,
                i18n,
              })

              const connectionArgs = {
                last: invalidInput,
                summaryId: '',
              }

              try {
                await connectionLoader({
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(new Error(`todo`))
              }
              expect(consoleOutput).toEqual([
                `User: ${
                  user._key
                } attempted to have \`last\` set as a ${typeof invalidInput} for: loadSpfFailureConnectionsBySumId.`,
              ])
            })
          })
        })
      })
      describe('summaryId is not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = loadSpfFailureConnectionsBySumId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 10,
          }
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleOutput).toEqual([
            `SummaryId was undefined when user: ${user._key} attempted to load spf failures in loadSpfFailureConnectionsBySumId.`,
          ])
        })
      })
    })
    describe('given a database error', () => {
      it('returns an error message', async () => {
        const query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))

        const connectionLoader = loadSpfFailureConnectionsBySumId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const connectionArgs = {
          first: 50,
          summaryId: '',
        }
        try {
          await connectionLoader({
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to gather spf failures in loadSpfFailureConnectionsBySumId, error: Error: Database error occurred.`,
        ])
      })
    })
    describe('given a cursor error', () => {
      it('returns an error message', async () => {
        const cursor = {
          next() {
            throw new Error('Cursor error occurred.')
          },
        }
        const query = jest.fn().mockReturnValueOnce(cursor)

        const connectionLoader = loadSpfFailureConnectionsBySumId({
          query,
          userKey: user._key,
          cleanseInput,
          i18n,
        })

        const connectionArgs = {
          first: 50,
          summaryId: '',
        }
        try {
          await connectionLoader({
            ...connectionArgs,
          })
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to gather spf failures in loadSpfFailureConnectionsBySumId, error: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
