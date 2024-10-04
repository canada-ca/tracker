const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')

const { loadCheckOrg } = require('../load-check-org')
const { databaseOptions } = require('../../../database-options')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadCheckOrg function', () => {
  let query, drop, truncate, collections, arangoCtx, org
  beforeAll(async () => {
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
    arangoCtx = { query, collections }
  })

  beforeEach(async () => {
    org = await collections.organizations.save({
      orgDetails: {
        en: {
          acronym: 'ACR',
        },
      },
    })
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  it('returns the org from the db', async () => {
    const checkOrg = await loadCheckOrg({
      arangoCtx,
      orgAcronymEn: 'ACR',
    })

    const expectedResult = {
      _id: org._id,
      _key: org._key,
      _rev: org._rev,
      orgDetails: {
        en: {
          acronym: 'ACR',
        },
      },
    }

    expect(checkOrg).toEqual(expectedResult)
  })
})
