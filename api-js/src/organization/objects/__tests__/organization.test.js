import { ArangoTools, dbNameFromFile } from 'arango-tools'
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
import { makeMigrations } from '../../../../migrations'
import { cleanseInput } from '../../../validators'
import { Acronym, Slug } from '../../../scalars'
import { domainLoaderConnectionsByOrgId } from '../../../domain/loaders'
import { domainConnection } from '../../../domain/objects/domain'
import { affiliationLoaderByOrgId } from '../../../affiliation/loaders'
import { affiliationConnection } from '../../../affiliation/objects'
import { organizationType, organizationSummaryType } from '../../objects'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the organization object', () => {
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
    let query,
      drop,
      truncate,
      migrate,
      collections,
      org,
      user,
      domain,
      affiliation,
      i18n

    beforeAll(async () => {
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
      org = await collections.organizations.save({
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
      affiliation = await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'admin',
      })
      domain = await collections.domains.save({
        domain: 'test.gc.ca',
      })
      await collections.claims.save({
        _from: org._id,
        _to: domain._id,
      })
    })

    afterEach(async () => {
      await truncate()
    })

    afterAll(async () => {
      await drop()
    })

    describe('testing the id resolver', () => {
      it('returns the resolved value', () => {
        const demoType = organizationType.getFields()

        expect(demoType.id.resolve({ id: '1' })).toEqual(
          toGlobalId('organizations', 1),
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

        const loader = domainLoaderConnectionsByOrgId(
          query,
          user._key,
          cleanseInput,
          {},
        )

        const expectedResult = {
          edges: [
            {
              cursor: toGlobalId('domains', domain._key),
              node: {
                _id: domain._id,
                _key: domain._key,
                _rev: domain._rev,
                _type: 'domain',
                id: domain._key,
                domain: 'test.gc.ca',
              },
            },
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: toGlobalId('domains', domain._key),
            endCursor: toGlobalId('domains', domain._key),
          },
        }

        await expect(
          demoType.domains.resolve(
            { _id: org._id },
            { first: 1 },
            { loaders: { domainLoaderConnectionsByOrgId: loader } },
          ),
        ).resolves.toEqual(expectedResult)
      })
    })
    describe('testing the affiliations resolver', () => {
      describe('user has correct permission to the resolver', () => {
        it('returns the resolved value', async () => {
          const demoType = organizationType.getFields()

          const loader = affiliationLoaderByOrgId(
            query,
            user._key,
            cleanseInput,
            {},
          )

          const checkPermission = jest.fn().mockReturnValue('admin')

          const expectedResults = {
            edges: [
              {
                cursor: toGlobalId('affiliations', affiliation._key),
                node: {
                  _from: org._id,
                  _to: user._id,
                  _id: affiliation._id,
                  _rev: affiliation._rev,
                  _key: affiliation._key,
                  _type: 'affiliation',
                  id: affiliation._key,
                  orgKey: org._key,
                  userKey: user._key,
                  permission: 'admin',
                },
              },
            ],
            totalCount: 1,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: toGlobalId('affiliations', affiliation._key),
              endCursor: toGlobalId('affiliations', affiliation._key),
            },
          }

          await expect(
            demoType.affiliations.resolve(
              { _id: org._id },
              { first: 5 },
              {
                auth: { checkPermission },
                loaders: { affiliationLoaderByOrgId: loader },
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

            const loader = affiliationLoaderByOrgId(
              query,
              user._key,
              cleanseInput,
              {},
            )

            const checkPermission = jest.fn().mockReturnValue('user')

            try {
              await demoType.affiliations.resolve(
                { _id: org._id },
                { first: 5 },
                {
                  i18n,
                  auth: { checkPermission },
                  loaders: { affiliationLoaderByOrgId: loader },
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

            const loader = affiliationLoaderByOrgId(
              query,
              user._key,
              cleanseInput,
              {},
            )

            const checkPermission = jest.fn().mockReturnValue('user')

            try {
              await demoType.affiliations.resolve(
                { _id: org._id },
                { first: 5 },
                {
                  i18n,
                  auth: { checkPermission },
                  loaders: { affiliationLoaderByOrgId: loader },
                },
              )
            } catch (err) {
              expect(err).toEqual(new Error('todo'))
            }
          })
        })
      })
    })
  })
})
