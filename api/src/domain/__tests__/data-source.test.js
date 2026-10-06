import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../testUtilities'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'
import { DomainDataSource } from '../data-source'
import dbschema from '../../../database.json'
import { collectionNames } from '../../collection-names'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the DomainDataSource', () => {
  const consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(() => {
    console.error = mockedError
  })
  beforeEach(() => {
    consoleOutput.length = 0
  })

  describe('organizationHasOwnership', () => {
    describe('given a database', () => {
      let query, drop, truncate, collections, org, otherOrg, domain

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
        org = await collections.organizations.save({ orgDetails: { en: { slug: 'owner-org' } } })
        otherOrg = await collections.organizations.save({ orgDetails: { en: { slug: 'other-org' } } })
        domain = await collections.domains.save({ domain: 'test.gc.ca' })
      })
      afterEach(async () => {
        await truncate()
      })
      afterAll(async () => {
        await drop()
      })

      it('returns true when an ownership edge exists from the org to the domain', async () => {
        await collections.ownership.save({ _from: org._id, _to: domain._id })
        const domainDataSource = new DomainDataSource({ query })

        await expect(domainDataSource.organizationHasOwnership({ orgId: org._id, domainId: domain._id })).resolves.toEqual(
          true,
        )
      })
      it('returns false when the ownership edge belongs to a different org', async () => {
        await collections.ownership.save({ _from: otherOrg._id, _to: domain._id })
        const domainDataSource = new DomainDataSource({ query })

        await expect(domainDataSource.organizationHasOwnership({ orgId: org._id, domainId: domain._id })).resolves.toEqual(
          false,
        )
      })
      it('returns false when no ownership edge exists', async () => {
        const domainDataSource = new DomainDataSource({ query })

        await expect(domainDataSource.organizationHasOwnership({ orgId: org._id, domainId: domain._id })).resolves.toEqual(
          false,
        )
      })
    })

    describe('database error is raised', () => {
      describe('users language is set to english', () => {
        const i18n = setupI18n({
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
        it('throws an error', async () => {
          const mockedQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
          const domainDataSource = new DomainDataSource({ query: mockedQuery, userKey: '1234', i18n })

          await expect(
            domainDataSource.organizationHasOwnership({ orgId: 'organizations/1', domainId: 'domains/1' }),
          ).rejects.toEqual(new Error('Unable to update domain. Please try again.'))

          expect(consoleOutput).toEqual([
            `Database error occurred while user: 1234 attempted to check domain ownership for domain: domains/1, error: Error: Database error occurred.`,
          ])
        })
      })
      describe('users language is set to french', () => {
        const i18n = setupI18n({
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
        it('throws an error', async () => {
          const mockedQuery = jest.fn().mockRejectedValue(new Error('Database error occurred.'))
          const domainDataSource = new DomainDataSource({ query: mockedQuery, userKey: '1234', i18n })

          await expect(
            domainDataSource.organizationHasOwnership({ orgId: 'organizations/1', domainId: 'domains/1' }),
          ).rejects.toEqual(new Error('Impossible de mettre à jour le domaine. Veuillez réessayer.'))
        })
      })
    })
  })

  describe('updateCvdEnrollment', () => {
    let query, drop, truncate, collections, transaction, domain

    beforeAll(async () => {
      ;({ query, drop, truncate, collections, transaction } = await ensure({
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
      domain = await collections.domains.save({
        domain: 'test.gc.ca',
        cvdEnrollment: {
          status: 'enrolled',
          description: 'Stored asset description',
          maxSeverity: 'high',
        },
      })
    })
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })

    it('merges a partial patch into the stored cvdEnrollment, preserving existing keys', async () => {
      const domainDataSource = new DomainDataSource({ query, transaction, collections: collectionNames })

      const updatedDomain = await domainDataSource.updateCvdEnrollment({
        domain,
        cvdEnrollment: { description: 'New description', integrityRequirement: 'low' },
      })

      expect(updatedDomain.cvdEnrollment).toEqual({
        status: 'enrolled',
        description: 'New description',
        maxSeverity: 'high',
        integrityRequirement: 'low',
      })
    })
  })
})
