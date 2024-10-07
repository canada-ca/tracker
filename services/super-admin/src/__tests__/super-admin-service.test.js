const {
  DB_PASS: rootPass,
  DB_URL: url,
  SA_USER_DISPLAY_NAME,
  SA_USER_USERNAME,
  SA_USER_PASSWORD,
  SA_USER_LANG,

  SA_ORG_EN_SLUG,
  SA_ORG_EN_ACRONYM,
  SA_ORG_EN_NAME,
  SA_ORG_EN_ZONE,
  SA_ORG_EN_SECTOR,
  SA_ORG_EN_COUNTRY,
  SA_ORG_EN_PROVINCE,
  SA_ORG_EN_CITY,

  SA_ORG_FR_SLUG,
  SA_ORG_FR_ACRONYM,
  SA_ORG_FR_NAME,
  SA_ORG_FR_ZONE,
  SA_ORG_FR_SECTOR,
  SA_ORG_FR_COUNTRY,
  SA_ORG_FR_PROVINCE,
  SA_ORG_FR_CITY,
} = process.env

const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')
const bcrypt = require('bcryptjs')

const { createSuperAdminAccount, createSuperAdminOrg, createSuperAdminAffiliation } = require('../database')
const { databaseOptions } = require('../../database-options')
const { superAdminService } = require('../index')

