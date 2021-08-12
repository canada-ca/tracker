const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ensure, dbNameFromFile } = require('arango-tools')
const { databaseOptions } = require('../../database-options')

const { createClaim } = require('../create-claim')

describe('given the createClaim function', () => {
  let query, drop, truncate, collections, transaction, domain, org, trx

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

    domain = await collections.domains.save({
      _id: 'domains/1',
      _key: '1',
      domain: 'domain.ca',
    })
    org = await collections.organizations.save({
      _id: 'organizations/1',
      _key: '1',
      orgDetails: {
        en: {
          acronym: 'CSE',
        },
        fr: {
          acronym: 'CST',
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

  it('creates the claim in the db', async () => {
    await createClaim({ trx, query, domainId: domain._id, orgId: org._id })

    // commit the transaction
    await trx.commit()

    const checkCursor = await query`FOR claim IN claims RETURN claim`

    const checkClaim = await checkCursor.next()

    expect(checkClaim).toEqual({
      _from: 'organizations/1',
      _to: 'domains/1',
      _id: checkClaim._id,
      _key: checkClaim._key,
      _rev: checkClaim._rev,
    })
  })
  it('returns the claim', async () => {
    const claim = await createClaim({
      trx,
      query,
      domainId: domain._id,
      orgId: org._id,
    })

    // commit the transaction
    await trx.commit()

    expect(claim).toEqual({
      _from: 'organizations/1',
      _to: 'domains/1',
      _id: claim._id,
      _key: claim._key,
      _rev: claim._rev,
    })
  })
})
