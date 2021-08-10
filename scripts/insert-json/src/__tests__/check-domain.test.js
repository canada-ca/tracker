require('dotenv').config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ensure, dbNameFromFile } = require('arango-tools')
const { databaseOptions } = require('../../database-options')

const { checkDomain } = require('../check-domain')

describe('given the checkDomain function', () => {
  let query, drop, truncate, collections, domain

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.info = mockedInfo
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given the domain exists', () => {
    beforeEach(async () => {
      domain = await collections.domains.save({
        _id: 'domains/1',
        _key: '1',
        domain: 'domain.ca',
      })
    })
    it('returns domain', async () => {
      const domainObj = await checkDomain({ query, domain: 'domain.ca' })

      expect(domainObj).toEqual({
        _id: 'domains/1',
        _key: '1',
        _rev: domain._rev,
        domain: 'domain.ca',
      })
    })
  })
  describe('given the domain does not exist', () => {
    it('returns undefined', async () => {
      const domainObj = await checkDomain({ query, domain: 'domain.ca' })

      expect(domainObj).toBeUndefined()
    })
  })
})
