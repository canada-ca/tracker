const { DB_PASS: rootPass, DB_URL: url } = process.env

const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')
const { databaseOptions } = require('../../database-options')
const { removeNXDomainService } = require('../remove-nxdomain-service')

describe('given the removeNXDomainService', () => {
  const consoleErrorOutput = []
  const consoleInfoOutput = []
  const mockedError = (output) => consoleErrorOutput.push(output)
  const mockedInfo = (output) => consoleInfoOutput.push(output)

  let query, drop, truncate, collections

  beforeAll(async () => {
    // Generate DB Items
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeEach(async () => {
    console.error = mockedError
    console.info = mockedInfo
    consoleErrorOutput.length = 0
    consoleInfoOutput.length = 0

    await truncate()
  })

  afterAll(async () => {
    await drop()
  })

  describe('given a successful query', () => {
    // eslint-disable-next-line no-unused-vars
    let domain, org, claim, favourite, ownership, dmarcSummary, web, webScan, webToWebScan, dns, domainToDns
    beforeEach(async () => {
      domain = await collections.domains.save({
        domain: 'test.domain.gc.ca',
        rcode: 'NXDOMAIN',
      })
      org = await collections.organizations.save({
        orgDetails: {
          en: {
            acronym: 'CSE',
            name: 'Communications Security Establishment',
            zone: 'cyber',
          },
          fr: {
            acronym: 'CST',
            name: 'Centre de la sécurité des télécommunications',
            zone: 'cyber',
          },
        },
      })
      claim = await collections.claims.save({
        _from: org._id,
        _to: domain._id,
      })
      favourite = await collections.favourites.save({
        _from: 'users/1',
        _to: domain._id,
      })
      ownership = await collections.ownership.save({
        _from: org._id,
        _to: domain._id,
      })
      dmarcSummary = await collections.dmarcSummaries.save({
        _key: domain._key,
        _id: domain._id,
      })
      web = await collections.web.save({
        _key: domain._key,
        _id: domain._id,
      })
      webScan = await collections.webScan.save({
        _key: domain._key,
        _id: domain._id,
      })
      webToWebScan = await collections.webToWebScans.save({
        _from: web._id,
        _to: webScan._id,
      })
      dns = await collections.dns.save({
        _key: domain._key,
        _id: domain._id,
      })
      domainToDns = await collections.domainsDNS.save({
        _from: domain._id,
        _to: dns._id,
      })
    })
    it('removes all domains with an rcode of NXDOMAIN', async () => {
      const getAllDomains = async () =>
        await (
          await query`
            FOR domain IN domains
            RETURN domain
        `
        ).all()

      const initialDomainList = await getAllDomains()
      expect(initialDomainList).toHaveLength(1)
      expect(initialDomainList[0].domain).toEqual('test.domain.gc.ca')

      await removeNXDomainService({ query })

      const domainListAfterCleanup = await getAllDomains()
      expect(domainListAfterCleanup).toEqual([])
    })
  })
})
