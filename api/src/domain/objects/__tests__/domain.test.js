import { GraphQLNonNull, GraphQLID, GraphQLList, GraphQLString, GraphQLBoolean } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import { tokenize } from '../../../auth'
import { organizationConnection } from '../../../organization'
import { domainStatus } from '../domain-status'
import { dmarcSummaryType } from '../../../dmarc-summaries'
import { webConnection } from '../../../web-scan'
import { domainType } from '../../index'
import { Domain, Selectors } from '../../../scalars'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { dnsScanConnection } from '../../../dns-scan'
import { DmarcPhaseEnum } from '../../../enums'

describe('given the domain object', () => {
  describe('testing its field definitions', () => {
    it('has an id field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(new GraphQLNonNull(GraphQLID))
    })
    it('has a domain field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('domain')
      expect(demoType.domain.type).toMatchObject(Domain)
    })
    it('has a dmarcPhase field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('dmarcPhase')
      expect(demoType.dmarcPhase.type).toMatchObject(DmarcPhaseEnum)
    })
    it('has a hasDMARCReport field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('hasDMARCReport')
      expect(demoType.hasDMARCReport.type).toMatchObject(GraphQLBoolean)
    })
    it('has a lastRan field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('lastRan')
      expect(demoType.lastRan.type).toMatchObject(GraphQLString)
    })
    it('has a selectors field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('selectors')
      expect(demoType.selectors.type).toMatchObject(new GraphQLList(Selectors))
    })
    it('has a status field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('status')
      expect(demoType.status.type).toMatchObject(domainStatus)
    })
    it('has an organizations field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('organizations')
      expect(demoType.organizations.type).toMatchObject(organizationConnection.connectionType)
    })
    it('has an dnsScan field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('dnsScan')
      expect(demoType.dnsScan.type).toMatchObject(dnsScanConnection.connectionType)
    })
    it('has a web field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('web')
      expect(demoType.web.type).toMatchObject(webConnection.connectionType)
    })
    it('has a dmarcSummaryByPeriod field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('dmarcSummaryByPeriod')
      expect(demoType.dmarcSummaryByPeriod.type).toMatchObject(dmarcSummaryType)
    })
    it('has a yearlyDmarcSummaries field', () => {
      const demoType = domainType.getFields()

      expect(demoType).toHaveProperty('yearlyDmarcSummaries')
      expect(demoType.yearlyDmarcSummaries.type).toMatchObject(new GraphQLList(dmarcSummaryType))
    })
    it('has a cvdEnrollment field', () => {
      const demoType = domainType.getFields()
      expect(demoType).toHaveProperty('cvdEnrollment')
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

    describe('testing the cvdEnrollment resolver', () => {
      it('returns the resolved value with correct structure when user is authenticated', async () => {
        const demoType = domainType.getFields()
        const mockUserRequired = jest.fn()
        const cvdEnrollmentValue = {
          status: 'ENROLLED',
          description: 'Test asset',
          maxSeverity: 'HIGH',
          confidentialityRequirement: 'HIGH',
          integrityRequirement: 'LOW',
          availabilityRequirement: 'LOW',
        }

        await expect(
          demoType.cvdEnrollment.resolve(
            { cvdEnrollment: cvdEnrollmentValue },
            {},
            { auth: { userRequired: mockUserRequired } },
          ),
        ).resolves.toEqual(cvdEnrollmentValue)
        expect(mockUserRequired).toHaveBeenCalled()
      })
      it('returns undefined if cvdEnrollment is not present', async () => {
        const demoType = domainType.getFields()
        const mockUserRequired = jest.fn()
        await expect(
          demoType.cvdEnrollment.resolve({}, {}, { auth: { userRequired: mockUserRequired } }),
        ).resolves.toBeUndefined()
      })
    })

    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(toGlobalId('domain', 1))
      })
    })
    describe('testing the domain resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainType.getFields()

        expect(demoType.domain.resolve({ domain: 'test.gc.ca' })).toEqual('test.gc.ca')
      })
    })
    describe('testing the dmarcPhase resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainType.getFields()

        expect(demoType.dmarcPhase.resolve({ phase: 'not implemented' })).toEqual('not implemented')
      })
    })
    describe('testing the hasDMARCReport resolver', () => {
      describe('user has access to dmarc reports', () => {
        it('returns true', async () => {
          const demoType = domainType.getFields()

          const mockedUserRequired = jest.fn().mockReturnValue(true)
          const mockedCheckOwnership = jest.fn().mockReturnValue(true)

          await expect(
            demoType.hasDMARCReport.resolve(
              { _id: 1 },
              {},
              {
                auth: {
                  checkDomainOwnership: mockedCheckOwnership,
                  userRequired: mockedUserRequired,
                },
              },
            ),
          ).resolves.toEqual(true)
        })
      })
      describe('user does not have access to dmarc reports', () => {
        it('returns false', async () => {
          const demoType = domainType.getFields()

          const mockedUserRequired = jest.fn().mockReturnValue(true)
          const mockedCheckOwnership = jest.fn().mockReturnValue(false)

          await expect(
            demoType.hasDMARCReport.resolve(
              { _id: 1 },
              {},
              {
                auth: {
                  checkDomainOwnership: mockedCheckOwnership,
                  userRequired: mockedUserRequired,
                },
              },
            ),
          ).resolves.toEqual(false)
        })
      })
    })
    describe('testing the lastRan resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainType.getFields()

        expect(demoType.lastRan.resolve({ lastRan: '2020-10-02T12:43:39Z' })).toEqual('2020-10-02T12:43:39Z')
      })
    })
    describe('testing the selectors resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainType.getFields()

        const selectors = ['selector1', 'selector2']

        expect(
          demoType.selectors.resolve(
            { selectors },
            {},
            {
              auth: {
                userRequired: jest.fn().mockReturnValue(true),
                checkDomainPermission: jest.fn().mockReturnValue(true),
              },
              loaders: {
                loadDkimSelectorsByDomainId: jest.fn().mockReturnValue(selectors),
              },
            },
          ),
        ).resolves.toEqual(['selector1', 'selector2'])
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

        await expect(
          demoType.organizations.resolve(
            { _id: '1' },
            { first: 1 },
            {
              loaders: {
                loadOrgConnectionsByDomainId: jest.fn().mockReturnValue(expectedResult),
              },
              auth: {
                checkSuperAdmin: jest.fn().mockReturnValue(false),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the web resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = domainType.getFields()

        const response = await demoType.web.resolve(
          { _id: '1' },
          { limit: 1 },
          {
            loaders: {
              loadWebConnectionsByDomainId: jest.fn().mockReturnValue({ _id: '1', _key: '1' }),
            },
            auth: {
              checkDomainPermission: jest.fn().mockReturnValue(true),
              checkSuperAdmin: jest.fn().mockReturnValue(false),
              userRequired: jest.fn().mockReturnValue(true),
            },
          },
        )

        expect(response).toEqual({
          _id: '1',
          _key: '1',
        })
      })
    })
    describe('testing the DNS resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = domainType.getFields()

        const response = await demoType.dnsScan.resolve(
          { _id: '1' },
          { limit: 1 },
          {
            loaders: {
              loadDnsConnectionsByDomainId: jest.fn().mockReturnValue({ _id: '1', _key: '1' }),
            },
            auth: {
              checkDomainPermission: jest.fn().mockReturnValue(true),
              checkSuperAdmin: jest.fn().mockReturnValue(false),
              userRequired: jest.fn().mockReturnValue(true),
            },
          },
        )

        expect(response).toEqual({
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
                  loadDmarcSummaryEdgeByDomainIdAndPeriod: jest.fn().mockReturnValue({
                    _to: 'dmarcSummaries/1',
                  }),
                  loadStartDateFromPeriod: jest.fn().mockReturnValue('2021-01-01'),
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
                    loadStartDateFromPeriod: jest.fn().mockReturnValue('2021-01-01'),
                  },
                  auth: {
                    checkDomainOwnership: jest.fn().mockReturnValue(false),
                    userRequired: jest.fn(),
                    loginRequiredBool: true,
                  },
                },
              ),
            ).rejects.toEqual(new Error('Unable to retrieve DMARC report information for: test1.gc.ca'))

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
                    loadStartDateFromPeriod: jest.fn().mockReturnValue('2021-01-01'),
                  },
                  auth: {
                    checkDomainOwnership: jest.fn().mockReturnValue(false),
                    userRequired: jest.fn(),
                    loginRequiredBool: true,
                  },
                },
              ),
            ).rejects.toEqual(new Error('Impossible de récupérer les informations du rapport DMARC pour : test1.gc.ca'))

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
                    loginRequiredBool: true,
                  },
                },
              ),
            ).rejects.toEqual(new Error('Unable to retrieve DMARC report information for: test1.gc.ca'))
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
                    loginRequiredBool: true,
                  },
                },
              ),
            ).rejects.toEqual(new Error('Impossible de récupérer les informations du rapport DMARC pour : test1.gc.ca'))
            expect(consoleOutput).toEqual([
              `User: 1 attempted to access dmarc report period data for 1, but does not belong to an org with ownership.`,
            ])
          })
        })
      })
    })
  })
})
