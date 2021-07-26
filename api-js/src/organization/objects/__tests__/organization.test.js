import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
} from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { Acronym, Slug } from '../../../scalars'
import { domainConnection } from '../../../domain/objects'
import { affiliationConnection } from '../../../affiliation/objects'
import { organizationType, organizationSummaryType } from '../../objects'

describe('given the organization object', () => {
  let i18n
  describe('testing the field definitions', () => {
    it('has an id field', () => {
      const demoType = organizationType.getFields()

      expect(demoType).toHaveProperty('id')
      expect(demoType.id.type).toMatchObject(GraphQLNonNull(GraphQLID))
    })
    it('has an acronym field', () => {
      const demoType = organizationType.getFields()

      expect(demoType).toHaveProperty('acronym')
      expect(demoType.acronym.type).toMatchObject(Acronym)
    })
    it('has a name field', () => {
      const demoType = organizationType.getFields()

      expect(demoType).toHaveProperty('name')
      expect(demoType.name.type).toMatchObject(GraphQLString)
    })
    it('has a slug field', () => {
      const demoType = organizationType.getFields()

      expect(demoType).toHaveProperty('slug')
      expect(demoType.slug.type).toMatchObject(Slug)
    })
    it('has a zone field', () => {
      const demoType = organizationType.getFields()

      expect(demoType).toHaveProperty('zone')
      expect(demoType.zone.type).toMatchObject(GraphQLString)
    })
    it('has a sector field', () => {
      const demoType = organizationType.getFields()

      expect(demoType).toHaveProperty('sector')
      expect(demoType.sector.type).toMatchObject(GraphQLString)
    })
    it('has a country field', () => {
      const demoType = organizationType.getFields()

      expect(demoType).toHaveProperty('country')
      expect(demoType.country.type).toMatchObject(GraphQLString)
    })
    it('has a province field', () => {
      const demoType = organizationType.getFields()

      expect(demoType).toHaveProperty('province')
      expect(demoType.province.type).toMatchObject(GraphQLString)
    })
    it('has a city field', () => {
      const demoType = organizationType.getFields()

      expect(demoType).toHaveProperty('city')
      expect(demoType.city.type).toEqual(GraphQLString)
    })
    it('has a verified field', () => {
      const demoType = organizationType.getFields()

      expect(demoType).toHaveProperty('verified')
      expect(demoType.verified.type).toMatchObject(GraphQLBoolean)
    })
    it('has a summaries field', () => {
      const demoType = organizationType.getFields()

      expect(demoType).toHaveProperty('summaries')
      expect(demoType.summaries.type).toMatchObject(organizationSummaryType)
    })
    it('has a domainCount field', () => {
      const demoType = organizationType.getFields()

      expect(demoType).toHaveProperty('domainCount')
      expect(demoType.domainCount.type).toMatchObject(GraphQLInt)
    })
    it('has a domains field', () => {
      const demoType = organizationType.getFields()

      expect(demoType).toHaveProperty('domains')
      expect(demoType.domains.type).toMatchObject(
        domainConnection.connectionType,
      )
    })
    it('has an affiliations field', () => {
      const demoType = organizationType.getFields()

      expect(demoType).toHaveProperty('affiliations')
      expect(demoType.affiliations.type).toMatchObject(
        affiliationConnection.connectionType,
      )
    })
  })
  describe('testing the field resolvers', () => {
    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = organizationType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(
          toGlobalId('organization', 1),
        )
      })
    })
    describe('testing the acronym resolver', () => {
      it('returns the resolved value', () => {
        const demoType = organizationType.getFields()

        expect(demoType.acronym.resolve({ acronym: 'GOC' })).toEqual('GOC')
      })
    })
    describe('testing the name resolver', () => {
      it('returns the resolved value', () => {
        const demoType = organizationType.getFields()

        expect(demoType.name.resolve({ name: 'Name' })).toEqual('Name')
      })
    })
    describe('testing the slug resolver', () => {
      it('returns the resolved value', () => {
        const demoType = organizationType.getFields()

        expect(demoType.slug.resolve({ slug: 'organization-name' })).toEqual(
          'organization-name',
        )
      })
    })
    describe('testing the zone resolver', () => {
      it('returns the resolved value', () => {
        const demoType = organizationType.getFields()

        expect(demoType.zone.resolve({ zone: 'zone' })).toEqual('zone')
      })
    })
    describe('testing the sector resolver', () => {
      it('returns the resolved value', () => {
        const demoType = organizationType.getFields()

        expect(demoType.sector.resolve({ sector: 'sector' })).toEqual('sector')
      })
    })
    describe('testing the country resolver', () => {
      it('returns the resolved value', () => {
        const demoType = organizationType.getFields()

        expect(demoType.country.resolve({ country: 'Canada' })).toEqual(
          'Canada',
        )
      })
    })
    describe('testing the province resolver', () => {
      it('returns the resolved value', () => {
        const demoType = organizationType.getFields()

        expect(demoType.province.resolve({ province: 'province' })).toEqual(
          'province',
        )
      })
    })
    describe('testing the city resolver', () => {
      it('returns the resolved value', () => {
        const demoType = organizationType.getFields()

        expect(demoType.city.resolve({ city: 'city' })).toEqual('city')
      })
    })
    describe('testing the verified resolver', () => {
      it('returns the resolved value', () => {
        const demoType = organizationType.getFields()

        expect(demoType.verified.resolve({ verified: true })).toEqual(true)
      })
    })
    describe('testing the summaries resolver', () => {
      it('returns the resolved value', () => {
        const demoType = organizationType.getFields()

        const org = {
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
        }

        const expectedResult = {
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
        }

        expect(demoType.summaries.resolve(org)).toEqual(expectedResult)
      })
    })
    describe('testing the domainCount resolver', () => {
      it('returns the resolved value', () => {
        const demoType = organizationType.getFields()

        expect(demoType.domainCount.resolve({ domainCount: 5 })).toEqual(5)
      })
    })
    describe('testing the domains resolver', () => {
      it('returns the resolved value', async () => {
        const demoType = organizationType.getFields()

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('domains', '1'),
              node: {
                _id: 'domains/1',
                _key: '1',
                _rev: 'rev',
                _type: 'domain',
                id: '1',
                domain: 'test.gc.ca',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('domains', '1'),
            endCursor: toGlobalId('domains', '1'),
          },
        }

        await expect(
          demoType.domains.resolve(
            { _id: 'organizations/1' },
            { first: 1 },
            {
              loaders: {
                loadDomainConnectionsByOrgId: jest
                  .fn()
                  .mockReturnValue(expectedResult),
              },
            },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the affiliations resolver', () => {
      describe('user has correct permission to the resolver', () => {
        it('returns the resolved value', async () => {
          const demoType = organizationType.getFields()

          const checkPermission = jest.fn().mockReturnValue('admin')

          const expectedResults = {
            edges: [
              {
                cursor: toGlobalId('affiliation', '1'),
                node: {
                  _from: 'organizations/1',
                  _to: 'users/1',
                  _id: 'affiliations/1',
                  _rev: 'rev',
                  _key: '1',
                  _type: 'affiliation',
                  id: '1',
                  orgKey: '1',
                  userKey: '1',
                  permission: 'admin',
                },
              },
            ],
            totalCount: 1,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('affiliation', '1'),
              endCursor: toGlobalId('affiliation', '1'),
            },
          }

          await expect(
            demoType.affiliations.resolve(
              { _id: 'organizations/1' },
              { first: 5 },
              {
                auth: { checkPermission },
                loaders: {
                  loadAffiliationConnectionsByOrgId: jest
                    .fn()
                    .mockReturnValue(expectedResults),
                },
              },
            ),
          ).resolves.toEqual(expectedResults)
        })
      })
      describe('user does not have correct permission to the resolver', () => {
        describe('users language is set to english', () => {
          beforeEach(() => {
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
          it('returns the resolved value', async () => {
            const demoType = organizationType.getFields()

            const checkPermission = jest.fn().mockReturnValue('user')

            try {
              await demoType.affiliations.resolve(
                { _id: '1' },
                { first: 5 },
                {
                  i18n,
                  auth: { checkPermission },
                  loaders: { loadAffiliationConnectionsByOrgId: jest.fn() },
                },
              )
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  'Cannot query affiliations on organization without admin permission or higher.',
                ),
              )
            }
          })
        })
        describe('users language is set to french', () => {
          beforeEach(() => {
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
          it('returns the resolved value', async () => {
            const demoType = organizationType.getFields()

            const checkPermission = jest.fn().mockReturnValue('user')

            try {
              await demoType.affiliations.resolve(
                { _id: '1' },
                { first: 5 },
                {
                  i18n,
                  auth: { checkPermission },
                  loaders: { loadAffiliationConnectionsByOrgId: jest.fn() },
                },
              )
            } catch (err) {
              expect(err).toEqual(
                new Error(
                  "Impossible d'interroger les affiliations sur l'organisation sans l'autorisation de l'administrateur ou plus.",
                ),
              )
            }
          })
        })
      })
    })
  })
})
