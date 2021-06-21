import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import {
  checkDomainPermission,
  userRequired,
  verifiedRequired,
} from '../../../auth'
import { loadDomainByDomain } from '../../loaders'
import { loadUserByKey } from '../../../user/loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findDomainByDomain query', () => {
  let query, drop, truncate, schema, collections, domain, org, i18n, user

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(() => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
  })
  afterEach(() => {
    consoleOutput.length = 0
  })
  describe('given successful domain retrieval', () => {
    beforeAll(async () => {
      // Generate DB Items
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
        emailValidated: true,
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
      domain = await collections.domains.save({
        domain: 'test.gc.ca',
        lastRan: null,
        selectors: ['selector1._domainkey', 'selector2._domainkey'],
        status: {
          dkim: 'pass',
          dmarc: 'pass',
          https: 'info',
          spf: 'fail',
          ssl: 'fail',
        },
      })
      await collections.claims.save({
        _to: domain._id,
        _from: org._id,
      })
      await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'user',
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('authorized user queries domain by domain', () => {
      it('returns domain', async () => {
        const response = await graphql(
          schema,
          `
            query {
              findDomainByDomain(domain: "test.gc.ca") {
                id
                domain
                lastRan
                selectors
                status {
                  dkim
                  dmarc
                  https
                  spf
                  ssl
                }
              }
            }
          `,
          null,
          {
            i18n,
            userKey: user._key,
            query: query,
            auth: {
              checkDomainPermission: checkDomainPermission({
                query,
                userKey: user._key,
              }),
              userRequired: userRequired({
                userKey: user._key,
                loadUserByKey: loadUserByKey({ query }),
              }),
              verifiedRequired: verifiedRequired({}),
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              loadDomainByDomain: loadDomainByDomain({ query }),
              loadUserByKey: loadUserByKey({ query }),
            },
          },
        )

        const expectedResponse = {
          data: {
            findDomainByDomain: {
              id: toGlobalId('domains', domain._key),
              domain: 'test.gc.ca',
              lastRan: null,
              selectors: ['selector1._domainkey', 'selector2._domainkey'],
              status: {
                dkim: 'PASS',
                dmarc: 'PASS',
                https: 'INFO',
                spf: 'FAIL',
                ssl: 'FAIL',
              },
            },
          },
        }
        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([
          `User ${user._key} successfully retrieved domain ${domain._key}.`,
        ])
      })
    })
  })
  describe('given unsuccessful domain retrieval', () => {
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
      describe('given unsuccessful domain retrieval', () => {
        describe('domain cannot be found', () => {
          it('returns an appropriate error message', async () => {
            const response = await graphql(
              schema,
              `
                query {
                  findDomainByDomain(domain: "not-test.gc.ca") {
                    id
                    domain
                    lastRan
                    selectors
                    status {
                      dkim
                      dmarc
                      https
                      spf
                      ssl
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                userKey: 1,
                query: query,
                auth: {
                  checkDomainPermission: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '1',
                  }),
                  verifiedRequired: jest.fn(),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadDomainByDomain: {
                    load: jest.fn().mockReturnValue(undefined),
                  },
                },
              },
            )

            const error = [
              new GraphQLError(`Unable to find the requested domain.`),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([`User 1 could not retrieve domain.`])
          })
        })
        describe('user does not belong to an org which claims domain', () => {
          it('returns an appropriate error message', async () => {
            const response = await graphql(
              schema,
              `
                query {
                  findDomainByDomain(domain: "not-test.gc.ca") {
                    id
                    domain
                    lastRan
                    selectors
                    status {
                      dkim
                      dmarc
                      https
                      spf
                      ssl
                    }
                  }
                }
              `,
              null,
              {
                i18n,
                userKey: '1',
                query: jest.fn(),
                auth: {
                  checkDomainPermission: jest.fn().mockReturnValue(false),
                  userRequired: jest.fn().mockReturnValue({
                    _key: '1',
                  }),
                  verifiedRequired: jest.fn(),
                },
                validators: {
                  cleanseInput,
                },
                loaders: {
                  loadDomainByDomain: {
                    load: jest.fn().mockReturnValue({ _id: '1' }),
                  },
                },
              },
            )

            const error = [
              new GraphQLError(
                `Permission Denied: Please contact organization user for help with retrieving this domain.`,
              ),
            ]

            expect(response.errors).toEqual(error)
            expect(consoleOutput).toEqual([`User 1 could not retrieve domain.`])
          })
        })
      })
    })
    describe('users language is set to french', () => {
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
      describe('domain cannot be found', () => {
        it('returns an appropriate error message', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findDomainByDomain(domain: "not-test.gc.ca") {
                  id
                  domain
                  lastRan
                  selectors
                }
              }
            `,
            null,
            {
              i18n,
              userKey: 1,
              query: query,
              auth: {
                checkDomainPermission: jest.fn().mockReturnValue(true),
                userRequired: jest.fn().mockReturnValue({
                  _key: '1',
                }),
                verifiedRequired: jest.fn(),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadDomainByDomain: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
            },
          )

          const error = [
            new GraphQLError('Impossible de trouver le domaine demandé.'),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([`User 1 could not retrieve domain.`])
        })
      })
      describe('user does not belong to an org which claims domain', () => {
        it('returns an appropriate error message', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findDomainByDomain(domain: "not-test.gc.ca") {
                  id
                  domain
                  lastRan
                  selectors
                  status {
                    dkim
                    dmarc
                    https
                    spf
                    ssl
                  }
                }
              }
            `,
            null,
            {
              i18n,
              userKey: '1',
              query: jest.fn(),
              auth: {
                checkDomainPermission: jest.fn().mockReturnValue(false),
                userRequired: jest.fn().mockReturnValue({
                  _key: '1',
                }),
                verifiedRequired: jest.fn(),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadDomainByDomain: {
                  load: jest.fn().mockReturnValue({ _id: '1' }),
                },
              },
            },
          )

          const error = [
            new GraphQLError(
              "Permission refusée : Veuillez contacter l'utilisateur de l'organisation pour obtenir de l'aide pour récupérer ce domaine.",
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([`User 1 could not retrieve domain.`])
        })
      })
    })
  })
})
