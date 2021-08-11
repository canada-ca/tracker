const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ensure, dbNameFromFile } = require('arango-tools')
const { databaseOptions } = require('../../database-options')
const { slugify } = require('../slugify')

const { createOrganization } = require('../create-organization')

describe('given the createOrganization function', () => {
  let query, drop, truncate, collections, transaction, trx

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.info = mockedInfo
    ;({ query, drop, truncate, collections, transaction } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeEach(async () => {
    const collectionStrings = []
    for (const property in collections) {
      collectionStrings.push(property.toString())
    }

    // Setup Transaction
    trx = await transaction(collectionStrings)
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  it('creates the organization in the db', async () => {
    const key = 'CSE-CST'
    const data = {
      'CSE-CST': {
        acronym_en: 'CSE',
        acronym_fr: 'CST',
        organization_en: 'english org name',
        organization_fr: 'french org name',
      },
    }

    await createOrganization({ slugify, data, key, trx, query })

    // commit the transaction
    await trx.commit()

    const checkCursor = await query`FOR org IN organizations RETURN org`
    const checkOrg = await checkCursor.next()

    expect(checkOrg).toEqual({
      _id: checkOrg._id,
      _key: checkOrg._key,
      _rev: checkOrg._rev,
      verified: true,
      summaries: {
        web: {
          pass: 0,
          fail: 0,
          total: 0,
        },
        mail: {
          pass: 0,
          fail: 0,
          total: 0,
        },
      },
      orgDetails: {
        en: {
          slug: slugify('english org name'),
          acronym: 'CSE',
          name: 'english org name',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: slugify('french org name'),
          acronym: 'CST',
          name: 'french org name',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
    })
  })
  it('returns the org object', async () => {
    const key = 'CSE-CST'
    const data = {
      'CSE-CST': {
        acronym_en: 'CSE',
        acronym_fr: 'CST',
        organization_en: 'english org name',
        organization_fr: 'french org name',
      },
    }

    const checkOrg = await createOrganization({ slugify, data, key, trx, query })

    // commit the transaction
    await trx.commit()

    expect(checkOrg).toEqual({
      _id: checkOrg._id,
      _key: checkOrg._key,
      _rev: checkOrg._rev,
      verified: true,
      summaries: {
        web: {
          pass: 0,
          fail: 0,
          total: 0,
        },
        mail: {
          pass: 0,
          fail: 0,
          total: 0,
        },
      },
      orgDetails: {
        en: {
          slug: slugify('english org name'),
          acronym: 'CSE',
          name: 'english org name',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: slugify('french org name'),
          acronym: 'CST',
          name: 'french org name',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
    })
  })
})
