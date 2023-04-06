const { DB_PASS: rootPass, DB_URL: url, HASHING_SALT } = process.env

const { ensure, dbNameFromFile } = require('arango-tools')
const { databaseOptions } = require('../../../database-options')

const { createDomain } = require('../create-domain')
const { saltedHash } = require('../salted-hash')

describe('given the createDomain function', () => {
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

  it('creates the domain in the db', async () => {
    await createDomain({ domain: 'domain.ca', trx, query })

    // commit the transaction
    await trx.commit()

    const checkCursor = await query`FOR domain IN domains RETURN domain`
    const checkDomain = await checkCursor.next()

    expect(checkDomain).toEqual({
      _id: checkDomain._id,
      _key: checkDomain._key,
      _rev: checkDomain._rev,
      domain: 'domain.ca',
      hash: saltedHash('domain.ca', HASHING_SALT),
      selectors: [],
      status: {
        ciphers: 'info',
        curves: 'info',
        hsts: 'info',
        protocols: 'info',
        certificates: 'info',
        dkim: 'info',
        dmarc: 'info',
        https: 'info',
        spf: 'info',
        ssl: 'info',
      },
      lastRan: '',
    })
  })
  it('returns the domain', async () => {
    const checkDomain = await createDomain({ domain: 'domain.ca', trx, query })

    // commit the transaction
    await trx.commit()

    expect(checkDomain).toEqual({
      _id: checkDomain._id,
      _key: checkDomain._key,
      _rev: checkDomain._rev,
      domain: 'domain.ca',
      hash: saltedHash('domain.ca', HASHING_SALT),
      selectors: [],
      status: {
        ciphers: 'info',
        curves: 'info',
        hsts: 'info',
        protocols: 'info',
        certificates: 'info',
        dkim: 'info',
        dmarc: 'info',
        https: 'info',
        spf: 'info',
        ssl: 'info',
      },
      lastRan: '',
    })
  })
})