describe('given the superAdminService function', () => {
  let query, drop, truncate, collections, transaction

  beforeAll(async () => {
    // Generate DB Items
    ;({ query, drop, truncate, collections, transaction } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given the super admin account does not exist', () => {
    describe('given the super admin org does not exist', () => {
      it('creates a new admin account, org, and affiliation', async () => {
        const mockLog = jest.fn()
        await superAdminService({
          query,
          collections,
          transaction,
          bcrypt,
          log: mockLog,
        })

        const expectedOrgCursor = await query`
          FOR org IN organizations
            RETURN org
        `
        const expectedOrg = await expectedOrgCursor.next()

        const org = {
          _id: expectedOrg._id,
          _key: expectedOrg._key,
          _rev: expectedOrg._rev,
          verified: false,
          orgDetails: {
            en: {
              acronym: SA_ORG_EN_ACRONYM,
              city: SA_ORG_EN_CITY,
              country: SA_ORG_EN_COUNTRY,
              name: SA_ORG_EN_NAME,
              province: SA_ORG_EN_PROVINCE,
              sector: SA_ORG_EN_SECTOR,
              slug: SA_ORG_EN_SLUG,
              zone: SA_ORG_EN_ZONE,
            },
            fr: {
              acronym: SA_ORG_FR_ACRONYM,
              city: SA_ORG_FR_CITY,
              country: SA_ORG_FR_COUNTRY,
              name: SA_ORG_FR_NAME,
              province: SA_ORG_FR_PROVINCE,
              sector: SA_ORG_FR_SECTOR,
              slug: SA_ORG_FR_SLUG,
              zone: SA_ORG_FR_ZONE,
            },
          },
        }
        expect(org).toEqual(expectedOrg)

        const expectedAdminCursor = await query`
          FOR user IN users
            RETURN user
        `

        const expectedAdmin = await expectedAdminCursor.next()
        const superAdmin = {
          _id: expectedAdmin._id,
          _key: expectedAdmin._key,
          _rev: expectedAdmin._rev,
          displayName: SA_USER_DISPLAY_NAME,
          userName: SA_USER_USERNAME,
          password: expectedAdmin.password,
          phoneValidated: false,
          emailValidated: false,
          failedLoginAttempts: 0,
          tfaSendMethod: 'none',
        }
        expect(superAdmin).toEqual(expectedAdmin)

        const expectedAffiliationCursor = await query`
          FOR aff IN affiliations
            RETURN aff
        `
        const expectedAffiliation = await expectedAffiliationCursor.next()
        const affiliation = {
          _id: expectedAffiliation._id,
          _key: expectedAffiliation._key,
          _rev: expectedAffiliation._rev,
          _from: expectedOrg._id,
          _to: expectedAdmin._id,
          defaultSA: true,
          permission: 'super_admin',
        }
        expect(affiliation).toEqual(expectedAffiliation)

        expect(mockLog.mock.calls).toEqual([
          ['Checking for super admin account.'],
          ['Super admin account, and org not found, creating new account.'],
          ['Super admin account, org, and affiliation creation successful.'],
          ['Exiting now.'],
        ])
      })
    })
  })
  describe('given the super admin account exists', () => {
    let expectedAdmin
    beforeEach(async () => {
      await createSuperAdminAccount({ collections, transaction, bcrypt })
      const expectedAdminCursor = await query`
        FOR user IN users
          RETURN user
      `
      expectedAdmin = await expectedAdminCursor.next()
    })

    describe('given the super admin org does not exist', () => {
      it('creates a new super admin org and affiliation', async () => {
        const mockLog = jest.fn()
        await superAdminService({
          query,
          collections,
          transaction,
          bcrypt,
          log: mockLog,
        })

        const expectedOrgCursor = await query`
          FOR org IN organizations
            RETURN org
        `
        const expectedOrg = await expectedOrgCursor.next()

        const org = {
          _id: expectedOrg._id,
          _key: expectedOrg._key,
          _rev: expectedOrg._rev,
          verified: false,
          orgDetails: {
            en: {
              acronym: SA_ORG_EN_ACRONYM,
              city: SA_ORG_EN_CITY,
              country: SA_ORG_EN_COUNTRY,
              name: SA_ORG_EN_NAME,
              province: SA_ORG_EN_PROVINCE,
              sector: SA_ORG_EN_SECTOR,
              slug: SA_ORG_EN_SLUG,
              zone: SA_ORG_EN_ZONE,
            },
            fr: {
              acronym: SA_ORG_FR_ACRONYM,
              city: SA_ORG_FR_CITY,
              country: SA_ORG_FR_COUNTRY,
              name: SA_ORG_FR_NAME,
              province: SA_ORG_FR_PROVINCE,
              sector: SA_ORG_FR_SECTOR,
              slug: SA_ORG_FR_SLUG,
              zone: SA_ORG_FR_ZONE,
            },
          },
        }
        expect(org).toEqual(expectedOrg)

        const superAdmin = {
          _id: expectedAdmin._id,
          _key: expectedAdmin._key,
          _rev: expectedAdmin._rev,
          displayName: SA_USER_DISPLAY_NAME,
          userName: SA_USER_USERNAME,
          password: expectedAdmin.password,
          phoneValidated: false,
          emailValidated: false,
          failedLoginAttempts: 0,
          tfaSendMethod: 'none',
        }
        expect(superAdmin).toEqual(expectedAdmin)

        const expectedAffiliationCursor = await query`
          FOR aff IN affiliations
            RETURN aff
        `
        const expectedAffiliation = await expectedAffiliationCursor.next()
        const affiliation = {
          _id: expectedAffiliation._id,
          _key: expectedAffiliation._key,
          _rev: expectedAffiliation._rev,
          _from: expectedOrg._id,
          _to: expectedAdmin._id,
          defaultSA: true,
          permission: 'super_admin',
        }
        expect(affiliation).toEqual(expectedAffiliation)

        expect(mockLog.mock.calls).toEqual([
          ['Checking for super admin account.'],
          ['Super admin org not found, Super admin account found. Creating super admin org.'],
          ['Removing old super admin affiliation.'],
          ['Creating new super admin affiliation'],
          ['Super admin org, and affiliation creation successful.'],
          ['Exiting now.'],
        ])
      })
    })
  })

  describe('given the super admin org exists', () => {
    let expectedOrg
    beforeEach(async () => {
      await createSuperAdminOrg({ collections, transaction })
      const expectedOrgCursor = await query`
        FOR org IN organizations
          RETURN org
      `
      expectedOrg = await expectedOrgCursor.next()
    })
    describe('given the super admin account does not exist', () => {
      it('creates a new super admin account and affiliation', async () => {
        const mockLog = jest.fn()
        await superAdminService({
          query,
          collections,
          transaction,
          bcrypt,
          log: mockLog,
        })

        const org = {
          _id: expectedOrg._id,
          _key: expectedOrg._key,
          _rev: expectedOrg._rev,
          verified: false,
          orgDetails: {
            en: {
              acronym: SA_ORG_EN_ACRONYM,
              city: SA_ORG_EN_CITY,
              country: SA_ORG_EN_COUNTRY,
              name: SA_ORG_EN_NAME,
              province: SA_ORG_EN_PROVINCE,
              sector: SA_ORG_EN_SECTOR,
              slug: SA_ORG_EN_SLUG,
              zone: SA_ORG_EN_ZONE,
            },
            fr: {
              acronym: SA_ORG_FR_ACRONYM,
              city: SA_ORG_FR_CITY,
              country: SA_ORG_FR_COUNTRY,
              name: SA_ORG_FR_NAME,
              province: SA_ORG_FR_PROVINCE,
              sector: SA_ORG_FR_SECTOR,
              slug: SA_ORG_FR_SLUG,
              zone: SA_ORG_FR_ZONE,
            },
          },
        }
        expect(org).toEqual(expectedOrg)

        const expectedAdminCursor = await query`
          FOR user IN users
            RETURN user
        `

        const expectedAdmin = await expectedAdminCursor.next()
        const superAdmin = {
          _id: expectedAdmin._id,
          _key: expectedAdmin._key,
          _rev: expectedAdmin._rev,
          displayName: SA_USER_DISPLAY_NAME,
          userName: SA_USER_USERNAME,
          password: expectedAdmin.password,
          phoneValidated: false,
          emailValidated: false,
          failedLoginAttempts: 0,
          tfaSendMethod: 'none',
        }
        expect(superAdmin).toEqual(expectedAdmin)

        const expectedAffiliationCursor = await query`
          FOR aff IN affiliations
            RETURN aff
        `
        const expectedAffiliation = await expectedAffiliationCursor.next()
        const affiliation = {
          _id: expectedAffiliation._id,
          _key: expectedAffiliation._key,
          _rev: expectedAffiliation._rev,
          _from: expectedOrg._id,
          _to: expectedAdmin._id,
          defaultSA: true,
          permission: 'super_admin',
        }
        expect(affiliation).toEqual(expectedAffiliation)

        expect(mockLog.mock.calls).toEqual([
          ['Checking for super admin account.'],
          ['Super admin account not found, Super admin org found. Creating account.'],
          ['Removing old super admin affiliation.'],
          ['Creating new super admin affiliation'],
          ['Super admin account, and affiliation creation successful.'],
          ['Exiting now.'],
        ])
      })
    })
  })

  describe('given the super admin account and org exists', () => {
    describe('given the super admin affiliation does not exist', () => {
      let expectedOrg, expectedAdmin
      beforeEach(async () => {
        await createSuperAdminOrg({ collections, transaction })
        const expectedOrgCursor = await query`
        FOR org IN organizations
          RETURN org
      `
        expectedOrg = await expectedOrgCursor.next()

        await createSuperAdminAccount({ collections, transaction, bcrypt })
        const expectedAdminCursor = await query`
        FOR user IN users
          RETURN user
      `
        expectedAdmin = await expectedAdminCursor.next()
      })
      it('creates a new affiliation', async () => {
        const mockLog = jest.fn()
        await superAdminService({
          query,
          collections,
          transaction,
          bcrypt,
          log: mockLog,
        })

        const org = {
          _id: expectedOrg._id,
          _key: expectedOrg._key,
          _rev: expectedOrg._rev,
          verified: false,
          orgDetails: {
            en: {
              acronym: SA_ORG_EN_ACRONYM,
              city: SA_ORG_EN_CITY,
              country: SA_ORG_EN_COUNTRY,
              name: SA_ORG_EN_NAME,
              province: SA_ORG_EN_PROVINCE,
              sector: SA_ORG_EN_SECTOR,
              slug: SA_ORG_EN_SLUG,
              zone: SA_ORG_EN_ZONE,
            },
            fr: {
              acronym: SA_ORG_FR_ACRONYM,
              city: SA_ORG_FR_CITY,
              country: SA_ORG_FR_COUNTRY,
              name: SA_ORG_FR_NAME,
              province: SA_ORG_FR_PROVINCE,
              sector: SA_ORG_FR_SECTOR,
              slug: SA_ORG_FR_SLUG,
              zone: SA_ORG_FR_ZONE,
            },
          },
        }
        expect(org).toEqual(expectedOrg)

        const superAdmin = {
          _id: expectedAdmin._id,
          _key: expectedAdmin._key,
          _rev: expectedAdmin._rev,
          displayName: SA_USER_DISPLAY_NAME,
          userName: SA_USER_USERNAME,
          password: expectedAdmin.password,
          phoneValidated: false,
          emailValidated: false,
          failedLoginAttempts: 0,
          tfaSendMethod: 'none',
        }
        expect(superAdmin).toEqual(expectedAdmin)

        const expectedAffiliationCursor = await query`
          FOR aff IN affiliations
            RETURN aff
        `
        const expectedAffiliation = await expectedAffiliationCursor.next()
        const affiliation = {
          _id: expectedAffiliation._id,
          _key: expectedAffiliation._key,
          _rev: expectedAffiliation._rev,
          _from: expectedOrg._id,
          _to: expectedAdmin._id,
          defaultSA: true,
          permission: 'super_admin',
        }
        expect(affiliation).toEqual(expectedAffiliation)

        expect(mockLog.mock.calls).toEqual([
          ['Checking for super admin account.'],
          ['Found super admin account, and org. Checking for affiliation.'],
          ['Super admin affiliation not found, creating new affiliation.'],
          ['Super admin affiliation creation successful.'],
          ['Exiting now.'],
        ])
      })
    })

    describe('given that the super admin affiliation exists', () => {
      let expectedOrg, expectedAdmin, expectedAffiliation
      beforeEach(async () => {
        await createSuperAdminOrg({ collections, transaction })
        const expectedOrgCursor = await query`
          FOR org IN organizations
            RETURN org
        `
        expectedOrg = await expectedOrgCursor.next()

        await createSuperAdminAccount({ collections, transaction, bcrypt })
        const expectedAdminCursor = await query`
          FOR user IN users
            RETURN user
        `
        expectedAdmin = await expectedAdminCursor.next()

        await createSuperAdminAffiliation({
          collections,
          transaction,
          org: expectedOrg,
          admin: expectedAdmin,
        })
        const expectedAffiliationCursor = await query`
          FOR aff IN affiliations
            RETURN aff
        `
        expectedAffiliation = await expectedAffiliationCursor.next()
      })
      it('exits the script', async () => {
        const mockLog = jest.fn()
        await superAdminService({
          query,
          collections,
          transaction,
          bcrypt,
          log: mockLog,
        })

        const org = {
          _id: expectedOrg._id,
          _key: expectedOrg._key,
          _rev: expectedOrg._rev,
          verified: false,
          orgDetails: {
            en: {
              acronym: SA_ORG_EN_ACRONYM,
              city: SA_ORG_EN_CITY,
              country: SA_ORG_EN_COUNTRY,
              name: SA_ORG_EN_NAME,
              province: SA_ORG_EN_PROVINCE,
              sector: SA_ORG_EN_SECTOR,
              slug: SA_ORG_EN_SLUG,
              zone: SA_ORG_EN_ZONE,
            },
            fr: {
              acronym: SA_ORG_FR_ACRONYM,
              city: SA_ORG_FR_CITY,
              country: SA_ORG_FR_COUNTRY,
              name: SA_ORG_FR_NAME,
              province: SA_ORG_FR_PROVINCE,
              sector: SA_ORG_FR_SECTOR,
              slug: SA_ORG_FR_SLUG,
              zone: SA_ORG_FR_ZONE,
            },
          },
        }
        expect(org).toEqual(expectedOrg)

        const superAdmin = {
          _id: expectedAdmin._id,
          _key: expectedAdmin._key,
          _rev: expectedAdmin._rev,
          displayName: SA_USER_DISPLAY_NAME,
          userName: SA_USER_USERNAME,
          password: expectedAdmin.password,
          phoneValidated: false,
          emailValidated: false,
          failedLoginAttempts: 0,
          tfaSendMethod: 'none',
        }
        expect(superAdmin).toEqual(expectedAdmin)

        const affiliation = {
          _id: expectedAffiliation._id,
          _key: expectedAffiliation._key,
          _rev: expectedAffiliation._rev,
          _from: expectedOrg._id,
          _to: expectedAdmin._id,
          defaultSA: true,
          permission: 'super_admin',
        }
        expect(affiliation).toEqual(expectedAffiliation)

        expect(mockLog.mock.calls).toEqual([
          ['Checking for super admin account.'],
          ['Found super admin account, and org. Checking for affiliation.'],
          ['Super admin affiliation found.'],
          ['Exiting now.'],
        ])
      })
    })
  })
})
