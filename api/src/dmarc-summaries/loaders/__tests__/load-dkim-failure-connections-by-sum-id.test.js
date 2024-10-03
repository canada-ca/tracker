import { stringify } from 'jest-matcher-utils'
import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput } from '../../../validators'
import { loadDkimFailConnectionsBySumId } from '../index'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadDkimFailConnectionsBySumId loader', () => {
  let query, drop, truncate, collections, i18n, user, dmarcSummary, dkimFailure1, dkimFailure2

  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)

  beforeAll(() => {
    console.error = mockedError
    console.warn = mockedWarn
  })
  afterEach(() => {
    consoleOutput.length = 0
  })
  describe('given a successful load', () => {
    beforeEach(async () => {
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
      user = await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
        tfaValidated: false,
        emailValidated: false,
      })

      dkimFailure1 = {
        sourceIpAddress: '123.456.78.91',
        envelopeFrom: 'envelope.from',
        headerFrom: 'header.from',
        dkimDomains: 'dkim.domains',
        dkimSelectors: 'key',
        dkimResults: 'pass',
        dkimAligned: false,
        totalMessages: 1,
        dnsHost: 'dns.host.ca',
        id: 1,
        guidance: '',
      }

      dkimFailure2 = {
        sourceIpAddress: '123.456.78.91',
        envelopeFrom: 'envelope.from',
        headerFrom: 'header.from',
        dkimDomains: 'dkim.domains',
        dkimSelectors: 'key',
        dkimResults: 'pass',
        dkimAligned: false,
        totalMessages: 2,
        dnsHost: 'dns.host.ca',
        id: 2,
        guidance: '',
      }

      dmarcSummary = await collections.dmarcSummaries.save({
        detailTables: {
          dkimFailure: [dkimFailure1, dkimFailure2],
          dmarcFailure: [],
          fullPass: [],
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
      await drop()
    })
    describe('given there are dkim failures to load', () => {
      describe('using after cursor', () => {
        it('returns dkim failure', async () => {
          const connectionLoader = loadDkimFailConnectionsBySumId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 100,
            after: toGlobalId('dkimFail', 1),
            summaryId: dmarcSummary._id,
          }

          const summaries = await connectionLoader({ ...connectionArgs })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('dkimFail', 2),
                node: {
                  ...dkimFailure2,
                  type: 'dkimFail',
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId('dkimFail', 2),
              endCursor: toGlobalId('dkimFail', 2),
            },
          }

          expect(summaries).toEqual(expectedStructure)
        })
      })
      describe('using before cursor', () => {
        it('returns dkim failure', async () => {
          const connectionLoader = loadDkimFailConnectionsBySumId({
            query,
            userKey: user._key,
            cleanseInput,
            i18n,
          })

          const connectionArgs = {
            first: 100,
            before: toGlobalId('dkimFail', 2),
            summaryId: dmarcSummary._id,
          }

          const summaries = await connectionLoader({ ...connectionArgs })

          const expectedStructure = {
            edges: [
              {
                cursor: toGlobalId('dkimFail', 1),
                node: {
                  ...dkimFailure1,
                  type: 'dkimFail',
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: toGlobalId('dkimFail', 1),
              endCursor: toGlobalId('dkimFail', 1),
            },
          }

          expect(summaries).toEqual(expectedStructure)
        })
      })
      describe('using first limit', () => {
        it('returns dkim failure', async () => {
          const connectionLoader = loadDkimFailConnectionsBySumId({
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
                cursor: toGlobalId('dkimFail', 1),
                node: {
                  ...dkimFailure1,
                  type: 'dkimFail',
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: toGlobalId('dkimFail', 1),
              endCursor: toGlobalId('dkimFail', 1),
            },
          }

          expect(summaries).toEqual(expectedStructure)
        })
      })
      describe('using last limit', () => {
        it('returns dkim failure', async () => {
          const connectionLoader = loadDkimFailConnectionsBySumId({
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
                cursor: toGlobalId('dkimFail', 2),
                node: {
                  ...dkimFailure2,
                  type: 'dkimFail',
                },
              },
            ],
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: toGlobalId('dkimFail', 2),
              endCursor: toGlobalId('dkimFail', 2),
            },
          }

          expect(summaries).toEqual(expectedStructure)
        })
      })
    })
    describe('given there are no dkim failures to load', () => {
      it('returns no dkim failure connections', async () => {
        await truncate()

        const connectionLoader = loadDkimFailConnectionsBySumId({
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
  })
  describe('given an unsuccessful load', () => {
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
            const connectionLoader = loadDkimFailConnectionsBySumId({
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
                  'You must provide a `first` or `last` value to properly paginate the `DkimFailureTable` connection.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadDkimFailConnectionsBySumId.`,
            ])
          })
        })
        describe('given first and last arguments are set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimFailConnectionsBySumId({
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
                  'Passing both `first` and `last` to paginate the `DkimFailureTable` connection is not supported.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadDkimFailConnectionsBySumId.`,
            ])
          })
        })
        describe('first or last argument exceeds maximum', () => {
          describe('first argument is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadDkimFailConnectionsBySumId({
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
                    'Requesting `101` records on the `DkimFailureTable` connection exceeds the `first` limit of 100 records.',
                  ),
                )
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to have \`first\` set to 101 for: loadDkimFailConnectionsBySumId.`,
              ])
            })
          })
          describe('last argument is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadDkimFailConnectionsBySumId({
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
                    'Requesting `101` records on the `DkimFailureTable` connection exceeds the `last` limit of 100 records.',
                  ),
                )
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to have \`last\` set to 101 for: loadDkimFailConnectionsBySumId.`,
              ])
            })
          })
        })
        describe('first or last argument exceeds minimum', () => {
          describe('first argument is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadDkimFailConnectionsBySumId({
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
                expect(err).toEqual(new Error('`first` on the `DkimFailureTable` connection cannot be less than zero.'))
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to have \`first\` set below zero for: loadDkimFailConnectionsBySumId.`,
              ])
            })
          })
          describe('last argument is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadDkimFailConnectionsBySumId({
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
                expect(err).toEqual(new Error('`last` on the `DkimFailureTable` connection cannot be less than zero.'))
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to have \`last\` set below zero for: loadDkimFailConnectionsBySumId.`,
              ])
            })
          })
        })
        describe('first or last argument is not set to a number', () => {
          describe('first argument is set', () => {
            ;['123', {}, [], null, true].forEach((invalidInput) => {
              it(`returns an error when first set to ${stringify(invalidInput)}`, async () => {
                const connectionLoader = loadDkimFailConnectionsBySumId({
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
                  expect(err).toEqual(new Error(`\`first\` must be of type \`number\` not \`${typeof invalidInput}\`.`))
                }
                expect(consoleOutput).toEqual([
                  `User: ${
                    user._key
                  } attempted to have \`first\` set as a ${typeof invalidInput} for: loadDkimFailConnectionsBySumId.`,
                ])
              })
            })
          })
          describe('last argument is set', () => {
            ;['123', {}, [], null, true].forEach((invalidInput) => {
              it(`returns an error when first set to ${stringify(invalidInput)}`, async () => {
                const connectionLoader = loadDkimFailConnectionsBySumId({
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
                  expect(err).toEqual(new Error(`\`last\` must be of type \`number\` not \`${typeof invalidInput}\`.`))
                }
                expect(consoleOutput).toEqual([
                  `User: ${
                    user._key
                  } attempted to have \`last\` set as a ${typeof invalidInput} for: loadDkimFailConnectionsBySumId.`,
                ])
              })
            })
          })
        })
        describe('summaryId is not set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimFailConnectionsBySumId({
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
              expect(err).toEqual(new Error('Unable to load DKIM failure data. Please try again.'))
            }

            expect(consoleOutput).toEqual([
              `SummaryId was undefined when user: ${user._key} attempted to load dkim failures in loadDkimFailConnectionsBySumId.`,
            ])
          })
        })
      })
      describe('given a database error occurs', () => {
        it('returns an error message', async () => {
          const mockedQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))

          const connectionLoader = loadDkimFailConnectionsBySumId({
            query: mockedQuery,
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
            expect(err).toEqual(new Error('Unable to load DKIM failure data. Please try again.'))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to gather dkim failures in loadDkimFailConnectionsBySumId, error: Error: Database error occurred.`,
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
          const mockedQuery = jest.fn().mockReturnValueOnce(cursor)

          const connectionLoader = loadDkimFailConnectionsBySumId({
            query: mockedQuery,
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
            expect(err).toEqual(new Error('Unable to load DKIM failure data. Please try again.'))
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user: ${user._key} was trying to gather dkim failures in loadDkimFailConnectionsBySumId, error: Error: Cursor error occurred.`,
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
            const connectionLoader = loadDkimFailConnectionsBySumId({
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
                  'Vous devez fournir une valeur `first` ou `last` pour paginer correctement la connexion `DkimFailureTable`.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} did not have either \`first\` or \`last\` arguments set for: loadDkimFailConnectionsBySumId.`,
            ])
          })
        })
        describe('given first and last arguments are set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimFailConnectionsBySumId({
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
                  "Passer à la fois `first` et `last` pour paginer la connexion `DkimFailureTable` n'est pas supporté.",
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: ${user._key} attempted to have \`first\` and \`last\` arguments set for: loadDkimFailConnectionsBySumId.`,
            ])
          })
        })
        describe('first or last argument exceeds maximum', () => {
          describe('first argument is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadDkimFailConnectionsBySumId({
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
                    "La demande d'enregistrements `101` sur la connexion `DkimFailureTable` dépasse la limite `first` de 100 enregistrements.",
                  ),
                )
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to have \`first\` set to 101 for: loadDkimFailConnectionsBySumId.`,
              ])
            })
          })
          describe('last argument is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadDkimFailConnectionsBySumId({
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
                    "La demande d'enregistrements `101` sur la connexion `DkimFailureTable` dépasse la limite `last` de 100 enregistrements.",
                  ),
                )
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to have \`last\` set to 101 for: loadDkimFailConnectionsBySumId.`,
              ])
            })
          })
        })
        describe('first or last argument exceeds minimum', () => {
          describe('first argument is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadDkimFailConnectionsBySumId({
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
                  new Error('`first` sur la connexion `DkimFailureTable` ne peut être inférieur à zéro.'),
                )
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to have \`first\` set below zero for: loadDkimFailConnectionsBySumId.`,
              ])
            })
          })
          describe('last argument is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadDkimFailConnectionsBySumId({
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
                  new Error('`last` sur la connexion `DkimFailureTable` ne peut être inférieur à zéro.'),
                )
              }

              expect(consoleOutput).toEqual([
                `User: ${user._key} attempted to have \`last\` set below zero for: loadDkimFailConnectionsBySumId.`,
              ])
            })
          })
        })
        describe('first or last argument is not set to a number', () => {
          describe('first argument is set', () => {
            ;['123', {}, [], null, true].forEach((invalidInput) => {
              it(`returns an error when first set to ${stringify(invalidInput)}`, async () => {
                const connectionLoader = loadDkimFailConnectionsBySumId({
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
                    new Error(`\`first\` doit être de type \`number\` et non \`${typeof invalidInput}\`.`),
                  )
                }
                expect(consoleOutput).toEqual([
                  `User: ${
                    user._key
                  } attempted to have \`first\` set as a ${typeof invalidInput} for: loadDkimFailConnectionsBySumId.`,
                ])
              })
            })
          })
          describe('last argument is set', () => {
            ;['123', {}, [], null, true].forEach((invalidInput) => {
              it(`returns an error when first set to ${stringify(invalidInput)}`, async () => {
                const connectionLoader = loadDkimFailConnectionsBySumId({
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
                    new Error(`\`last\` doit être de type \`number\` et non \`${typeof invalidInput}\`.`),
                  )
                }
                expect(consoleOutput).toEqual([
                  `User: ${
                    user._key
                  } attempted to have \`last\` set as a ${typeof invalidInput} for: loadDkimFailConnectionsBySumId.`,
                ])
              })
            })
          })
        })
        describe('summaryId is not set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadDkimFailConnectionsBySumId({
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
              expect(err).toEqual(new Error("Impossible de charger les données d'échec DKIM. Veuillez réessayer."))
            }

            expect(consoleOutput).toEqual([
              `SummaryId was undefined when user: ${user._key} attempted to load dkim failures in loadDkimFailConnectionsBySumId.`,
            ])
          })
        })
      })
      describe('given a database error occurs', () => {
        it('returns an error message', async () => {
          const mockedQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))

          const connectionLoader = loadDkimFailConnectionsBySumId({
            query: mockedQuery,
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
            expect(err).toEqual(new Error("Impossible de charger les données d'échec DKIM. Veuillez réessayer."))
          }

          expect(consoleOutput).toEqual([
            `Database error occurred while user: ${user._key} was trying to gather dkim failures in loadDkimFailConnectionsBySumId, error: Error: Database error occurred.`,
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
          const mockedQuery = jest.fn().mockReturnValueOnce(cursor)

          const connectionLoader = loadDkimFailConnectionsBySumId({
            query: mockedQuery,
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
            expect(err).toEqual(new Error("Impossible de charger les données d'échec DKIM. Veuillez réessayer."))
          }

          expect(consoleOutput).toEqual([
            `Cursor error occurred while user: ${user._key} was trying to gather dkim failures in loadDkimFailConnectionsBySumId, error: Error: Cursor error occurred.`,
          ])
        })
      })
    })
  })
})
