import { GraphQLNonNull, GraphQLID, GraphQLList, GraphQLString } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import { tokenize } from '../../../auth'
import { organizationConnection } from '../../../organization/objects'
import { domainStatus } from '../domain-status'
import { dmarcSummaryType } from '../../../dmarc-summaries/objects'
import { emailScanType } from '../../../email-scan/objects'
import { webScanType } from '../../../web-scan/objects'
import { domainType } from '../../index'
import { Domain, Selectors } from '../../../scalars'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'

describe('given the domain object', () => {
  describe('testing its field definitions', () => {
    it('has an id field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has a domain field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(Domain)
    })
    it('has a dmarcPhase field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('dmarcPhase')
      expect(demoType.dmarcPhase.type).toMatchObject(GraphQLString)
    })
    it('has a lastRan field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('lastRan')
      expect(demoType.lastRan.type).toMatchObject(GraphQLString)
    })
    it('has a selectors field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('selectors')
      expect(demoType.selectors.type).toMatchObject(GraphQLList(Selectors))
    })
    it('has a status field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(domainStatus)
    })
    it('has an organizations field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('organizations')
      expect(demoType.organizations.type).toMatchObject(
        organizationConnection.connectionType,
      )
    })
    it('has an email field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('email')
      expect(demoType.email.type).toMatchObject(emailScanType)
    })
    it('has a web field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('web')
      expect(demoType.web.type).toMatchObject(webScanType)
    })
    it('has a dmarcSummaryByPeriod field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('dmarcSummaryByPeriod')
      expect(demoType.dmarcSummaryByPeriod.type).toMatchObject(dmarcSummaryType)
    })
    it('has a yearlyDmarcSummaries field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('yearlyDmarcSummaries')
      expect(demoType.yearlyDmarcSummaries.type).toMatchObject(
        GraphQLList(dmarcSummaryType),
      )
    })
  })
  describe('testing the field resolvers', () => {
    const consoleOutput = []
    const mockedWarn = (output) => consoleOutput.push(output)

    beforeAll(() => {
      console.warn = mockedWarn
    })
    afterEach(() => {
      consoleOutput.length = 0
    })

    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(
          toGlobalId('domains', 1),
        )
      })
    })
    describe('testing the domain resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainType.getFields()

        expect(demoType.domain.resolve({ domain: 'test.gc.ca' })).toEqual(
          'test.gc.ca',
        )
      })
    })
    describe('testing the dmarcPhase resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainType.getFields()

        expect(
          demoType.dmarcPhase.resolve({ phase: 'not implemented' }),
        ).toEqual('not implemented')
      })
    })
    describe('testing the lastRan resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainType.getFields()

        expect(
          demoType.lastRan.resolve({ lastRan: '2020-10-02T12:43:39Z' }),
        ).toEqual('2020-10-02T12:43:39Z')
      })
    })
    describe('testing the selectors resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainType.getFields()

        const selectors = ['selector1._domainkey', 'selector2._domainkey']

        expect(demoType.selectors.resolve({ selectors })).toEqual([
          'selector1._domainkey',
          'selector2._domainkey',
        ])
      })
    })
    describe('testing the status resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainType.getFields()

        const status = {
          dkim: 'pass',
          dmarc: 'pass',
          https: 'info',
          spf: 'fail',
          ssl: 'fail',
        }

        expect(demoType.status.resolve({ status })).toEqual({
          dkim: 'pass',
          dmarc: 'pass',
          https: 'info',
          spf: 'fail',
          ssl: 'fail',
        })
      })
    })
    describe('testing the organizations resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = domainType.getFields()

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('organizations', '1'),
              node: {
                _id: 'organizations/`',
                _key: '1',
                _rev: 'rev',
                _type: 'organization',
                id: '1',
                verified: true,
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
                domainCount: 2,
                slug: 'treasury-board-secretariat',
                acronym: 'TBS',
                name: 'Treasury Board of Canada Secretariat',
                zone: 'FED',
                sector: 'TBS',
                country: 'Canada',
                province: 'Ontario',
                city: 'Ottawa',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('organizations', '1'),
            endCursor: toGlobalId('organizations', '1'),
          },
        }

        expect(
          demoType.organizations.resolve(
            { _id: '1' },
            { first: 1 },
            {
              loaders: {
                loadOrgConnectionsByDomainId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the email resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainType.getFields()

        expect(demoType.email.resolve({ _id: '1', _key: '1' })).toEqual({
          _id: '1',
          _key: '1',
        })
      })
    })
    describe('testing the web resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainType.getFields()

        expect(demoType.web.resolve({ _id: '1', _key: '1' })).toEqual({
          _id: '1',
          _key: '1',
        })
      })
    })
    describe('testing the dmarcSummaryByPeriod resolver', () => {
      let i18n
      describe('user has domain ownership permission', () => {
        it('returns the resolved value', async () => {
          const demoType = domainType.getFields()

          const data = {
            _id: 'domains/1',
            _key: '1',
            domain: 'test1.gc.ca',
          }

          await expect(
            demoType.dmarcSummaryByPeriod.resolve(
              data,
              {
                month: 'january',
                year: '2021',
              },
              {
                userKey: '1',
                loaders: {
                  loadDmarcSummaryEdgeByDomainIdAndPeriod: jest
                    .fn()
                    .mockReturnValue({
                      _to: 'dmarcSummaries/1',
                    }),
                  loadStartDateFromPeriod: jest
                    .fn()
                    .mockReturnValue('2021-01-01'),
                },
                auth: {
                  checkDomainOwnership: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn(),
                  tokenize,
                },
              },
            ),
          ).resolves.toEqual({
            _id: 'dmarcSummaries/1',
            domainKey: '1',
            startDate: '2021-01-01',
          })
        })
      })
      describe('users language is english', () => {
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
        describe('user does not have domain ownership permission', () => {
          it('returns the resolved value', async () => {
            const demoType = domainType.getFields()

            const data = {
              _id: 'domains/1',
              _key: '1',
              domain: 'test1.gc.ca',
            }

            await expect(
              demoType.dmarcSummaryByPeriod.resolve(
                data,
                {},
                {
                  i18n,
                  userKey: '1',
                  loaders: {
                    loadDmarcSummaryEdgeByDomainIdAndPeriod: jest.fn(),
                    loadStartDateFromPeriod: jest
                      .fn()
                      .mockReturnValue('2021-01-01'),
                  },
                  auth: {
                    checkDomainOwnership: jest.fn().mockReturnValue(false),
                    userRequired: jest.fn(),
                  },
                },
              ),
            ).rejects.toEqual(
              new Error(
                'Unable to retrieve DMARC report information for: test1.gc.ca',
              ),
            )

            expect(consoleOutput).toEqual([
              `User: 1 attempted to access dmarc report period data for 1, but does not belong to an org with ownership.`,
            ])
          })
        })
      })
      describe('users language is french', () => {
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
        describe('user does not have domain ownership permission', () => {
          it('returns the resolved value', async () => {
            const demoType = domainType.getFields()
  
            const data = {
              _id: 'domains/1',
              _key: '1',
              domain: 'test1.gc.ca',
            }
  
            await expect(
              demoType.dmarcSummaryByPeriod.resolve(
                data,
                {},
                {
                  i18n,
                  userKey: '1',
                  loaders: {
                    loadDmarcSummaryEdgeByDomainIdAndPeriod: jest.fn(),
                    loadStartDateFromPeriod: jest
                      .fn()
                      .mockReturnValue('2021-01-01'),
                  },
                  auth: {
                    checkDomainOwnership: jest.fn().mockReturnValue(false),
                    userRequired: jest.fn(),
                  },
                },
              ),
            ).rejects.toEqual(
              new Error(
                'todo',
              ),
            )
  
            expect(consoleOutput).toEqual([
              `User: 1 attempted to access dmarc report period data for 1, but does not belong to an org with ownership.`,
            ])
          })
        })
      })
    })
    describe('testing the yearlyDmarcSummaries resolver', () => {
      let i18n
      describe('user has domain ownership permission', () => {
        it('returns the resolved value', async () => {
          const demoType = domainType.getFields()
          const data = {
            _id: 'domains/1',
            _key: '1',
            domain: 'test1.gc.ca',
          }

          await expect(
            demoType.yearlyDmarcSummaries.resolve(
              data,
              {},
              {
                userKey: '1',
                loaders: {
                  loadDmarcYearlySumEdge: jest.fn().mockReturnValue([
                    {
                      domainKey: '1',
                      _to: 'dmarcSummaries/1',
                      startDate: '2021-01-01',
                    },
                  ]),
                },
                auth: {
                  checkDomainOwnership: jest.fn().mockReturnValue(true),
                  userRequired: jest.fn(),
                },
              },
            ),
          ).resolves.toEqual([
            {
              _id: 'dmarcSummaries/1',
              domainKey: '1',
              startDate: '2021-01-01',
            },
          ])
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
        describe('user does not have domain ownership permission', () => {
          it('returns the resolved value', async () => {
            const demoType = domainType.getFields()
  
            const data = {
              _id: 'domains/1',
              _key: '1',
              domain: 'test1.gc.ca',
            }
  
            await expect(
              demoType.yearlyDmarcSummaries.resolve(
                data,
                {},
                {
                  i18n,
                  request: {
                    language: 'fr',
                  },
                  userKey: '1',
                  loaders: {
                    loadDmarcYearlySumEdge: jest.fn(),
                  },
                  auth: {
                    checkDomainOwnership: jest.fn().mockReturnValue(false),
                    userRequired: jest.fn(),
                  },
                },
              ),
            ).rejects.toEqual(
              new Error(
                'Unable to retrieve DMARC report information for: test1.gc.ca',
              ),
            )
            expect(consoleOutput).toEqual([
              `User: 1 attempted to access dmarc report period data for 1, but does not belong to an org with ownership.`,
            ])
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
        describe('user does not have domain ownership permission', () => {
          it('returns the resolved value', async () => {
            const demoType = domainType.getFields()
  
            const data = {
              _id: 'domains/1',
              _key: '1',
              domain: 'test1.gc.ca',
            }
  
            await expect(
              demoType.yearlyDmarcSummaries.resolve(
                data,
                {},
                {
                  i18n,
                  userKey: '1',
                  loaders: {
                    loadDmarcYearlySumEdge: jest.fn(),
                  },
                  auth: {
                    checkDomainOwnership: jest.fn().mockReturnValue(false),
                    userRequired: jest.fn(),
                  },
                },
              ),
            ).rejects.toEqual(
              new Error(
                'todo',
              ),
            )
            expect(consoleOutput).toEqual([
              `User: 1 attempted to access dmarc report period data for 1, but does not belong to an org with ownership.`,
            ])
          })
        })
      })
    })
  })
})
