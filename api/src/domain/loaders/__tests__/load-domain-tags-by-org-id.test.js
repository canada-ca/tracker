import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { loadDomainTagsByOrgId } from '../index'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the load domain connection using org id function', () => {
  let query, drop, truncate, collections, user, org, domain, domainTwo, i18n

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
        tfaValidated: false,
        emailValidated: false,
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
      await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'admin',
      })
      domain = await collections.domains.save({
        domain: 'test.domain.gc.ca',
        lastRan: '2021-01-02 12:12:12.000000',
        selectors: ['selector1', 'selector2'],
        status: {
          dkim: 'pass',
          dmarc: 'pass',
          https: 'pass',
          spf: 'pass',
          ssl: 'pass',
        },
        tags: [
          {
            id: 'CVE-2022-12345',
            firstDetected: '2021-01-02 12:12:12.000000',
            severity: 'high',
          },
        ],
      })
      await collections.claims.save({
        _from: org._id,
        _to: domain._id,
      })
      domainTwo = await collections.domains.save({
        domain: 'test.domain.canada.ca',
        lastRan: '2022-06-07 12:12:12.000000',
        selectors: ['selector1', 'selector2'],
        status: {
          dkim: 'fail',
          dmarc: 'fail',
          https: 'fail',
          spf: 'fail',
          ssl: 'fail',
        },
        tags: [
          {
            id: 'CVE-2022-54321',
            firstDetected: '2022-06-07 12:12:12.000000',
            severity: 'low',
          },
        ],
      })
      await collections.claims.save({
        _from: org._id,
        _to: domainTwo._id,
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('using loader', () => {
      it('returns a list of tags', async () => {
        const connectionLoader = loadDomainTagsByOrgId({
          query,
          userKey: user._key,
          i18n,
        })

        const tags = await connectionLoader({
          orgId: org._id,
        })

        const expectedStructure = {
          edges: [
            { id: 'CVE-2022-12345', severity: 'high' },
            { id: 'CVE-2022-54321', severity: 'low' },
          ],
          totalCount: 2,
        }

        expect(tags).toEqual(expectedStructure)
      })
    })
    describe('no tags are found', () => {
      it('returns an empty structure', async () => {
        await truncate()
        const connectionLoader = loadDomainTagsByOrgId({
          query,
          userKey: user._key,
          i18n,
        })

        const tags = await connectionLoader({
          orgId: 'notanid',
        })

        const expectedStructure = {
          edges: [],
          totalCount: 0,
        }

        expect(tags).toEqual(expectedStructure)
      })
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
    describe('given an unsuccessful load', () => {
      it('returns an error message', async () => {
        const connectionLoader = loadDomainTagsByOrgId({
          query,
          userKey: user._key,
          i18n,
        })

        try {
          await connectionLoader({
            orgId: org._id,
          })
        } catch (err) {
          expect(err).toEqual(new Error(`Unable to load domain(s). Please try again.`))
        }
      })
    })
    describe('given a database error', () => {
      describe('when gathering domain keys that are claimed by orgs that the user has affiliations to', () => {
        it('returns an error message', async () => {
          const query = jest.fn().mockRejectedValue(new Error('Database Error Occurred.'))

          const connectionLoader = loadDomainTagsByOrgId({
            query,
            userKey: user._key,
            i18n,
          })

          const connectionArgs = {
            first: 5,
          }
          try {
            await connectionLoader({
              orgId: org._id,
              ...connectionArgs,
            })
          } catch (err) {
            expect(err).toEqual(new Error('Unable to load domain(s). Please try again.'))
          }
        })
      })
    })
  })
})
