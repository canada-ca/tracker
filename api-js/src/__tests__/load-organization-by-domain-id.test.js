const dotenv = require('dotenv-safe')
dotenv.config()
const { DB_PASS: rootPass, DB_URL: url } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { makeMigrations } = require('../../migrations')
const { orgLoaderByDomainId } = require('../loaders')

describe('given a orgLoaderById dataloader', () => {
  let query, drop, truncate, migrate, collections, domain, org

  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.error = mockedError
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
  })

  beforeEach(async () => {
    await truncate()
    await collections.organizations.save({
      orgDetails: {
        en: {
          slug: 'communications-security-establishment',
          acronym: 'CSE',
          name: 'Communications Security Establishment',
          zone: 'FED',
          sector: 'DND',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'centre-de-la-securite-des-telecommunications',
          acronym: 'CST',
          name: 'Centre de la Securite des Telecommunications',
          zone: 'FED',
          sector: 'DND',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
    })
    await collections.organizations.save({
      orgDetails: {
        en: {
          slug: 'treasury-board-secretariat',
          acronym: 'TBS',
          name: 'Treasury Board of Canada Secretariat',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'secretariat-conseil-tresor',
          acronym: 'SCT',
          name: 'Secrétariat du Conseil Trésor du Canada',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
    })
    collections.domains.save({
      url: 'test.gc.ca',
    })
    const orgCursor = await query`
      FOR org IN organizations
        FILTER (LOWER("treasury-board-secretariat") == LOWER(TRANSLATE("en", org.orgDetails).slug))
        RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev }, TRANSLATE("en", org.orgDetails))
    `
    const domainCursor = await query`
      FOR domain IN domains
        FILTER domain.url == "test.gc.ca"
        RETURN domain
    `

    org = await orgCursor.next()
    domain = await domainCursor.next()

    collections.claims.save({
      _to: domain._id,
      _from: org._id,
    })
    
    consoleOutput = []
  })

  afterAll(async () => {
    await drop()
  })

  describe('test', () => {
    it('', async () => {
      const cursor = await query`
        FOR domain IN domains
          FILTER domain.url == "test.gc.ca"
          RETURN domain
      `
      const domain = await cursor.next()
      const loader = orgLoaderByDomainId(query, 'en')
      await loader.load(domain._id)
    })
  })
})
