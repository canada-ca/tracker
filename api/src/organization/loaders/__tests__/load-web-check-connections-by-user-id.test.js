import { stringify } from 'jest-matcher-utils'
import { ensure, dbNameFromFile } from 'arango-tools'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput } from '../../../validators'
import { loadWebCheckConnectionsByUserId, loadOrgByKey } from '../index'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the load organization connections by user id function', () => {
  let query,
    drop,
    truncate,
    collections,
    user,
    orgOne,
    orgTwo,
    i18n,
    domain,
    domainTwo,
    domainThree

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
    })
    beforeEach(async () => {
      user = await collections.users.save({
        userName: 'test.account@istio.actually.exists',
        displayName: 'Test Account',
        preferredLang: 'french',
        tfaValidated: false,
        emailValidated: false,
      })
      orgOne = await collections.organizations.save({
        verified: false,
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
            slug: 'slug-org-one',
            acronym: 'ONE',
            name: 'org One',
            zone: 'zone one',
            sector: 'sector one',
            country: 'country one',
            province: 'province one',
            city: 'city one',
          },
          fr: {
            slug: 'slug-org-one',
            acronym: 'ONE',
            name: 'org One',
            zone: 'zone one',
            sector: 'sector one',
            country: 'country one',
            province: 'province one',
            city: 'city one',
          },
        },
      })
      orgTwo = await collections.organizations.save({
        verified: false,
        summaries: {
          web: {
            pass: 52,
            fail: 1002,
            total: 1054,
          },
          mail: {
            pass: 52,
            fail: 1002,
            total: 1054,
          },
        },
        orgDetails: {
          en: {
            slug: 'slug-org-two',
            acronym: 'TWO',
            name: 'org two',
            zone: 'zone two',
            sector: 'sector two',
            country: 'country two',
            province: 'province two',
            city: 'city two',
          },
          fr: {
            slug: 'slug-org-two',
            acronym: 'TWO',
            name: 'org two',
            zone: 'zone two',
            sector: 'sector two',
            country: 'country two',
            province: 'province two',
            city: 'city two',
          },
        },
      })
      await collections.affiliations.save({
        _from: orgOne._id,
        _to: user._id,
        permission: 'user',
      })
      await collections.affiliations.save({
        _from: orgTwo._id,
        _to: user._id,
        permission: 'admin',
      })
      domain = await collections.domains.save({
        domain: 'test.domain.gc.ca',
        tags: [
          { id: 'CVE-2022-12345', firstDetected: 'datetime', severity: 'high' },
        ],
      })
      domainThree = await collections.domains.save({
        domain: 'test.domain.canada.gc.ca',
        tags: [
          { id: 'CVE-2022-54321', firstDetected: 'datetime', severity: 'low' },
        ],
      })
      domainTwo = await collections.domains.save({
        domain: 'test.domain.canada.ca',
        tags: [],
      })
      await collections.claims.save({
        _from: orgOne._id,
        _to: domain._id,
      })
      await collections.claims.save({
        _from: orgTwo._id,
        _to: domain._id,
      })
      await collections.claims.save({
        _from: orgTwo._id,
        _to: domainTwo._id,
      })
      await collections.claims.save({
        _from: orgTwo._id,
        _to: domainThree._id,
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
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
      describe('given a successful load', () => {
        describe('given there are organization connections to be returned', () => {
          describe('using after cursor and first limit', () => {
            it('returns an organization', async () => {
              const connectionLoader = loadWebCheckConnectionsByUserId({
                query,
                userKey: user._key,
                cleanseInput,
                language: 'en',
                i18n,
              })

              const orgLoader = loadOrgByKey({ query, language: 'en' })
              const expectedOrgs = await orgLoader.loadMany([
                orgOne._key,
                orgTwo._key,
              ])

              expectedOrgs[0].id = expectedOrgs[0]._key
              expectedOrgs[1].id = expectedOrgs[1]._key

              const connectionArgs = {
                first: 5,
                after: toGlobalId('organization', expectedOrgs[0].id),
              }
              const orgs = await connectionLoader({ ...connectionArgs })

              expect(orgs)
            })
          })
          describe('using the search argument', () => {
            beforeEach(async () => {
              // This is used to sync the view before running the test below
              await query`
                FOR org IN organizationSearch
                  SEARCH ANALYZER(
                    org.orgDetails.en.acronym == ""
                    OR org.orgDetails.fr.acronym == ""
                    OR org.orgDetails.en.name == ""
                    OR org.orgDetails.fr.name == ""
                  , "text_en")
                  OPTIONS { waitForSync: true }
                  RETURN org._key
              `
            })
            describe('search based on orgs name', () => {
              it('returns the filtered organizations', async () => {
                const connectionLoader = loadWebCheckConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  language: 'en',
                  i18n,
                })

                const connectionArgs = {
                  first: 5,
                  search: 'one',
                }
                const orgs = await connectionLoader({
                  ...connectionArgs,
                })

                expect(orgs)
              })
            })
            describe('search based on orgs acronym', () => {
              it('returns the filtered organizations', async () => {
                const connectionLoader = loadWebCheckConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  language: 'en',
                  i18n,
                })

                const connectionArgs = {
                  first: 5,
                  search: 'ONE',
                }
                const orgs = await connectionLoader({
                  ...connectionArgs,
                })

                expect(orgs)
              })
            })
            describe('search field is left empty', () => {
              it('returns unfiltered organizations', async () => {
                const connectionLoader = loadWebCheckConnectionsByUserId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  language: 'en',
                  i18n,
                })

                const connectionArgs = {
                  first: 5,
                  search: '',
                }
                const orgs = await connectionLoader({
                  ...connectionArgs,
                })

                expect(orgs)
              })
            })
          })
          describe('using the orderBy field', () => {
            let orgThree
            beforeEach(async () => {
              orgThree = await collections.organizations.save({
                verified: false,
                summaries: {
                  web: {
                    pass: 51,
                    fail: 1001,
                    total: 1052,
                  },
                  mail: {
                    pass: 51,
                    fail: 1001,
                    total: 1052,
                  },
                },
                orgDetails: {
                  en: {
                    slug: 'slug-org-three',
                    acronym: 'THREE',
                    name: 'org three',
                    zone: 'zone three',
                    sector: 'sector three',
                    country: 'country three',
                    province: 'province three',
                    city: 'city three',
                  },
                  fr: {
                    slug: 'slug-org-three',
                    acronym: 'THREE',
                    name: 'org three',
                    zone: 'zone three',
                    sector: 'sector three',
                    country: 'country three',
                    province: 'province three',
                    city: 'city three',
                  },
                },
              })
              await collections.affiliations.save({
                _from: orgThree._id,
                _to: user._id,
                permission: 'user',
              })
              await collections.claims.save({
                _from: orgThree._id,
                _to: domain._id,
              })
              await collections.claims.save({
                _from: orgThree._id,
                _to: domainTwo._id,
              })
            })
            describe('ordering on ACRONYM', () => {
              describe('direction is set to ASC', () => {
                it('returns organization', async () => {
                  const connectionLoader = loadWebCheckConnectionsByUserId({
                    query,
                    userKey: user._key,
                    cleanseInput,
                    language: 'en',
                    i18n,
                  })
                  const connectionArgs = {
                    first: 5,
                    after: toGlobalId('organization', orgOne._key),
                    before: toGlobalId('organization', orgTwo._key),
                    orderBy: {
                      field: 'acronym',
                      direction: 'ASC',
                    },
                  }
                  const orgs = await connectionLoader({
                    ...connectionArgs,
                  })

                  expect(orgs)
                })
              })
            })
            describe('ordering on NAME', () => {
              describe('direction is set to DESC', () => {
                it('returns organization', async () => {
                  const connectionLoader = loadWebCheckConnectionsByUserId({
                    query,
                    userKey: user._key,
                    cleanseInput,
                    language: 'en',
                    i18n,
                  })
                  const connectionArgs = {
                    first: 5,
                    before: toGlobalId('organization', orgOne._key),
                    after: toGlobalId('organization', orgTwo._key),
                    orderBy: {
                      field: 'name',
                      direction: 'DESC',
                    },
                  }
                  const orgs = await connectionLoader({
                    ...connectionArgs,
                  })

                  expect(orgs)
                })
              })
            })
          })
          describe('isSuperAdmin is set to true', () => {
            it('returns organizations', async () => {
              const connectionLoader = loadWebCheckConnectionsByUserId({
                query,
                userKey: user._key,
                cleanseInput,
                language: 'en',
                i18n,
              })

              const connectionArgs = {
                first: 5,
                isSuperAdmin: true,
              }
              const orgs = await connectionLoader({ ...connectionArgs })

              const orgLoader = loadOrgByKey({ query, language: 'en' })
              const expectedOrgs = await orgLoader.loadMany([
                orgOne._key,
                orgTwo._key,
              ])

              expectedOrgs[0].id = expectedOrgs[0]._key
              expectedOrgs[1].id = expectedOrgs[1]._key

              expect(orgs)
            })
          })
        })
        describe('given there are no domain connections to be returned', () => {
          it('returns no organization connections', async () => {
            await truncate()

            const connectionLoader = loadWebCheckConnectionsByUserId({
              query,
              userKey: user._key,
              cleanseInput,
              language: 'en',
              i18n,
            })

            const connectionArgs = {
              first: 5,
            }
            const orgs = await connectionLoader({ ...connectionArgs })

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

            expect(orgs).toEqual(expectedStructure)
          })
        })
      })
    })
  })
  describe('given an unsuccessful load', () => {
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
            const connectionLoader = loadWebCheckConnectionsByUserId({
              query,
              userKey: 123,
              cleanseInput,
              language: 'en',
              i18n,
            })

            const connectionArgs = {}
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'You must provide a `first` or `last` value to properly paginate the `Organization` connection.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: 123 did not have either \`first\` or \`last\` arguments set for: loadWebCheckConnectionsByUserId.`,
            ])
          })
        })
        describe('first and last arguments are set', () => {
          it('returns an error message', async () => {
            const connectionLoader = loadWebCheckConnectionsByUserId({
              query,
              userKey: 123,
              cleanseInput,
              language: 'en',
              i18n,
            })

            const connectionArgs = {
              first: 1,
              last: 1,
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Passing both `first` and `last` to paginate the `Organization` connection is not supported.',
                ),
              )
            }

            expect(consoleOutput).toEqual([
              `User: 123 attempted to have \`first\` and \`last\` arguments set for: loadWebCheckConnectionsByUserId.`,
            ])
          })
        })
        describe('limits are below minimum', () => {
          describe('first limit is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadWebCheckConnectionsByUserId({
                query,
                userKey: 123,
                cleanseInput,
                language: 'en',
                i18n,
              })

              const connectionArgs = {
                first: -1,
              }
              try {
                await connectionLoader({
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(
                  new Error(
                    '`first` on the `Organization` connection cannot be less than zero.',
                  ),
                )
              }

              expect(consoleOutput).toEqual([
                `User: 123 attempted to have \`first\` set below zero for: loadWebCheckConnectionsByUserId.`,
              ])
            })
          })
          describe('last limit is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadWebCheckConnectionsByUserId({
                query,
                userKey: 123,
                cleanseInput,
                language: 'en',
                i18n,
              })

              const connectionArgs = {
                last: -1,
              }
              try {
                await connectionLoader({
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(
                  new Error(
                    '`last` on the `Organization` connection cannot be less than zero.',
                  ),
                )
              }

              expect(consoleOutput).toEqual([
                `User: 123 attempted to have \`last\` set below zero for: loadWebCheckConnectionsByUserId.`,
              ])
            })
          })
        })
        describe('limits are above maximum', () => {
          describe('first limit is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadWebCheckConnectionsByUserId({
                query,
                userKey: 123,
                cleanseInput,
                language: 'en',
                i18n,
              })

              const connectionArgs = {
                first: 101,
              }
              try {
                await connectionLoader({
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(
                  new Error(
                    'Requesting `101` records on the `Organization` connection exceeds the `first` limit of 100 records.',
                  ),
                )
              }

              expect(consoleOutput).toEqual([
                `User: 123 attempted to have \`first\` to 101 for: loadWebCheckConnectionsByUserId.`,
              ])
            })
          })
          describe('last limit is set', () => {
            it('returns an error message', async () => {
              const connectionLoader = loadWebCheckConnectionsByUserId({
                query,
                userKey: 123,
                cleanseInput,
                language: 'en',
                i18n,
              })

              const connectionArgs = {
                last: 101,
              }
              try {
                await connectionLoader({
                  ...connectionArgs,
                })
              } catch (err) {
                expect(err).toEqual(
                  new Error(
                    'Requesting `101` records on the `Organization` connection exceeds the `last` limit of 100 records.',
                  ),
                )
              }

              expect(consoleOutput).toEqual([
                `User: 123 attempted to have \`last\` to 101 for: loadWebCheckConnectionsByUserId.`,
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
                const connectionLoader = loadWebCheckConnectionsByUserId({
                  query,
                  userKey: 123,
                  cleanseInput,
                  language: 'en',
                  i18n,
                })

                const connectionArgs = {
                  first: invalidInput,
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
                  `User: 123 attempted to have \`first\` set as a ${typeof invalidInput} for: loadWebCheckConnectionsByUserId.`,
                ])
              })
            })
          })
          describe('last limit is set', () => {
            ;['123', {}, [], null, true].forEach((invalidInput) => {
              it(`returns an error when last set to ${stringify(
                invalidInput,
              )}`, async () => {
                const connectionLoader = loadWebCheckConnectionsByUserId({
                  query,
                  userKey: 123,
                  cleanseInput,
                  language: 'en',
                  i18n,
                })

                const connectionArgs = {
                  last: invalidInput,
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
                  `User: 123 attempted to have \`last\` set as a ${typeof invalidInput} for: loadWebCheckConnectionsByUserId.`,
                ])
              })
            })
          })
        })
      })
      describe('given a database error', () => {
        describe('while querying domains', () => {
          it('returns an error message', async () => {
            const query = jest
              .fn()
              .mockRejectedValue(
                new Error('Unable to gather organizations. Please try again.'),
              )

            const connectionLoader = loadWebCheckConnectionsByUserId({
              query,
              userKey: 123,
              cleanseInput,
              language: 'en',
              i18n,
            })

            const connectionArgs = {
              first: 5,
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error('Unable to load organization(s). Please try again.'),
              )
            }

            expect(consoleOutput).toEqual([
              `Database error occurred while user: 123 was trying to gather organizations in loadWebCheckConnectionsByUserId, error: Error: Unable to gather organizations. Please try again.`,
            ])
          })
        })
      })
      describe('given a cursor error', () => {
        describe('while gathering domains', () => {
          it('returns an error message', async () => {
            const cursor = {
              next() {
                throw new Error(
                  'Unable to load organizations. Please try again.',
                )
              },
            }
            const query = jest.fn().mockReturnValueOnce(cursor)

            const connectionLoader = loadWebCheckConnectionsByUserId({
              query,
              userKey: 123,
              cleanseInput,
              language: 'en',
              i18n,
            })

            const connectionArgs = {
              first: 5,
            }
            try {
              await connectionLoader({
                ...connectionArgs,
              })
            } catch (err) {
              expect(err).toEqual(
                new Error('Unable to load organization(s). Please try again.'),
              )
            }

            expect(consoleOutput).toEqual([
              `Cursor error occurred while user: 123 was trying to gather organizations in loadWebCheckConnectionsByUserId, error: Error: Unable to load organizations. Please try again.`,
            ])
          })
        })
      })
    })
  })
})
