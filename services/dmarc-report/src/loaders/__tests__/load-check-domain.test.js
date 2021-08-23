const { ensure, dbNameFromFile } = require('arango-tools')

const { loadCheckDomain } = require('../load-check-domain')
const { databaseOptions } = require('../../../database-options')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadCheckDomain function', () => {
  let query, drop, truncate, collections, domain
  beforeAll(async () => {
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeEach(async () => {
    domain = await collections.domains.save({
      domain: 'domain.ca',
    })
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })
  it('returns the domain from the db', async () => {
    const checkDomain = await loadCheckDomain({ query })({
      domain: 'domain.ca',
    })

    const expectedResult = {
      _id: domain._id,
      _key: domain._key,
      _rev: domain._rev,
      domain: 'domain.ca',
    }

    expect(checkDomain).toEqual(expectedResult)
  })
})
