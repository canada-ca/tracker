const { ensure, dbNameFromFile } = require('arango-tools')

const { loadOrgOwner } = require('../load-org-owner')
const { databaseOptions } = require('../../../database-options')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the loadOrgOwner function', () => {
  let query, drop, truncate, collections, domain, org

  beforeAll(async () => {
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeAll(async () => {
    domain = await collections.domains.save({
      domain: 'domain.ca',
    })
    org = await collections.organizations.save({
      orgDetails: {
        en: {
          acronym: 'ACR',
        },
      },
    })
    await collections.ownership.save({
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

  it('returns the org that owns the given domain', async () => {
    const orgOwner = await loadOrgOwner({ query })({ domain: 'domain.ca' })

    const expectedResult = 'ACR'

    expect(orgOwner).toEqual(expectedResult)
  })
})
