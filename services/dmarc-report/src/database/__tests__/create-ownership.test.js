const { dbNameFromFile } = require('arango-tools')

const { createOwnership } = require('../create-ownership')
const { arangoConnection } = require('../index')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the createOwnership function', () => {
  let query, truncate, collections, transaction, dbName, arangoDB, domain, org

  beforeAll(async () => {
    dbName = dbNameFromFile(__filename)
    ;({ collections, query, transaction, arangoDB, truncate } = await arangoConnection({
      url,
      databaseName: dbName,
      rootPass,
    }))
  })

  beforeEach(async () => {
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
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    try {
      const systemDb = arangoDB.database('_system')
      await systemDb.dropDatabase(dbName)
    } catch (err) {}
  })

  it('creates the ownership in arango', async () => {
    await createOwnership({ transaction, collections, query })({
      domain: 'domain.ca',
      orgAcronymEn: 'ACR',
    })

    const checkCursor = await query`FOR item IN ownership RETURN item`

    const checkOwnership = await checkCursor.next()

    expect(checkOwnership).toBeDefined()

    const expectedResult = {
      _id: checkOwnership._id,
      _key: checkOwnership._key,
      _rev: checkOwnership._rev,
      _from: org._id,
      _to: domain._id,
    }

    expect(checkOwnership).toEqual(expectedResult)
  })
})
