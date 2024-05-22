const { arangoConnection, updateDomainMailStatus } = require('../index')
const { dbNameFromFile } = require('arango-tools')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the updateDomainMailStatus function', () => {
  let query, truncate, collections, dbName, arangoDB, domain

  beforeAll(async () => {
    dbName = dbNameFromFile(__filename)
    ;({ collections, query, arangoDB, truncate } = await arangoConnection({
      url,
      databaseName: dbName,
      rootPass,
    }))
  })

  beforeEach(async () => {
    domain = (
      await collections.domains.save(
        {
          domain: 'domain.ca',
          sendsEmail: 'unknown',
        },
        { returnNew: true },
      )
    ).new
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    const systemDb = arangoDB.database('_system')
    await systemDb.dropDatabase(dbName)
  })

  it('updates domain with new mail status', async () => {
    const beforeDataDomain = await (await query`RETURN DOCUMENT('domains', ${domain._key})`).next()
    expect(beforeDataDomain.sendsEmail).toEqual('unknown')

    await updateDomainMailStatus({ query })({ domain: domain.domain, sendsEmail: 'true' })

    const afterDataDomain = await (await query`RETURN DOCUMENT('domains', ${domain._key})`).next()
    expect(afterDataDomain.sendsEmail).toEqual('true')
  })
})
