import { stringify } from 'jest-matcher-utils'
import { ArangoTools, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { makeMigrations } from '../../../../migrations'
import { cleanseInput } from '../../../validators'
import { fullPassLoaderConnectionsBySumId } from '../index'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the fullPassLoaderConnectionsBySumId loader', () => {
  let query,
    drop,
    truncate,
    migrate,
    collections,
    i18n,
    user,
    dmarcSummary,
    fullPass1,
    fullPass2

  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.error = mockedError
    console.warn = mockedWarn
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
  })

  beforeEach(async () => {
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      displayName: 'Test Account',
      preferredLang: 'french',
      tfaValidated: false,
      emailValidated: false,
    })

    fullPass1 = {
      sourceIpAddress: '123.456.78.91',
      envelopeFrom: 'envelope.from',
      headerFrom: 'header.from',
      spfDomains: 'spf.domains.ca',
      dkimDomains: 'dkim.domains.ca',
      dkimSelectors: 'none',
      totalMessages: 1,
      dnsHost: 'dns.host.ca',
      id: 1,
    }

    fullPass2 = {
      sourceIpAddress: '123.456.78.91',
      envelopeFrom: 'envelope.from',
      headerFrom: 'header.from',
      spfDomains: 'spf.domains.ca',
      dkimDomains: 'dkim.domains.ca',
      dkimSelectors: 'none',
      totalMessages: 2,
      dnsHost: 'dns.host.ca',
      id: 2,
    }

    dmarcSummary = await collections.dmarcSummaries.save({
      detailTables: {
        dkimFailure: [],
        dmarcFailure: [],
        fullPass: [fullPass1, fullPass2],
        spfFailure: [],
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

  describe('given there are full passes to load', () => {
    describe('using after cursor', () => {
      it('returns full pass', async () => {
        const connectionLoader = fullPassLoaderConnectionsBySumId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const connectionArgs = {
          first: 100,
          after: toGlobalId('fullPass', 1),
          summaryId: dmarcSummary._id,
        }

        const summaries = await connectionLoader({ ...connectionArgs })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('fullPass', 2),
              node: {
                ...fullPass2,
                type: 'fullPass',
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('fullPass', 2),
            endCursor: toGlobalId('fullPass', 2),
          },
        }

        expect(summaries).toEqual(expectedStructure)
      })
    })
    describe('using before cursor', () => {
      it('returns full pass', async () => {
        const connectionLoader = fullPassLoaderConnectionsBySumId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const connectionArgs = {
          first: 100,
          before: toGlobalId('fullPass', 2),
          summaryId: dmarcSummary._id,
        }

        const summaries = await connectionLoader({ ...connectionArgs })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('fullPass', 1),
              node: {
                ...fullPass1,
                type: 'fullPass',
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('fullPass', 1),
            endCursor: toGlobalId('fullPass', 1),
          },
        }

        expect(summaries).toEqual(expectedStructure)
      })
    })
    describe('using first limit', () => {
      it('returns full pass', async () => {
        const connectionLoader = fullPassLoaderConnectionsBySumId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const connectionArgs = {
          first: 1,
          summaryId: dmarcSummary._id,
        }

        const summaries = await connectionLoader({ ...connectionArgs })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('fullPass', 1),
              node: {
                ...fullPass1,
                type: 'fullPass',
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: toGlobalId('fullPass', 1),
            endCursor: toGlobalId('fullPass', 1),
          },
        }

        expect(summaries).toEqual(expectedStructure)
      })
    })
    describe('using last limit', () => {
      it('returns full pass', async () => {
        const connectionLoader = fullPassLoaderConnectionsBySumId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

        const connectionArgs = {
          last: 1,
          summaryId: dmarcSummary._id,
        }

        const summaries = await connectionLoader({ ...connectionArgs })

        const expectedStructure = {
          edges: [
            {
              cursor: toGlobalId('fullPass', 2),
              node: {
                ...fullPass2,
                type: 'fullPass',
              },
            },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: toGlobalId('fullPass', 2),
            endCursor: toGlobalId('fullPass', 2),
          },
        }

        expect(summaries).toEqual(expectedStructure)
      })
    })
  })
  describe('given there are no full passes to load', () => {
    it('returns no full pass connections', async () => {
      await truncate()

      const connectionLoader = fullPassLoaderConnectionsBySumId(
        query,
        user._key,
        cleanseInput,
        i18n,
      )

      const connectionArgs = {
        last: 1,
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
          const connectionLoader = fullPassLoaderConnectionsBySumId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

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
                'You must provide a `first` or `last` value to properly paginate the `FullPassTable` connection.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: fullPassLoaderConnectionsBySumId.`,
          ])
        })
      })
      describe('first and last arguments are both set', () => {
        it('returns an error message', async () => {
          const connectionLoader = fullPassLoaderConnectionsBySumId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

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
                'Passing both `first` and `last` to paginate the `FullPassTable` connection is not supported.',
              ),
            )
          }

          expect(consoleOutput).toEqual([
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: fullPassLoaderConnectionsBySumId.`,
          ])
        })
      })
      describe('first or last argument exceeds maximum', () => {
        describe('first argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = fullPassLoaderConnectionsBySumId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

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
                  'Requesting `101` records on the `FullPassTable` connection exceeds the `first` limit of 100 records.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set to 101 for: fullPassLoaderConnectionsBySumId.`,
            ])
          })
        })
        describe('last argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = fullPassLoaderConnectionsBySumId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

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
                  'Requesting `101` records on the `FullPassTable` connection exceeds the `last` limit of 100 records.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set to 101 for: fullPassLoaderConnectionsBySumId.`,
            ])
          })
        })
      })
      describe('first or last argument exceeds minimum', () => {
        describe('first argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = fullPassLoaderConnectionsBySumId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

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
                  '`first` on the `FullPassTable` connection cannot be less than zero.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` set below zero for: fullPassLoaderConnectionsBySumId.`,
            ])
          })
        })
        describe('last argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = fullPassLoaderConnectionsBySumId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

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
                  '`last` on the `FullPassTable` connection cannot be less than zero.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`last\` set below zero for: fullPassLoaderConnectionsBySumId.`,
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
              const connectionLoader = fullPassLoaderConnectionsBySumId(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

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
                } attempted to have \`first\` set as a ${typeof invalidInput} for: fullPassLoaderConnectionsBySumId.`,
              ])
            })
          })
        })
        describe('last argument is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when first set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = fullPassLoaderConnectionsBySumId(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

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
                } attempted to have \`last\` set as a ${typeof invalidInput} for: fullPassLoaderConnectionsBySumId.`,
              ])
            })
          })
        })
      })
      describe('summaryId is not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = fullPassLoaderConnectionsBySumId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {
            last: 1,
          }
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(
              new Error('Unable to load full passes. Please try again.'),
            )
          }

          expect(consoleOutput).toEqual([
            `SummaryId was undefined when user: ${user._key} attempted to load full passes in fullPassLoaderConnectionsBySumId.`,
          ])
        })
      })
    })
    describe('given a database error occurs', () => {
      it('returns an error message', async () => {
        const query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))

        const connectionLoader = fullPassLoaderConnectionsBySumId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

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
            new Error('Unable to load full passes. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to gather full passes in fullPassLoaderConnectionsBySumId, error: Error: Database error occurred.`,
        ])
      })
    })
    describe('given a cursor error occurs', () => {
      it('returns an error message', async () => {
        const cursor = {
          next() {
            throw new Error('Cursor error occurred.')
          },
        }
        const query = jest.fn().mockReturnValueOnce(cursor)

        const connectionLoader = fullPassLoaderConnectionsBySumId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

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
            new Error('Unable to load full passes. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Cursor error occurred while user: ${user._key} was trying to gather full passes in fullPassLoaderConnectionsBySumId, error: Error: Cursor error occurred.`,
        ])
      })
    })
  })
  describe('given the users language is set to english', () => {
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
          const connectionLoader = fullPassLoaderConnectionsBySumId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

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
            `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: fullPassLoaderConnectionsBySumId.`,
          ])
        })
      })
      describe('first and last arguments are both set', () => {
        it('returns an error message', async () => {
          const connectionLoader = fullPassLoaderConnectionsBySumId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

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
            `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: fullPassLoaderConnectionsBySumId.`,
          ])
        })
      })
      describe('first or last argument exceeds maximum', () => {
        describe('first argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = fullPassLoaderConnectionsBySumId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

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
              `User: ${user._key} attempted to have \`first\` set to 101 for: fullPassLoaderConnectionsBySumId.`,
            ])
          })
        })
        describe('last argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = fullPassLoaderConnectionsBySumId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

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
              `User: ${user._key} attempted to have \`last\` set to 101 for: fullPassLoaderConnectionsBySumId.`,
            ])
          })
        })
      })
      describe('first or last argument exceeds minimum', () => {
        describe('first argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = fullPassLoaderConnectionsBySumId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

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
              `User: ${user._key} attempted to have \`first\` set below zero for: fullPassLoaderConnectionsBySumId.`,
            ])
          })
        })
        describe('last argument is set', () => {
          it('returns an error message', async () => {
            const connectionLoader = fullPassLoaderConnectionsBySumId(
              query,
              user._key,
              cleanseInput,
              i18n,
            )

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
              `User: ${user._key} attempted to have \`last\` set below zero for: fullPassLoaderConnectionsBySumId.`,
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
              const connectionLoader = fullPassLoaderConnectionsBySumId(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

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
                } attempted to have \`first\` set as a ${typeof invalidInput} for: fullPassLoaderConnectionsBySumId.`,
              ])
            })
          })
        })
        describe('last argument is set', () => {
          ;['123', {}, [], null, true].forEach((invalidInput) => {
            it(`returns an error when first set to ${stringify(
              invalidInput,
            )}`, async () => {
              const connectionLoader = fullPassLoaderConnectionsBySumId(
                query,
                user._key,
                cleanseInput,
                i18n,
              )

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
                } attempted to have \`last\` set as a ${typeof invalidInput} for: fullPassLoaderConnectionsBySumId.`,
              ])
            })
          })
        })
      })
      describe('summaryId is not set', () => {
        it('returns an error message', async () => {
          const connectionLoader = fullPassLoaderConnectionsBySumId(
            query,
            user._key,
            cleanseInput,
            i18n,
          )

          const connectionArgs = {
            last: 1,
          }
          try {
            await connectionLoader({
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('todo'))
          }

          expect(consoleOutput).toEqual([
            `SummaryId was undefined when user: ${user._key} attempted to load full passes in fullPassLoaderConnectionsBySumId.`,
          ])
        })
      })
    })
    describe('given a database error occurs', () => {
      it('returns an error message', async () => {
        const query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))

        const connectionLoader = fullPassLoaderConnectionsBySumId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

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
          `Database error occurred while user: ${user._key} was trying to gather full passes in fullPassLoaderConnectionsBySumId, error: Error: Database error occurred.`,
        ])
      })
    })
    describe('given a cursor error occurs', () => {
      it('returns an error message', async () => {
        const cursor = {
          next() {
            throw new Error('Cursor error occurred.')
          },
        }
        const query = jest.fn().mockReturnValueOnce(cursor)

        const connectionLoader = fullPassLoaderConnectionsBySumId(
          query,
          user._key,
          cleanseInput,
          i18n,
        )

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
          `Cursor error occurred while user: ${user._key} was trying to gather full passes in fullPassLoaderConnectionsBySumId, error: Error: Cursor error occurred.`,
        ])
      })
    })
  })
})
