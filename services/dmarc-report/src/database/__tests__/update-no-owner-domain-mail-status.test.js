const { arangoConnection, updateNoOwnerDomainMailStatus } = require('../index')
const { dbNameFromFile } = require('arango-tools')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the updateNoOwnerDomainMailStatus function', () => {
  let query, truncate, collections, dbName, arangoDB, unownedDomain, ownedDomain, org

  beforeAll(async () => {
    dbName = dbNameFromFile(__filename)
    ;({ collections, query, arangoDB, truncate } = await arangoConnection({
      url,
      databaseName: dbName,
      rootPass,
    }))
  })

  beforeEach(async () => {
    unownedDomain = (
      await collections.domains.save(
        {
          domain: 'unowneddomain.ca',
        },
        { returnNew: true },
      )
    ).new
    ownedDomain = (
      await collections.domains.save(
        {
          domain: 'owneddomain.ca',
          sendsEmail: 'true',
        },
        { returnNew: true },
      )
    ).new
    org = await collections.organizations.save({
      orgDetails: {
        en: {
          acronym: 'ACR',
        },
      },
    })
    await collections.ownership.save({
      _from: org._id,
      _to: ownedDomain._id,
    })
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    const systemDb = arangoDB.database('_system')
    await systemDb.dropDatabase(dbName)
  })

  it('only updates domains without ownerships', async () => {
    const beforeDataUnownedDomain = await (await query`RETURN DOCUMENT('domains', ${unownedDomain._key})`).next()
    const beforeDataOwnedDomain = await (await query`RETURN DOCUMENT('domains', ${ownedDomain._key})`).next()

    expect(beforeDataUnownedDomain.sendsEmail).toBe(undefined)
    expect(beforeDataOwnedDomain.sendsEmail).toBe('true')

    await updateNoOwnerDomainMailStatus({ query })()

    const afterDataUnownedDomain = await (await query`RETURN DOCUMENT('domains', ${unownedDomain._key})`).next()
    const afterDataOwnedDomain = await (await query`RETURN DOCUMENT('domains', ${ownedDomain._key})`).next()

    expect(afterDataOwnedDomain.sendsEmail).toBe('true')
    expect(afterDataUnownedDomain.sendsEmail).toBe('unknown')
  })
})
