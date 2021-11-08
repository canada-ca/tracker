const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ensure, dbNameFromFile } = require('arango-tools')
const { databaseOptions } = require('../../../database-options')

const { checkClaim } = require('../check-claim')

describe('given the checkClaims function', () => {
  let query, drop, truncate, collections, org, domain

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

  describe('an org claims a domain', () => {
    beforeEach(async () => {
      org = await collections.organizations.save({
        _id: 'organizations/1',
        _key: '1',
      })
      domain = await collections.domains.save({
        _id: 'domains/1',
        _key: '1',
      })
      await collections.claims.save({
        _from: org._id,
        _to: domain._id,
      })
    })
    it('returns 1 claim', async () => {
      const claims = await checkClaim({
        query,
        domainId: domain._id,
        orgId: org._id,
      })
      expect(claims._id).toEqual('organizations/1')
    })
  })

  describe('no orgs claim the domain', () => {
    beforeEach(async () => {
      org = await collections.organizations.save({
        _id: 'organizations/1',
        _key: '1',
      })
      domain = await collections.domains.save({
        _id: 'domains/1',
        _key: '1',
      })
    })
    it('returns 0', async () => {
      const claims = await checkClaim({
        query,
        domainId: domain._id,
        orgId: org._id,
      })
      expect(claims).not.toBeDefined()
    })
  })
})
